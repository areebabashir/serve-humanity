import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Chapter from "../models/Chapter.js";
import { isTeamHeadRole } from "../lib/teamHeads.js";
import { sendEmail } from "../utils/email.js";
import { buildPasswordResetEmail } from "../utils/emailTemplates.js";

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

async function loadAuthUser(userId) {
  return User.findById(userId)
    .select("-password")
    .populate("chapter", "name city")
    .populate("teamDirector", "name email chapterRole");
}

async function sendToken(user, statusCode, res) {
  const token = signToken(user._id);
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  const populated = await loadAuthUser(user._id);
  res.status(statusCode).json({ success: true, token, user: populated });
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateResetCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function register(req, res, next) {
  try {
    const { name, email, password, chapter, teamDirector } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }
    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }
    if (!chapter) {
      return res.status(400).json({
        success: false,
        message: "Please select a chapter.",
      });
    }
    if (!teamDirector) {
      return res.status(400).json({
        success: false,
        message: "Please select a director team.",
      });
    }

    const chapterDoc = await Chapter.findById(chapter);
    if (!chapterDoc) {
      return res.status(400).json({ success: false, message: "Selected chapter was not found." });
    }
    if (chapterDoc.status && chapterDoc.status !== "active") {
      return res.status(400).json({ success: false, message: "Selected chapter is not active." });
    }

    const head = await User.findById(teamDirector).select("chapter chapterRole name");
    if (
      !head ||
      String(head.chapter) !== String(chapterDoc._id) ||
      !isTeamHeadRole(head.chapterRole)
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected director team is invalid for this chapter.",
      });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password,
      systemRole: "member",
      chapterRole: "member",
      chapter: chapterDoc._id,
      teamDirector: head._id,
    });

    await sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Contact your organization admin.",
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: "Logged out." });
}

export async function me(req, res) {
  res.json({ success: true, user: req.user });
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    await sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
}

/** POST /auth/forgot-password — { email } */
export async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const generic = {
      success: true,
      message: "If an account exists for that email, a reset code has been sent.",
    };

    const user = await User.findOne({ email }).select(
      "+passwordResetToken +passwordResetExpires name email isActive",
    );

    if (!user || user.isActive === false) {
      return res.json(generic);
    }

    const code = generateResetCode();
    const expiresMinutes = 30;
    user.passwordResetToken = hashResetToken(code);
    user.passwordResetExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const mail = buildPasswordResetEmail({
      name: user.name,
      code,
      expiresMinutes,
    });

    try {
      const result = await sendEmail({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        attachments: mail.attachments,
      });
      if (!result) {
        console.warn("Password reset email skipped — SMTP not configured.");
      }
    } catch (err) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });
      console.error("Password reset email failed:", err?.message || err);
      return res.status(500).json({
        success: false,
        message: "Could not send reset email. Please try again later.",
      });
    }

    res.json(generic);
  } catch (err) {
    next(err);
  }
}

/** POST /auth/reset-password — { email, code, password } */
export async function resetPassword(req, res, next) {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const code = String(req.body?.code || req.body?.token || "").replace(/\s+/g, "");
    const { password } = req.body || {};

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, reset code, and new password are required.",
      });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Reset code must be 6 digits.",
      });
    }
    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const hashed = hashResetToken(code);
    const user = await User.findOne({
      email,
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset code is invalid or has expired. Please request a new one.",
      });
    }

    user.password = password;
    user.passwordChangedAt = new Date();
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (err) {
    next(err);
  }
}
