import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Org / system roles:
 * - CEO dashboard: ceo, founder, cto, coo + bog_*
 * - Full access (everything): ceo, founder, cto, coo
 * - Chapter dashboard: president | member
 * - Public site: public
 *
 * Chapter operational roles live in chapterRole (president, finance_head, etc.)
 */
export const SYSTEM_ROLES = [
  "ceo",
  "founder",
  "cto",
  "coo",
  "bog_verification",
  "bog_operations",
  "bog_media",
  "bog_finance",
  "bog_documentation",
  "president",
  "member",
  "public",
];

export const CHAPTER_ROLES = [
  "president",
  "vice_president",
  "finance_head",
  "operations_head",
  "verification_head",
  "documentation_head",
  "hr_head",
  "media_head",
  "it_head",
  "fundraising_head",
  "event_head",
  "director",
  "assistant_director",
  "member",
];

/** Roles with complete CEO-dashboard access (all modules + admin actions) */
export const FULL_ACCESS_ROLES = ["ceo", "founder", "cto", "coo"];

export const CEO_DASHBOARD_ROLES = [
  "ceo",
  "founder",
  "cto",
  "coo",
  "bog_verification",
  "bog_operations",
  "bog_media",
  "bog_finance",
  "bog_documentation",
];

export function isFullAccessRole(role) {
  return FULL_ACCESS_ROLES.includes(role);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    systemRole: {
      type: String,
      enum: SYSTEM_ROLES,
      default: "public",
    },
    chapterRole: {
      type: String,
      enum: CHAPTER_ROLES,
      default: "member",
    },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", default: null },
    /** Director this member belongs to (team collection rollup) */
    teamDirector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
