import User, { CEO_DASHBOARD_ROLES, FULL_ACCESS_ROLES, isFullAccessRole } from "../models/User.js";
import { isOwnCollectionRole, isTeamHeadRole, TEAM_HEAD_ROLES } from "../lib/teamHeads.js";

const USER_LEADERSHIP = new Set(FULL_ACCESS_ROLES);

/** Roles leadership can create from Board page (one active seat each) */
const BOARD_CREATABLE_ROLES = [
  "founder",
  "cto",
  "coo",
  "bog_verification",
  "bog_operations",
  "bog_media",
  "bog_finance",
  "bog_documentation",
];

/** Roles president / VP may assign (VP + directors). VP has no team collection. */
export const DIRECTOR_ASSIGNABLE_ROLES = ["vice_president", ...TEAM_HEAD_ROLES];

/** @deprecated use DIRECTOR_ASSIGNABLE_ROLES */
export const PRESIDENT_ASSIGNABLE_ROLES = DIRECTOR_ASSIGNABLE_ROLES;

function chapterIdOf(user) {
  if (!user?.chapter) return null;
  return user.chapter._id || user.chapter;
}

function isChapterPresident(user) {
  return user?.systemRole === "president" || user?.chapterRole === "president";
}

function canAssignRoles(user) {
  return isChapterPresident(user) || user?.chapterRole === "vice_president";
}

