import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    /** Public chapter card / map photo (Cloudinary). */
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    president: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    established: { type: Date, default: null },
    monthlyBudget: { type: Number, default: 800000 },
    budgetThreshold: { type: Number, default: 100000 },
    monthlySpent: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    casesClosed: { type: Number, default: 0 },
    fundsRaised: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
    lastActivity: { type: Date, default: null },
  },
  { timestamps: true }
);

const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
