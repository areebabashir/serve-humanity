import { Router } from "express";
import { protect, requireRole, requireCeoDashboard } from "../middleware/auth.js";
import {
  getAllChapters,
  getChapter,
  getChapterHeads,
  getChapterDetails,
  createChapter,
  assignChapterPresident,
  updateChapter,
  deleteChapter,
  getChapterStats,
} from "../controllers/chapter.controller.js";

const router = Router();

router.get("/", getAllChapters);
router.get("/:id/heads", getChapterHeads);
router.get("/:id/details", protect, requireCeoDashboard, getChapterDetails);
router.get("/:id/stats", protect, getChapterStats);
router.get("/:id", getChapter);
router.post("/", protect, requireRole("ceo"), createChapter);
router.patch("/:id/president", protect, requireRole("ceo"), assignChapterPresident);
router.patch("/:id", protect, requireRole("ceo", "president"), updateChapter);
router.delete("/:id", protect, requireRole("ceo"), deleteChapter);

export default router;