/** CEO dashboard board: full-access leaders + BOG accounts */
export async function getBoardMembers(req, res, next) {
  try {
    const users = await User.find({
      systemRole: { $in: CEO_DASHBOARD_ROLES },
    })
      .select("-password")
      .sort({ systemRole: 1, name: 1 });

    const order = Object.fromEntries(CEO_DASHBOARD_ROLES.map((r, i) => [r, i]));
    users.sort((a, b) => (order[a.systemRole] ?? 99) - (order[b.systemRole] ?? 99));

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

/**
 * Chapter president / VP creates a director (or VP) login with password.
 * POST /users/chapter-directors
 */
export async function createChapterDirector(req, res, next) {
  try {
    if (!canAssignRoles(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only the president or vice president can create director accounts.",
      });
    }

    const chapterId = chapterIdOf(req.user);
    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: "Your account is not linked to a chapter.",
      });
    }

    const { name, email, password, phone, chapterRole } = req.body || {};

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
    if (!DIRECTOR_ASSIGNABLE_ROLES.includes(chapterRole)) {
      return res.status(400).json({
        success: false,
        message: "Pick a valid role (Vice President or a director seat).",
      });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const seatTaken = await User.findOne({
      chapter: chapterId,
      chapterRole,
      isActive: true,
    });
    if (seatTaken) {
      return res.status(409).json({
        success: false,
        message: `An active ${chapterRole.replace(/_/g, " ")} already exists (${seatTaken.email}). Deactivate or change that role first.`,
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: String(email).toLowerCase().trim(),
      password,
      phone: phone?.trim() || "",
      systemRole: "member",
      chapterRole,
      chapter: chapterId,
      teamDirector: null,
      isActive: true,
    });

    const safe = await User.findById(user._id)
      .select("-password")
      .populate("chapter", "name city");
    res.status(201).json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
}

/** Leadership creates Founder / CTO / COO / BOG login */
export async function createBogAccount(req, res, next) {
  try {
    const { name, email, password, systemRole, phone } = req.body || {};

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
    if (!BOARD_CREATABLE_ROLES.includes(systemRole)) {
      return res.status(400).json({
        success: false,
        message: "Pick a valid board role (Founder, CTO, COO, or a BOG seat).",
      });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const seatTaken = await User.findOne({ systemRole, isActive: true });
    if (seatTaken) {
      return res.status(409).json({
        success: false,
        message: `An active ${systemRole.replace(/_/g, " ")} account already exists (${seatTaken.email}). Deactivate or delete it first.`,
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: String(email).toLowerCase().trim(),
      password,
      systemRole,
      chapterRole: "member",
      chapter: null,
      phone: phone?.trim() || "",
      isActive: true,
    });

    const safe = await User.findById(user._id).select("-password");
    res.status(201).json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
}

export async function getAllUsers(req, res, next) {
  try {
    const { role, chapter, page = 1, limit = 50, chapterRole } = req.query;
    const filter = {};
    if (role) filter.systemRole = role;
    if (chapterRole) filter.chapterRole = chapterRole;

    if (USER_LEADERSHIP.has(req.user.systemRole)) {
      if (chapter) filter.chapter = chapter;
    } else {
      const cid = chapterIdOf(req.user);
      if (cid) filter.chapter = cid;
      else filter.chapter = null;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .populate("chapter", "name city")
        .populate("teamDirector", "name email chapterRole")
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, total, page: Number(page), data: users });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).populate("chapter", "name city");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const targetId = req.params.id;
    const isSelf = String(req.user._id) === String(targetId);
    const isLeader = isFullAccessRole(req.user.systemRole);
    const asAssigner = canAssignRoles(req.user);

    if (!isSelf && !isLeader && !asAssigner) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (isSelf && !isLeader) {
      if (req.body.chapterRole !== undefined || req.body.teamDirector !== undefined) {
        return res.status(403).json({
          success: false,
          message: "You cannot change your own role or team assignment.",
        });
      }
      const profileUpdates = {};
      for (const key of ["name", "phone", "avatar"]) {
        if (req.body[key] !== undefined) profileUpdates[key] = req.body[key];
      }
      const user = await User.findByIdAndUpdate(targetId, profileUpdates, {
        new: true,
        runValidators: true,
      })
        .populate("chapter", "name city")
        .populate("teamDirector", "name email chapterRole");
      if (!user) return res.status(404).json({ success: false, message: "User not found." });
      return res.json({ success: true, data: user });
    }

    const updates = {};
    const allowed = isLeader
      ? ["name", "phone", "avatar", "chapterRole", "systemRole", "chapter", "teamDirector", "isActive"]
      : ["name", "phone", "avatar", "chapterRole", "teamDirector", "isActive"];

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.teamDirector === "" || updates.teamDirector === "none") {
      updates.teamDirector = null;
    }

    if (!isLeader && updates.teamDirector !== undefined) {
      if (!asAssigner) {
        return res.status(403).json({
          success: false,
          message: "Only the president or vice president can assign team membership.",
        });
      }
      if (updates.teamDirector) {
        const director = await User.findById(updates.teamDirector);
        const cid = chapterIdOf(req.user);
        if (
          !director ||
          !isTeamHeadRole(director.chapterRole) ||
          String(director.chapter) !== String(cid)
        ) {
          return res.status(400).json({
            success: false,
            message: "Pick a valid director (head) from your chapter.",
          });
        }
      }
    }

    if (!isLeader && updates.chapterRole !== undefined) {
      if (!asAssigner) {
        return res.status(403).json({
          success: false,
          message: "Only the president or vice president can assign roles.",
        });
      }
      if (
        updates.chapterRole !== "member" &&
        !DIRECTOR_ASSIGNABLE_ROLES.includes(updates.chapterRole)
      ) {
        return res.status(400).json({
          success: false,
          message: "That role cannot be assigned.",
        });
      }
      const target = await User.findById(targetId);
      if (!target) return res.status(404).json({ success: false, message: "User not found." });
      if (target.systemRole === "president" || target.chapterRole === "president") {
        return res.status(403).json({
          success: false,
          message: "Cannot change the president account role from here.",
        });
      }
      if (isTeamHeadRole(updates.chapterRole) || isOwnCollectionRole(updates.chapterRole)) {
        updates.teamDirector = null;
      }
    }

    if (isLeader && updates.systemRole !== undefined) {
      const target = await User.findById(targetId);
      if (!target) return res.status(404).json({ success: false, message: "User not found." });
      if (isFullAccessRole(target.systemRole) && updates.systemRole !== target.systemRole) {
        return res.status(400).json({
          success: false,
          message: "Cannot change a full-access leadership role from here.",
        });
      }
      if (isFullAccessRole(updates.systemRole) && !isFullAccessRole(target.systemRole)) {
        return res.status(400).json({
          success: false,
          message: "Cannot promote to a full-access seat from here — use Add board account.",
        });
      }
      if (BOARD_CREATABLE_ROLES.includes(updates.systemRole)) {
        const seatTaken = await User.findOne({
          systemRole: updates.systemRole,
          isActive: true,
          _id: { $ne: targetId },
        });
        if (seatTaken) {
          return res.status(409).json({
            success: false,
            message: `An active ${updates.systemRole.replace(/_/g, " ")} account already exists.`,
          });
        }
      }
    }

    if (req.body.password && isLeader) {
      if (String(req.body.password).length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters.",
        });
      }
      const target = await User.findById(targetId).select("+password");
      if (!target) return res.status(404).json({ success: false, message: "User not found." });
      Object.assign(target, updates);
      target.password = req.body.password;
      target.passwordChangedAt = new Date();
      await target.save();
      const safe = await User.findById(targetId)
        .populate("chapter", "name city")
        .populate("teamDirector", "name email chapterRole");
      return res.json({ success: true, data: safe });
    }

    const user = await User.findByIdAndUpdate(targetId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("chapter", "name city")
      .populate("teamDirector", "name email chapterRole");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: "User not found." });
    if (String(target._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account." });
    }

    const actorRole = req.user.systemRole;
    const targetRole = target.systemRole;
    const founderMayDelete = ["ceo", "cto", "coo"];

    if (isFullAccessRole(targetRole)) {
      const allowed =
        actorRole === "founder" && founderMayDelete.includes(targetRole);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            actorRole === "founder"
              ? "Founder can delete CEO, CTO, and COO only — not other Founder accounts."
              : "Cannot delete a full-access leadership account (CEO / Founder / CTO / COO).",
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted." });
  } catch (err) {
    next(err);
  }
}
