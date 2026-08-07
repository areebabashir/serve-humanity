import WebsiteEvent from "../models/WebsiteEvent.js";
import EventRegistration from "../models/EventRegistration.js";
import { sendEmail } from "../utils/email.js";

function formatPublicEvent(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  const dateObj = d.date ? new Date(d.date) : null;
  const days =
    dateObj && !Number.isNaN(dateObj.getTime())
      ? Math.max(0, Math.ceil((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;
  const dateLabel = dateObj
    ? dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).toUpperCase()
    : "";
  return {
    id: String(d._id),
    title: d.title,
    date: dateLabel,
    dateIso: dateObj ? dateObj.toISOString() : null,
    location: d.location,
    capacity: d.capacity || "",
    description: d.description || "",
    days,
  };
}

/** GET /website-events/public — all published (upcoming first, then past). */
export async function listPublicEvents(req, res, next) {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Prefer upcoming; if fewer than `limit`, fill with recent past so the page is not empty.
    const upcoming = await WebsiteEvent.find({
      published: true,
      date: { $gte: now },
    })
      .sort({ date: 1, sortOrder: 1 })
      .limit(limit)
      .lean();

    let docs = upcoming;
    if (docs.length < limit) {
      const past = await WebsiteEvent.find({
        published: true,
        date: { $lt: now },
      })
        .sort({ date: -1, sortOrder: 1 })
        .limit(limit - docs.length)
        .lean();
      docs = [...docs, ...past];
    }

    res.json({ success: true, data: docs.map(formatPublicEvent) });
  } catch (err) {
    next(err);
  }
}

/** POST /website-events/:id/register */
export async function registerForEvent(req, res, next) {
  try {
    const event = await WebsiteEvent.findById(req.params.id);
    if (!event || !event.published) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    if (event.date < dayStart) {
      return res.status(400).json({
        success: false,
        message: "This event has already ended. Registration is closed.",
      });
    }
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const phone = String(req.body?.phone || "").trim();
    const note = String(req.body?.note || "").trim();
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required." });
    }

    await EventRegistration.create({
      event: event._id,
      name,
      email,
      phone,
      note,
    });

    await sendEmail({
      to: email,
      subject: `Registration received — ${event.title}`,
      html: `<p>Dear ${name},</p>
             <p>Thank you for registering for <strong>${event.title}</strong> in ${event.location}.</p>
             <p>We will share more details closer to the event date.</p>
             <p>— Serve Humanity Team</p>`,
    }).catch((e) => console.warn("Event registration email failed:", e.message));

    res.status(201).json({
      success: true,
      message: "You’re registered. Check your email for confirmation.",
    });
  } catch (err) {
    next(err);
  }
}

/** GET /website-events — CEO list */
export async function listEvents(req, res, next) {
  try {
    const { published } = req.query;
    const filter = {};
    if (published === "true") filter.published = true;
    if (published === "false") filter.published = false;
    const data = await WebsiteEvent.find(filter).sort({ date: 1, createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /website-events */
export async function createEvent(req, res, next) {
  try {
    const title = String(req.body?.title || "").trim();
    const location = String(req.body?.location || "").trim();
    const capacity = String(req.body?.capacity || "").trim();
    const description = String(req.body?.description || "").trim();
    const dateRaw = req.body?.date;
    if (!title || !location || !dateRaw) {
      return res.status(400).json({
        success: false,
        message: "Title, date, and location are required.",
      });
    }
    const date = new Date(dateRaw);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date." });
    }
    const doc = await WebsiteEvent.create({
      title,
      location,
      capacity,
      description,
      date,
      published: req.body?.published !== false,
      sortOrder: Number(req.body?.sortOrder) || 0,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

/** PATCH /website-events/:id */
export async function updateEvent(req, res, next) {
  try {
    const updates = {};
    if (req.body?.title != null) updates.title = String(req.body.title).trim();
    if (req.body?.location != null) updates.location = String(req.body.location).trim();
    if (req.body?.capacity != null) updates.capacity = String(req.body.capacity).trim();
    if (req.body?.description != null) updates.description = String(req.body.description).trim();
    if (req.body?.published != null) updates.published = Boolean(req.body.published);
    if (req.body?.sortOrder != null) updates.sortOrder = Number(req.body.sortOrder) || 0;
    if (req.body?.date != null) {
      const date = new Date(req.body.date);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date." });
      }
      updates.date = date;
    }
    const doc = await WebsiteEvent.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ success: false, message: "Event not found." });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

/** DELETE /website-events/:id */
export async function deleteEvent(req, res, next) {
  try {
    const doc = await WebsiteEvent.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Event not found." });
    await EventRegistration.deleteMany({ event: doc._id });
    res.json({ success: true, message: "Event deleted." });
  } catch (err) {
    next(err);
  }
}

/** GET /website-events/:id/registrations */
export async function listRegistrations(req, res, next) {
  try {
    const data = await EventRegistration.find({ event: req.params.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
