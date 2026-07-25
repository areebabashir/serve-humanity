import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Chapter from "../models/Chapter.js";
import { isTeamHeadRole } from "../lib/teamHeads.js";

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
