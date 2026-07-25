import { Router } from "express";
import { protect, requireRole, requireSystemOrChapter } from "../middleware/auth.js";
import { getAllUsers, getUser, updateUser, deleteUser } from "../controllers/user.controller.js";

const router = Router();

router.use(protect);
router.get(
  "/",
  requireSystemOrChapter({
    system: ["ceo", "president"],
    chapter: ["president", "vice_president"],
  }),
  getAllUsers,
);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", requireRole("ceo"), deleteUser);

export default router;
