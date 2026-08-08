import ChapterTeamDonation from "../models/ChapterTeamDonation.js";
import Chapter from "../models/Chapter.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../middleware/upload.js";
import { isOwnCollectionRole, isTeamHeadRole, TEAM_HEAD_ROLES } from "../lib/teamHeads.js";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TZ = "Asia/Karachi";

function karachiYmd(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function monthBounds(year, month) {
  const pad = (n) => String(n).padStart(2, "0");
  const start = new Date(`${year}-${pad(month)}-01T00:00:00+05:00`);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = new Date(`${nextYear}-${pad(nextMonth)}-01T00:00:00+05:00`);
  return { start, end };
}

function chapterIdOf(user) {
  if (!user?.chapter) return null;
  return user.chapter._id || user.chapter;
}

function isPresident(user) {
  return user?.systemRole === "president" || user?.chapterRole === "president";
}

function isFinanceDirector(user) {
  return user?.chapterRole === "finance_head";
}

/** President / VP — personal donations only, no director team. */
function hasOwnCollection(user) {
  return isPresident(user) || isOwnCollectionRole(user?.chapterRole);
}

/** Donations are verified by Finance Director */
function canVerify(user) {
  return isFinanceDirector(user);
}

function canViewAll(user) {
  return isPresident(user) || isFinanceDirector(user) || user?.chapterRole === "vice_president";
}

async function assertValidTeamHead(headId, chapterId) {
  const head = await User.findById(headId).select("chapter chapterRole name");
  if (!head || String(head.chapter) !== String(chapterId) || !isTeamHeadRole(head.chapterRole)) {
    return null;
  }
  return head;
}

/**
 * Resolve calendar month period from query.
 * Default = current month. Use month=all (or scope=all) for all-time.
 */
function resolvePeriod(query = {}) {
  if (query.month === "all" || query.scope === "all") return null;

  const nowParts = karachiYmd();
  const year = Number(query.year) || nowParts.year;
  const month = Number(query.month) || nowParts.month;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    const { start, end } = monthBounds(nowParts.year, nowParts.month);
    return {
      year: nowParts.year,
      month: nowParts.month,
      label: `${MONTH_NAMES[nowParts.month]} ${nowParts.year}`,
      start,
      end,
    };
  }

  const { start, end } = monthBounds(year, month);
  return {
    year,
    month,
    label: `${MONTH_NAMES[month]} ${year}`,
    start,
    end,
  };
}

function applyPeriodFilter(filter, period) {
  if (!period) return filter;
  filter.createdAt = { $gte: period.start, $lt: period.end };
  return filter;
}

function sumByStatus(rows) {
  const pendingTotal = rows
    .filter((d) => d.status === "pending")
    .reduce((s, d) => s + (d.amount || 0), 0);
  const verifiedTotal = rows
    .filter((d) => d.status === "verified")
    .reduce((s, d) => s + (d.amount || 0), 0);
  return {
    pendingTotal,
    verifiedTotal,
    grandTotal: pendingTotal + verifiedTotal,
  };
}

async function monthHistory(matchFilter) {
  const rows = await ChapterTeamDonation.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          year: { $year: { date: "$createdAt", timezone: TZ } },
          month: { $month: { date: "$createdAt", timezone: TZ } },
        },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] },
        },
        verified: {
          $sum: { $cond: [{ $eq: ["$status", "verified"] }, "$amount", 0] },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, "$amount", 0] },
        },
        total: {
          $sum: {
            $cond: [{ $in: ["$status", ["pending", "verified"]] }, "$amount", 0],
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
  ]);

  return rows.map((r) => ({
    year: r._id.year,
    month: r._id.month,
    label: `${MONTH_NAMES[r._id.month] || r._id.month} ${r._id.year}`,
    pending: r.pending || 0,
    verified: r.verified || 0,
    rejected: r.rejected || 0,
    total: r.total || 0,
    count: r.count || 0,
  }));
}

function periodMeta(period) {
  if (!period) return { scope: "all", label: "All time" };
  return {
    scope: "month",
    year: period.year,
    month: period.month,
    label: period.label,
  };
}

