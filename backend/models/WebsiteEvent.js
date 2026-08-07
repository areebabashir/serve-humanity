import mongoose from "mongoose";

/**
 * Public website events (home + /events) — managed from CEO dashboard.
 * Separate from chapter operational Event records.
 */
const websiteEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    date: { type: Date, required: true, index: true },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    capacity: { type: String, default: "", trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    published: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

websiteEventSchema.index({ published: 1, date: 1 });

const WebsiteEvent = mongoose.model("WebsiteEvent", websiteEventSchema);
export default WebsiteEvent;
