import mongoose from "mongoose";
import Chapter from "../models/Chapter.js";
import User, { CEO_DASHBOARD_ROLES } from "../models/User.js";
import Member from "../models/Member.js";
import Donation from "../models/Donation.js";
import ChapterTeamDonation from "../models/ChapterTeamDonation.js";
import WelfareCase from "../models/WelfareCase.js";
import { TEAM_HEAD_ROLES } from "../lib/teamHeads.js";

const PRESIDENT_FIELDS = "name email phone avatar systemRole chapterRole lastLogin isActive";

export async function getAllChapters(req, res, next) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const chapters = await Chapter.find(filter)
      .populate("president", PRESIDENT_FIELDS)
      .sort({ name: 1 });
    res.json({ success: true, total: chapters.length, data: chapters });
  } catch (err) {
    next(err);
  }
}

/** Public website listing — active chapters only, display fields. */
export async function getPublicChapters(req, res, next) {
  try {
    const chapters = await Chapter.find({ status: "active" })
      .populate("president", "name")
      .sort({ city: 1, name: 1 })
      .lean();

    const data = chapters.map((c) => ({
      id: String(c._id),
      name: c.name,
      city: c.city,
      president: c.president?.name || "TBD",
      members: c.memberCount ?? 0,
      projects: c.casesClosed ?? 0,
      events: c.totalEvents ?? 0,
      fundsRaised: c.fundsRaised ?? 0,
    }));

    res.json({ success: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
}

export async function getChapter(req, res, next) {
  try {
    const chapter = await Chapter.findById(req.params.id).populate("president", PRESIDENT_FIELDS);
    if (!chapter) return res.status(404).json({ success: false, message: "Chapter not found." });
    res.json({ success: true, data: chapter });
  } catch (err) {
    next(err);
  }
}

/** Public: heads/directors available to join when registering for a chapter */
export async function getChapterHeads(req, res, next) {
  try {
    const chapter = await Chapter.findById(req.params.id).select("_id name status");
    if (!chapter) return res.status(404).json({ success: false, message: "Chapter not found." });

    const heads = await User.find({
      chapter: chapter._id,
      chapterRole: { $in: TEAM_HEAD_ROLES },
      isActive: true,
    })
      .select("name chapterRole")
      .sort({ chapterRole: 1, name: 1 })
      .lean();

    res.json({ success: true, data: heads });
  } catch (err) {
    next(err);
  }
}

export async function createChapter(req, res, next) {
  try {
    const {
      name,
      city,
      monthlyBudget,
      budgetThreshold,
      established,
      status,
      president,
      presidentName,
      presidentEmail,
      presidentPassword,
    } = req.body;

    if (!name?.trim() || !city?.trim()) {
      return res.status(400).json({ success: false, message: "Name and city are required." });
    }

    let presidentId = president || null;

    if (presidentEmail) {
      const email = String(presidentEmail).toLowerCase().trim();
      let user = await User.findOne({ email });

      if (user) {
        if (CEO_DASHBOARD_ROLES.includes(user.systemRole)) {
          return res.status(400).json({
            success: false,
            message: "That email belongs to a CEO/Board account and cannot be a chapter president.",
          });
        }
        presidentId = user._id;
      } else {
        if (!presidentName?.trim()) {
          return res.status(400).json({
            success: false,
            message: "President name is required when creating a new president account.",
          });
        }
        user = await User.create({
          name: String(presidentName).trim(),
          email,
          password: presidentPassword || "ChangeMe123!",
          systemRole: "president",
          chapterRole: "president",
        });
        presidentId = user._id;
      }
    }

    const chapter = await Chapter.create({
      name: String(name).trim(),
      city: String(city).trim(),
      president: presidentId,
      status: status === "inactive" ? "inactive" : "active",
      established: established ? new Date(established) : new Date(),
      monthlyBudget: Number(monthlyBudget) > 0 ? Number(monthlyBudget) : 800000,
      budgetThreshold: Number(budgetThreshold) > 0 ? Number(budgetThreshold) : 100000,
    });

    if (presidentId) {
      await User.findByIdAndUpdate(presidentId, {
        chapter: chapter._id,
        systemRole: "president",
        chapterRole: "president",
        teamDirector: null,
      });
    }

    const populated = await Chapter.findById(chapter._id).populate("president", PRESIDENT_FIELDS);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function mapMonthRows(rows) {
  return rows.map((r) => ({
    year: r._id.year,
    month: r._id.month,
    label: `${MONTH_NAMES[r._id.month] || r._id.month} ${r._id.year}`,
    total: r.total || 0,
    verified: r.verified || 0,
    pending: r.pending || 0,
    count: r.count || 0,
  }));
}

/** CEO/Board: full chapter profile — team, members, month-wise donations, president contact */
export async function getChapterDetails(req, res, next) {
  try {
    const chapter = await Chapter.findById(req.params.id).populate("president", PRESIDENT_FIELDS);
    if (!chapter) return res.status(404).json({ success: false, message: "Chapter not found." });

    const chapterOid = new mongoose.Types.ObjectId(String(chapter._id));

    const monthGroup = {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      },
      total: { $sum: "$amount" },
      count: { $sum: 1 },
    };

    const [
      team,
      members,
      teamDonationMonths,
      publicDonationMonths,
      teamStatusTotals,
      activeCases,
      recentTeamDonations,
    ] = await Promise.all([
      User.find({ chapter: chapterOid })
        .select("name email phone chapterRole systemRole teamDirector lastLogin avatar isActive")
        .populate("teamDirector", "name email chapterRole")
        .sort({ chapterRole: 1, name: 1 })
        .lean(),
      Member.find({ chapter: chapterOid }).sort({ joinedAt: -1 }).lean(),
      ChapterTeamDonation.aggregate([
        { $match: { chapter: chapterOid } },
        {
          $group: {
            ...monthGroup,
            verified: {
              $sum: { $cond: [{ $eq: ["$status", "verified"] }, "$amount", 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] },
            },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
      ]),
      Donation.aggregate([
        { $match: { chapter: chapterOid } },
        { $group: monthGroup },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
      ]),
      ChapterTeamDonation.aggregate([
        { $match: { chapter: chapterOid } },
        { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      WelfareCase.countDocuments({
        chapter: chapterOid,
        status: { $nin: ["closed", "rejected"] },
      }),
      ChapterTeamDonation.find({ chapter: chapterOid })
        .populate("donor", "name email chapterRole")
        .populate("teamDirector", "name email chapterRole")
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
    ]);

    const donationTotals = { pending: 0, verified: 0, rejected: 0, count: 0 };
    for (const row of teamStatusTotals) {
      const key = row._id || "pending";
      if (key in donationTotals) donationTotals[key] = row.total || 0;
      donationTotals.count += row.count || 0;
    }

    res.json({
      success: true,
      data: {
        chapter,
        president: chapter.president || null,
        team,
        members,
        activeCases,
        donationTotals: {
          ...donationTotals,
          grandTotal: (donationTotals.pending || 0) + (donationTotals.verified || 0),
        },
        teamDonationsByMonth: mapMonthRows(teamDonationMonths),
        publicDonationsByMonth: mapMonthRows(publicDonationMonths),
        recentTeamDonations,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** CEO: assign a chapter user as president; optionally deactivate the previous president */
export async function assignChapterPresident(req, res, next) {
  try {
    const { presidentId, deactivatePrevious = true, deactivateOnly = false } = req.body;
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: "Chapter not found." });

    const previousPresidentId = chapter.president ? String(chapter.president) : null;

    // Deactivate current president without assigning a replacement
    if (deactivateOnly) {
      if (!previousPresidentId) {
        return res.status(400).json({ success: false, message: "This chapter has no president to deactivate." });
      }

      await User.findByIdAndUpdate(previousPresidentId, {
        isActive: false,
        systemRole: "member",
        chapterRole: "member",
        teamDirector: null,
      });

      chapter.president = null;
      chapter.lastActivity = new Date();
      await chapter.save();

      const populated = await Chapter.findById(chapter._id).populate("president", PRESIDENT_FIELDS);
      return res.json({
        success: true,
        message: "President deactivated.",
        data: populated,
      });
    }

    if (!presidentId) {
      return res.status(400).json({
        success: false,
        message: "Select a chapter user to make president.",
      });
    }

    const nextPresident = await User.findById(presidentId);
    if (!nextPresident) {
      return res.status(404).json({ success: false, message: "Selected user was not found." });
    }
    if (String(nextPresident.chapter) !== String(chapter._id)) {
      return res.status(400).json({
        success: false,
        message: "Selected user must already belong to this chapter.",
      });
    }
    if (CEO_DASHBOARD_ROLES.includes(nextPresident.systemRole)) {
      return res.status(400).json({
        success: false,
        message: "CEO/Board accounts cannot be chapter presidents.",
      });
    }

    // Demote any existing presidents in this chapter (except the new one)
    const demoteFilter = {
      chapter: chapter._id,
      _id: { $ne: nextPresident._id },
      $or: [{ systemRole: "president" }, { chapterRole: "president" }],
    };
    const demoteUpdate = {
      systemRole: "member",
      chapterRole: "member",
      teamDirector: null,
    };
    if (deactivatePrevious) {
      demoteUpdate.isActive = false;
    }
    await User.updateMany(demoteFilter, { $set: demoteUpdate });

    // Also demote previous chapter.president pointer if they weren't caught above
    if (previousPresidentId && previousPresidentId !== String(nextPresident._id)) {
      await User.findByIdAndUpdate(previousPresidentId, {
        systemRole: "member",
        chapterRole: "member",
        teamDirector: null,
        ...(deactivatePrevious ? { isActive: false } : {}),
      });
    }

    nextPresident.systemRole = "president";
    nextPresident.chapterRole = "president";
    nextPresident.teamDirector = null;
    nextPresident.isActive = true;
    nextPresident.chapter = chapter._id;
    await nextPresident.save();

    chapter.president = nextPresident._id;
    chapter.lastActivity = new Date();
    await chapter.save();

    // Keep member roster in sync when emails match
    await Member.updateMany(
      { chapter: chapter._id, role: "president" },
      { $set: { role: "member" } },
    );
    await Member.findOneAndUpdate(
      { chapter: chapter._id, email: nextPresident.email },
      { $set: { role: "president", status: "active", name: nextPresident.name } },
      { upsert: false },
    );

    const populated = await Chapter.findById(chapter._id).populate("president", PRESIDENT_FIELDS);
    res.json({
      success: true,
      message: "President updated.",
      data: populated,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateChapter(req, res, next) {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!chapter) return res.status(404).json({ success: false, message: "Chapter not found." });

    // Real-time push
    req.app.get("io")?.to(`chapter:${chapter._id}`).emit("chapter:updated", chapter);

    res.json({ success: true, data: chapter });
  } catch (err) {
    next(err);
  }
}

export async function deleteChapter(req, res, next) {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter not found." });
    }

    const chapterId = chapter._id;

    // Unlink users from this chapter (keep accounts; clear chapter assignment)
    await User.updateMany(
      { chapter: chapterId },
      { $set: { chapter: null, chapterRole: "member" } },
    );

    // Clear president role if they were chapter president
    if (chapter.president) {
      await User.updateOne(
        { _id: chapter.president, systemRole: "president" },
        { $set: { systemRole: "member" } },
      );
    }

    await Chapter.findByIdAndDelete(chapterId);

    res.json({ success: true, message: "Chapter deleted." });
  } catch (err) {
    next(err);
  }
}

export async function getChapterStats(req, res, next) {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: "Chapter not found." });

    const [memberCount, activeCases, totalDonations] = await Promise.all([
      Member.countDocuments({ chapter: chapter._id, status: "active" }),
      WelfareCase.countDocuments({ chapter: chapter._id, status: { $nin: ["closed", "rejected"] } }),
      Donation.aggregate([
        { $match: { chapter: chapter._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        memberCount,
        activeCases,
        totalDonations: totalDonations[0]?.total ?? 0,
        monthlyBudget: chapter.monthlyBudget,
        monthlySpent: chapter.monthlySpent,
        budgetThreshold: chapter.budgetThreshold,
      },
    });
  } catch (err) {
    next(err);
  }
}