/** Member submits amount + optional screenshot */
export async function createChapterDonation(req, res, next) {
  try {
    const cid = chapterIdOf(req.user);
    if (!cid) {
      return res.status(400).json({
        success: false,
        message: "Your account is not assigned to a chapter.",
      });
    }

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid donation amount greater than 0.",
      });
    }

    let screenshotUrl = "";
    let screenshotPublicId = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file, "serve-humanity/chapter-donations");
      screenshotUrl = result.secure_url;
      screenshotPublicId = result.public_id || "";
    }

    // President / VP donate to their own collection (no team director).
    let teamDirectorId = null;
    if (!hasOwnCollection(req.user)) {
      let teamDirector = req.user.teamDirector || null;
      if (teamDirector && typeof teamDirector === "object") {
        teamDirector = teamDirector._id || teamDirector;
      }
      if (req.body.teamDirector) teamDirector = req.body.teamDirector;

      if (!teamDirector) {
        return res.status(400).json({
          success: false,
          message: "You are not assigned to a director team. Ask your president to assign you.",
        });
      }

      const head = await assertValidTeamHead(teamDirector, cid);
      if (!head) {
        return res.status(400).json({
          success: false,
          message: "Selected director team is invalid for your chapter.",
        });
      }
      teamDirectorId = head._id;
    }

    const doc = await ChapterTeamDonation.create({
      chapter: cid,
      donor: req.user._id,
      teamDirector: teamDirectorId,
      amount,
      screenshotUrl,
      screenshotPublicId,
      note: req.body.note || "",
      status: "pending",
    });

    const populated = await ChapterTeamDonation.findById(doc._id)
      .populate("donor", "name email")
      .populate("teamDirector", "name email chapterRole")
      .populate("chapter", "name city");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/** List donations — scoped by role; totals default to current month */
