import TeamRecord, { TEAM_RECORD_KINDS } from "../models/TeamRecord.js";

const BOG_EDITORS = new Set([
  "ceo",
  "bog_verification",
  "bog_operations",
  "bog_media",
]);
const CHAPTER_LEADERSHIP = new Set(["president", "vice_president", "director"]);

function chapterIdOf(user) {
  if (!user?.chapter) return null;
  return user.chapter._id || user.chapter;
}

function isBogEditor(user) {
  return BOG_EDITORS.has(user?.systemRole);
}

function isChapterAppUser(user) {
  return user?.systemRole === "president" || user?.systemRole === "member";
}

function canReadKind(user, kind) {
  if (isBogEditor(user)) return true;
  if (!isChapterAppUser(user)) return false;
  if (user.systemRole === "president" || CHAPTER_LEADERSHIP.has(user.chapterRole)) return true;
  if (kind === "verification") return user.chapterRole === "verification_head";
  if (kind === "operation") return user.chapterRole === "operations_head";
  if (kind === "media") return user.chapterRole === "media_head";
  return (
    user.chapterRole === "verification_head" ||
    user.chapterRole === "operations_head" ||
    user.chapterRole === "media_head"
  );
}

function canWriteKind(user, kind) {
  if (user?.systemRole === "ceo") return true;
  if (kind === "verification" && user?.systemRole === "bog_verification") return true;
  if (kind === "operation" && user?.systemRole === "bog_operations") return true;
  if (kind === "media" && user?.systemRole === "bog_media") return true;
  if (!isChapterAppUser(user)) return false;
  if (user.systemRole === "president" || CHAPTER_LEADERSHIP.has(user.chapterRole)) return true;
  if (kind === "verification") return user.chapterRole === "verification_head";
  if (kind === "operation") return user.chapterRole === "operations_head";
  if (kind === "media") return user.chapterRole === "media_head";
  return false;
}

function applyChapterScope(filter, user) {
  if (isBogEditor(user)) return filter;
  const cid = chapterIdOf(user);
  if (cid) filter.chapter = cid;
  return filter;
}

function sameChapter(user, docChapter) {
  if (isBogEditor(user)) return true;
  const cid = chapterIdOf(user);
  if (!cid) return false;
  return String(docChapter?._id || docChapter || "") === String(cid);
}

async function nextSrNo(kind, chapterId) {
  const filter = { kind };
  if (chapterId) filter.chapter = chapterId;
  else filter.$or = [{ chapter: null }, { chapter: { $exists: false } }];

  const last = await TeamRecord.findOne(filter).sort({ srNo: -1 }).select("srNo").lean();
  return (last?.srNo || 0) + 1;
}

export async function listTeamRecords(req, res, next) {
  try {
    const { kind, chapter } = req.query;
    if (kind && !TEAM_RECORD_KINDS.includes(kind)) {
      return res.status(400).json({ success: false, message: "Invalid kind." });
    }
    if (!canReadKind(req.user, kind || null)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const filter = applyChapterScope({}, req.user);
    if (kind) filter.kind = kind;
    if (chapter && isBogEditor(req.user)) filter.chapter = chapter;

    if (
      !kind &&
      !isBogEditor(req.user) &&
      !CHAPTER_LEADERSHIP.has(req.user.chapterRole) &&
      req.user.systemRole !== "president"
    ) {
      if (req.user.chapterRole === "verification_head") filter.kind = "verification";
      if (req.user.chapterRole === "operations_head") filter.kind = "operation";
      if (req.user.chapterRole === "media_head") filter.kind = "media";
    }

    const sort =
      kind === "verification" || kind === "media"
        ? { srNo: 1, createdAt: 1 }
        : { createdAt: -1 };

    const data = await TeamRecord.find(filter)
      .populate("chapter", "name city")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sort)
      .lean();

    res.json({ success: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
}

export async function createTeamRecord(req, res, next) {
  try {
    const { kind } = req.body;
    if (!TEAM_RECORD_KINDS.includes(kind)) {
      return res.status(400).json({ success: false, message: "Invalid kind." });
    }
    if (!canWriteKind(req.user, kind)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    let chapterId = null;
    if (isBogEditor(req.user)) {
      chapterId = req.body.chapter || null;
    } else {
      chapterId = chapterIdOf(req.user);
      if (!chapterId) {
        return res.status(400).json({
          success: false,
          message: "Your account is not assigned to a chapter.",
        });
      }
    }

    const payload = {
      kind,
      chapter: chapterId,
      notes: req.body.notes || "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    if (kind === "verification") {
      payload.srNo = await nextSrNo("verification", chapterId);
      payload.caseDate = req.body.caseDate || "";
      payload.caseType = req.body.caseType || "";
      payload.referenceName = req.body.referenceName || "";
      payload.referenceContact = req.body.referenceContact || "";
      payload.caseStatus = req.body.caseStatus || "unverified";
      payload.runStatus = req.body.runStatus || "Not Run";
      payload.paymentStatus = req.body.paymentStatus || "";
      payload.verifiedByMember = req.body.verifiedByMember || "";
    } else if (kind === "media") {
      payload.srNo = await nextSrNo("media", chapterId);
      payload.caseDate = req.body.caseDate || req.body.date || "";
      payload.refNo = req.body.refNo || "";
      payload.description = req.body.description || "";
    } else {
      payload.caseNumber = req.body.caseNumber || "";
      payload.familyGuardianName = req.body.familyGuardianName || "";
      payload.city = req.body.city || "";
      payload.rashanStatus = req.body.rashanStatus || "Not Delivered";
    }

    const doc = await TeamRecord.create(payload);
    const populated = await TeamRecord.findById(doc._id)
      .populate("chapter", "name city")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function updateTeamRecord(req, res, next) {
  try {
    const doc = await TeamRecord.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Record not found." });

    if (!canWriteKind(req.user, doc.kind) || !sameChapter(req.user, doc.chapter)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (doc.kind === "verification") {
      const fields = [
        "caseDate",
        "caseType",
        "referenceName",
        "referenceContact",
        "caseStatus",
        "runStatus",
        "paymentStatus",
        "verifiedByMember",
        "notes",
      ];
      for (const f of fields) {
        if (req.body[f] !== undefined) doc[f] = req.body[f];
      }
    } else if (doc.kind === "media") {
      if (req.body.caseDate !== undefined) doc.caseDate = req.body.caseDate;
      if (req.body.date !== undefined) doc.caseDate = req.body.date;
      if (req.body.refNo !== undefined) doc.refNo = req.body.refNo;
      if (req.body.description !== undefined) doc.description = req.body.description;
      if (req.body.notes !== undefined) doc.notes = req.body.notes;
    } else {
      const fields = ["caseNumber", "familyGuardianName", "city", "rashanStatus", "notes"];
      for (const f of fields) {
        if (req.body[f] !== undefined) doc[f] = req.body[f];
      }
    }

    doc.updatedBy = req.user._id;
    await doc.save();

    const populated = await TeamRecord.findById(doc._id)
      .populate("chapter", "name city")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function deleteTeamRecord(req, res, next) {
  try {
    const doc = await TeamRecord.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Record not found." });

    if (!canWriteKind(req.user, doc.kind) || !sameChapter(req.user, doc.chapter)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    await TeamRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Record deleted." });
  } catch (err) {
    next(err);
  }
}
