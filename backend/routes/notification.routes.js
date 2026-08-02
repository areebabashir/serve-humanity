import { Router } from "express";
import { protect, requireFullAccess, requireCeoDashboard } from "../middleware/auth.js";
import {
  createNotification,
  listSentNotifications,
  getInbox,
  markRead,
  getUnreadCount,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(protect);

router.get("/inbox", requireCeoDashboard, getInbox);
router.get("/unread-count", requireCeoDashboard, getUnreadCount);
router.patch("/:id/read", requireCeoDashboard, markRead);

router.post("/", requireFullAccess, createNotification);
router.get("/", requireFullAccess, listSentNotifications);

export default router;