export async function listChapterDonations(req, res, next) {
  try {
    const cid = chapterIdOf(req.user);
    if (!cid && req.user.systemRole !== "ceo") {
      return res.status(400).json({
        success: false,
        message: "Your account is not assigned to a chapter.",
      });
    }

    const period = resolvePeriod(req.query);
    const baseFilter = {};
    if (cid) baseFilter.chapter = cid;
    if (req.query.chapter && req.user.systemRole === "ceo") {
      baseFilter.chapter = req.query.chapter;
    }

    const { status, mine, directorId } = req.query;
    if (status) baseFilter.status = status;

    if (mine === "1") {
      baseFilter.donor = req.user._id;
    } else if (canViewAll(req.user)) {
      if (directorId) baseFilter.teamDirector = directorId;
    } else if (isTeamHeadRole(req.user.chapterRole)) {
      baseFilter.teamDirector = req.user._id;
    } else {
      baseFilter.donor = req.user._id;
    }

    const listFilter = applyPeriodFilter({ ...baseFilter }, period);
    const historyMatch = { ...baseFilter };
    // history should ignore status filter so month archive is complete
    delete historyMatch.status;

    const [data, byMonth] = await Promise.all([
      ChapterTeamDonation.find(listFilter)
        .populate("donor", "name email chapterRole")
        .populate("teamDirector", "name email chapterRole")
        .populate("verifiedBy", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      monthHistory(historyMatch),
    ]);

    const totals = sumByStatus(data);

    res.json({
      success: true,
      total: data.length,
      ...totals,
      period: periodMeta(period),
      byMonth,
      data,
    });
  } catch (err) {
    next(err);
  }
}

/** Director only: my team collection (president/VP have own collection, not a team). */
export async function myTeamCollection(req, res, next) {
  try {
    const cid = chapterIdOf(req.user);
    if (!cid) {
      return res.status(400).json({
        success: false,
        message: "Your account is not assigned to a chapter.",
      });
    }
    if (!isTeamHeadRole(req.user.chapterRole)) {
      return res.status(403).json({
        success: false,
        message: "Only directors have a team collection.",
      });
    }

    const period = resolvePeriod(req.query);
    const baseFilter = { chapter: cid, teamDirector: req.user._id };
    const listFilter = applyPeriodFilter({ ...baseFilter }, period);

    const [data, byMonth] = await Promise.all([
      ChapterTeamDonation.find(listFilter)
        .populate("donor", "name email")
        .populate("verifiedBy", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      monthHistory(baseFilter),
    ]);

    const totals = sumByStatus(data);

    res.json({
      success: true,
      ...totals,
      period: periodMeta(period),
      byMonth,
      data,
    });
  } catch (err) {
    next(err);
  }
}

/** President / finance: totals grouped by each head/director (current month by default) */
export async function directorTeamTotals(req, res, next) {
  try {
    if (!canViewAll(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const cid = chapterIdOf(req.user);
    if (!cid) {
      return res.status(400).json({
        success: false,
        message: "Your account is not assigned to a chapter.",
      });
    }

    const period = resolvePeriod(req.query);
    const chapterOid = new mongoose.Types.ObjectId(String(cid));
    const match = { chapter: chapterOid };
    if (period) {
      match.createdAt = { $gte: period.start, $lt: period.end };
    }

    const [rows, byMonth] = await Promise.all([
      ChapterTeamDonation.aggregate([
        { $match: match },
        {
          $group: {
            _id: { teamDirector: "$teamDirector", status: "$status" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      monthHistory({ chapter: chapterOid }),
    ]);

    const directors = await User.find({
      chapter: cid,
      chapterRole: { $in: TEAM_HEAD_ROLES },
    })
      .select("name email chapterRole")
      .lean();

    const byDirector = directors.map((d) => {
      const pending = rows.find(
        (r) => String(r._id.teamDirector) === String(d._id) && r._id.status === "pending",
      );
      const verified = rows.find(
        (r) => String(r._id.teamDirector) === String(d._id) && r._id.status === "verified",
      );
      return {
        director: d,
        pendingTotal: pending?.total || 0,
        verifiedTotal: verified?.total || 0,
        pendingCount: pending?.count || 0,
        verifiedCount: verified?.count || 0,
        grandTotal: (pending?.total || 0) + (verified?.total || 0),
      };
    });

    const unassignedPending = rows.find(
      (r) => r._id.teamDirector == null && r._id.status === "pending",
    );
    const unassignedVerified = rows.find(
      (r) => r._id.teamDirector == null && r._id.status === "verified",
    );

    const chapterPending = rows
      .filter((r) => r._id.status === "pending")
      .reduce((s, r) => s + r.total, 0);
    const chapterVerified = rows
      .filter((r) => r._id.status === "verified")
      .reduce((s, r) => s + r.total, 0);

    res.json({
      success: true,
      period: periodMeta(period),
      byMonth,
      chapterPendingTotal: chapterPending,
      chapterVerifiedTotal: chapterVerified,
      chapterGrandTotal: chapterPending + chapterVerified,
      directors: byDirector,
      unassigned: {
        pendingTotal: unassignedPending?.total || 0,
        verifiedTotal: unassignedVerified?.total || 0,
        pendingCount: unassignedPending?.count || 0,
        verifiedCount: unassignedVerified?.count || 0,
        grandTotal: (unassignedPending?.total || 0) + (unassignedVerified?.total || 0),
      },
      canVerify: isFinanceDirector(req.user),
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyChapterDonation(req, res, next) {
  try {
    if (!canVerify(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only the Finance Director can verify donations.",
      });
    }
    const cid = chapterIdOf(req.user);
    const doc = await ChapterTeamDonation.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Donation not found." });
    if (cid && String(doc.chapter) !== String(cid)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const prevStatus = doc.status;
    const status = req.body.status === "rejected" ? "rejected" : "verified";
    doc.status = status;
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
    await doc.save();

    // Keep Chapter.fundsRaised in sync with verified team donations.
    if (prevStatus !== "verified" && status === "verified") {
      await Chapter.findByIdAndUpdate(doc.chapter, {
        $inc: { fundsRaised: doc.amount || 0 },
        $set: { lastActivity: new Date() },
      });
    } else if (prevStatus === "verified" && status === "rejected") {
      await Chapter.findByIdAndUpdate(doc.chapter, {
        $inc: { fundsRaised: -(doc.amount || 0) },
      });
    }

    const populated = await ChapterTeamDonation.findById(doc._id)
      .populate("donor", "name email")
      .populate("teamDirector", "name email chapterRole")
      .populate("verifiedBy", "name email");

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function deleteChapterDonation(req, res, next) {
  try {
    const doc = await ChapterTeamDonation.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Donation not found." });

    const isOwner = String(doc.donor) === String(req.user._id);
    if (!isOwner && !canVerify(req.user) && !isPresident(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    if (isOwner && doc.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending donations can be deleted by the donor.",
      });
    }

    await ChapterTeamDonation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Donation removed." });
  } catch (err) {
    next(err);
  }
}
