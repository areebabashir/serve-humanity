import { Router } from "express";
import {
  protect,
  requireFullAccess,
  requireSystemOrChapter,
  requireCeoDashboard,
} from "../middleware/auth.js";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getBoardMembers,
  createBogAccount,
  createChapterDirector,
  createTeamDirector,
} from "../controllers/user.controller.js";
import { FULL_ACCESS_ROLES } from "../models/User.js";

const router = Router();

router.use(protect);

router.get("/board", requireCeoDashboard, getBoardMembers);
router.post("/board", requireFullAccess, createBogAccount);

router.post(
  "/chapter-directors",
  requireSystemOrChapter({
    system: ["president"],
    chapter: ["president", "vice_president"],
  }),
  createChapterDirector,
);

router.post(
  "/team-directors",
  requireSystemOrChapter({
    chapter: [
      "finance_head",
      "operations_head",
      "verification_head",
      "documentation_head",
      "media_head",
    ],
  }),
  createTeamDirector,
);

router.get(
  "/",
  requireSystemOrChapter({
    system: [...FULL_ACCESS_ROLES, "president"],
    chapter: [
      "president",
      "vice_president",
      "finance_head",
      "operations_head",
      "verification_head",
      "documentation_head",
      "media_head",
    ],
  }),
  getAllUsers,
);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", requireFullAccess, deleteUser);

export default router;
