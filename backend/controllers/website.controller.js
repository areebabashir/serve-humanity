import SiteContent, { WEBSITE_PAGES } from "../models/SiteContent.js";
import { DEFAULT_WEBSITE_CONTENT } from "../data/websiteDefaults.js";
import { uploadToCloudinary } from "../middleware/upload.js";

const WEBSITE_EDITORS = new Set(["ceo", "bog_media"]);

function canEditWebsite(user) {
  return WEBSITE_EDITORS.has(user?.systemRole);
}

/** Public: all published pages (or one page). */
export async function getPublicWebsite(req, res, next) {
  try {
    const { page } = req.query;
    if (page) {
      if (!WEBSITE_PAGES.includes(page)) {
        return res.status(400).json({ success: false, message: "Invalid page." });
      }
      let doc = await SiteContent.findOne({ page, published: true }).lean();
      if (!doc) {
        // Return defaults so the site never breaks before seeding
        doc = {
          page,
          sections: DEFAULT_WEBSITE_CONTENT[page] || {},
          published: true,
        };
      }
      return res.json({ success: true, data: doc });
    }

    const docs = await SiteContent.find({ published: true }).lean();
    const byPage = Object.fromEntries(docs.map((d) => [d.page, d]));
    const data = WEBSITE_PAGES.map((p) => {
      if (byPage[p]) return byPage[p];
      return {
        page: p,
        sections: DEFAULT_WEBSITE_CONTENT[p] || {},
        published: true,
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** Admin: list all pages (including unpublished). */
export async function listWebsitePages(req, res, next) {
  try {
    if (!canEditWebsite(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const docs = await SiteContent.find()
      .populate("updatedBy", "name email")
      .sort({ page: 1 })
      .lean();
    const byPage = Object.fromEntries(docs.map((d) => [d.page, d]));
    const data = WEBSITE_PAGES.map((p) => {
      if (byPage[p]) return byPage[p];
      return {
        _id: null,
        page: p,
        sections: DEFAULT_WEBSITE_CONTENT[p] || {},
        published: true,
        updatedAt: null,
        updatedBy: null,
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getWebsitePage(req, res, next) {
  try {
    if (!canEditWebsite(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const { page } = req.params;
    if (!WEBSITE_PAGES.includes(page)) {
      return res.status(400).json({ success: false, message: "Invalid page." });
    }
    let doc = await SiteContent.findOne({ page })
      .populate("updatedBy", "name email")
      .lean();
    if (!doc) {
      doc = {
        _id: null,
        page,
        sections: DEFAULT_WEBSITE_CONTENT[page] || {},
        published: true,
        updatedAt: null,
        updatedBy: null,
      };
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

/** Upsert a page's sections. */
export async function upsertWebsitePage(req, res, next) {
  try {
    if (!canEditWebsite(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const { page } = req.params;
    if (!WEBSITE_PAGES.includes(page)) {
      return res.status(400).json({ success: false, message: "Invalid page." });
    }

    const { sections, published } = req.body;
    if (sections == null || typeof sections !== "object") {
      return res.status(400).json({ success: false, message: "sections object is required." });
    }

    const updates = {
      sections,
      updatedBy: req.user._id,
    };
    if (typeof published === "boolean") updates.published = published;

    const doc = await SiteContent.findOneAndUpdate(
      { page },
      { $set: updates, $setOnInsert: { page } },
      { new: true, upsert: true, runValidators: true },
    ).populate("updatedBy", "name email");

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

/** Seed all pages from defaults (idempotent — only fills missing pages). */
export async function seedWebsiteDefaults(req, res, next) {
  try {
    if (!canEditWebsite(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    let created = 0;
    for (const page of WEBSITE_PAGES) {
      const existing = await SiteContent.findOne({ page });
      if (existing) continue;
      await SiteContent.create({
        page,
        sections: DEFAULT_WEBSITE_CONTENT[page] || {},
        published: true,
        updatedBy: req.user._id,
      });
      created += 1;
    }
    res.json({
      success: true,
      message: created ? `Seeded ${created} page(s).` : "All pages already exist.",
      created,
    });
  } catch (err) {
    next(err);
  }
}

/** Upload a gallery (or site) image to Cloudinary. */
export async function uploadWebsiteImage(req, res, next) {
  try {
    if (!canEditWebsite(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded." });
    }
    const mime = String(req.file.mimetype || "").toLowerCase();
    if (!/^image\//.test(mime)) {
      return res.status(400).json({ success: false, message: "Only image files are allowed." });
    }
    const result = await uploadToCloudinary(req.file, "serve-humanity/website/gallery");
    res.status(201).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Reset one page to defaults. */
export async function resetWebsitePage(req, res, next) {
  try {
    if (!canEditWebsite(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const { page } = req.params;
    if (!WEBSITE_PAGES.includes(page)) {
      return res.status(400).json({ success: false, message: "Invalid page." });
    }
    const doc = await SiteContent.findOneAndUpdate(
      { page },
      {
        $set: {
          sections: DEFAULT_WEBSITE_CONTENT[page] || {},
          published: true,
          updatedBy: req.user._id,
        },
        $setOnInsert: { page },
      },
      { new: true, upsert: true },
    ).populate("updatedBy", "name email");
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}
