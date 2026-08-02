import { Router } from "express";
import { protect, requireFullAccess, requireFullAccessOr, requireCeoDashboard } from "../middleware/auth.js";
import {
  getAllChapters,
  getPublicChapters,
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

router.get("/public", getPublicChapters);
router.get("/", getAllChapters);
router.get("/:id/heads", getChapterHeads);
router.get("/:id/details", protect, requireCeoDashboard, getChapterDetails);
router.get("/:id/stats", protect, getChapterStats);
router.get("/:id", getChapter);
router.post("/", protect, requireFullAccess, createChapter);
router.patch("/:id/president", protect, requireFullAccess, assignChapterPresident);
router.patch("/:id", protect, requireFullAccessOr("president"), updateChapter);
router.delete("/:id", protect, requireFullAccess, deleteChapter);

export default router;
