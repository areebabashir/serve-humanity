import { Router } from "express";
import {
  protect,
  requireFullAccess,
  requireFullAccessOr,
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
} from "../controllers/user.controller.js";
import { FULL_ACCESS_ROLES } from "../models/User.js";

const router = Router();

router.use(protect);

router.get("/board", requireCeoDashboard, getBoardMembers);
router.post("/board", requireFullAccess, createBogAccount);

router.get(
  "/",
  requireSystemOrChapter({
    system: [...FULL_ACCESS_ROLES, "president"],
    chapter: ["president", "vice_president"],
  }),
  getAllUsers,
);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", requireFullAccess, deleteUser);

export default router;
