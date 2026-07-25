import DocumentationFile, { DOC_TYPES } from "../models/DocumentationFile.js";
import { uploadToCloudinary } from "../middleware/upload.js";
import { uploadDocumentationToDrive, googleDriveConfigured } from "../utils/googleDrive.js";

const DOC_BOG = new Set(["ceo", "bog_documentation"]);

function chapterIdOf(user) {
  if (!user?.chapter) return null;
  return user.chapter._id || user.chapter;
}

function applyChapterScope(filter, user) {
  if (DOC_BOG.has(user?.systemRole)) return filter;
  const cid = chapterIdOf(user);
  if (cid) filter.chapter = cid;
  return filter;
}

function sameChapter(user, docChapter) {
  if (DOC_BOG.has(user?.systemRole)) return true;
  const cid = chapterIdOf(user);
  if (!cid) return false;
  return String(docChapter?._id || docChapter || "") === String(cid);
}

export async function listDocs(req, res, next) {
  try {
    const { type, chapter, status, page = 1, limit = 30, q } = req.query;
    const filter = applyChapterScope({}, req.user);
    if (type) filter.type = type;
    if (chapter && DOC_BOG.has(req.user.systemRole)) filter.chapter = chapter;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { caseNumber: new RegExp(q, "i") },
        { title: new RegExp(q, "i") },
        { notes: new RegExp(q, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      DocumentationFile.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .populate("chapter", "name city")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .sort({ createdAt: -1 }),
      DocumentationFile.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: Number(page), data });
  } catch (err) {
    next(err);
  }
}

export async function getDoc(req, res, next) {
  try {
    const doc = await DocumentationFile.findById(req.params.id)
      .populate("chapter", "name city")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");
    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });
    if (!sameChapter(req.user, doc.chapter)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

export async function createDoc(req, res, next) {
  try {
    const { type, title, caseNumber, chapter, fields, attachments, notes, status } = req.body;
    if (!type || !DOC_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Valid document type is required." });
    }

    let chapterId = chapter || null;
    if (!DOC_BOG.has(req.user.systemRole)) {
      chapterId = chapterIdOf(req.user);
      if (!chapterId) {
        return res.status(400).json({
          success: false,
          message: "Your account is not assigned to a chapter.",
        });
      }
    }

    const doc = await DocumentationFile.create({
      type,
      title: title || "",
      caseNumber: caseNumber || "",
      chapter: chapterId,
      fields: fields || {},
      attachments: attachments || [],
      notes: notes || "",
      status: status || "draft",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    const populated = await DocumentationFile.findById(doc._id)
      .populate("chapter", "name city")
      .populate("createdBy", "name email");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function updateDoc(req, res, next) {
  try {
    const existing = await DocumentationFile.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Document not found." });
    if (!sameChapter(req.user, existing.chapter)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const allowed = ["title", "caseNumber", "chapter", "fields", "attachments", "notes", "status"];
    const updates = { updatedBy: req.user._id };
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (!DOC_BOG.has(req.user.systemRole)) {
      updates.chapter = chapterIdOf(req.user);
    }

    const doc = await DocumentationFile.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("chapter", "name city")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

export async function deleteDoc(req, res, next) {
  try {
    const existing = await DocumentationFile.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Document not found." });
    if (!sameChapter(req.user, existing.chapter)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    await DocumentationFile.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Document deleted." });
  } catch (err) {
    next(err);
  }
}

/** Upload a single attachment file for documentation (Cloudinary + optional Google Drive) */
export async function uploadDocAttachment(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

    const {
      docType = "",
      chapterName = "",
      caseNumber = "",
      beneficiaryName = "",
      attachmentKey = "",
    } = req.body || {};

    const result = await uploadToCloudinary(req.file, "serve-humanity/documentation");

    const drive = await uploadDocumentationToDrive({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      docType,
      chapterName,
      caseNumber,
      beneficiaryName,
      attachmentKey,
    });

    res.status(201).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        name: req.file.originalname,
        driveFileId: drive?.driveFileId || "",
        driveWebViewLink: drive?.driveWebViewLink || "",
        drivePath: drive?.drivePath || "",
        driveSynced: Boolean(drive?.driveFileId),
        driveEnabled: googleDriveConfigured(),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Upload a filled-form PDF to Google Drive (no duplicates per document) */
export async function uploadDocPdf(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF uploaded." });
    }

    const {
      docType = "",
      chapterName = "",
      caseNumber = "",
      beneficiaryName = "",
      docId = "",
    } = req.body || {};

    // Skip duplicate if this document already has a Drive PDF
    if (docId) {
      const existing = await DocumentationFile.findById(docId).select(
        "pdfDriveFileId pdfDriveWebViewLink pdfDrivePath pdfDriveUploadedAt",
      );
      if (existing?.pdfDriveFileId) {
        return res.status(200).json({
          success: true,
          data: {
            alreadyUploaded: true,
            driveFileId: existing.pdfDriveFileId,
            driveWebViewLink: existing.pdfDriveWebViewLink || "",
            drivePath: existing.pdfDrivePath || "",
            driveSynced: true,
            driveEnabled: googleDriveConfigured(),
          },
        });
      }
    }

    const drive = await uploadDocumentationToDrive({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype || "application/pdf",
      originalName: req.file.originalname || "form.pdf",
      docType,
      chapterName,
      caseNumber,
      beneficiaryName,
      attachmentKey: "Form PDF",
    });

    if (!drive?.driveFileId) {
      return res.status(502).json({
        success: false,
        message: "Google Drive upload failed. Check backend Drive settings.",
      });
    }

    if (docId) {
      await DocumentationFile.findByIdAndUpdate(docId, {
        pdfDriveFileId: drive.driveFileId,
        pdfDriveWebViewLink: drive.driveWebViewLink || "",
        pdfDrivePath: drive.drivePath || "",
        pdfDriveUploadedAt: new Date(),
        updatedBy: req.user._id,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        alreadyUploaded: false,
        name: req.file.originalname,
        driveFileId: drive.driveFileId,
        driveWebViewLink: drive.driveWebViewLink || "",
        drivePath: drive.drivePath || "",
        driveSynced: true,
        driveEnabled: googleDriveConfigured(),
      },
    });
  } catch (err) {
    console.error("[PDF] uploadDocPdf error:", err);
    next(err);
  }
}

export async function getDocStats(req, res, next) {
  try {
    const byType = await DocumentationFile.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({
      success: true,
      data: Object.fromEntries(byType.map((x) => [x._id, x.count])),
    });
  } catch (err) {
    next(err);
  }
}
