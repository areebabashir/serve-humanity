import User from "../models/User.js";
import { isOwnCollectionRole, isTeamHeadRole, TEAM_HEAD_ROLES } from "../lib/teamHeads.js";

const USER_BOG = new Set(["ceo"]);

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

export async function getAllUsers(req, res, next) {
  try {
    const { role, chapter, page = 1, limit = 50, chapterRole } = req.query;
    const filter = {};
    if (role) filter.systemRole = role;
    if (chapterRole) filter.chapterRole = chapterRole;

    if (USER_BOG.has(req.user.systemRole)) {
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
    const isCeo = req.user.systemRole === "ceo";
    const asAssigner = canAssignRoles(req.user);

    if (!isSelf && !isCeo && !asAssigner) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Profile self-edit only — never allow changing own chapterRole / team
    if (isSelf && !isCeo) {
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
    const allowed = isCeo
      ? ["name", "phone", "avatar", "chapterRole", "systemRole", "chapter", "teamDirector", "isActive"]
      : ["name", "phone", "avatar", "chapterRole", "teamDirector", "isActive"];

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.teamDirector === "" || updates.teamDirector === "none") {
      updates.teamDirector = null;
    }

    if (!isCeo && updates.teamDirector !== undefined) {
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

    if (!isCeo && updates.chapterRole !== undefined) {
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
      // Directors lead a team; president/VP have own collection only — never under a team
      if (isTeamHeadRole(updates.chapterRole) || isOwnCollectionRole(updates.chapterRole)) {
        updates.teamDirector = null;
      }
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
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted." });
  } catch (err) {
    next(err);
  }
}
