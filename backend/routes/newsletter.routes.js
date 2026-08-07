import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect, requireFullAccessOr } from "../middleware/auth.js";
import {
  subscribe,
  listSubscribers,
  unsubscribe,
  deleteSubscriber,
  sendDonationRemindersNow,
} from "../controllers/newsletter.controller.js";

const subscribeLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many subscribe attempts. Try again later." },
});

const router = Router();

router.post("/subscribe", subscribeLimit, subscribe);

router.use(protect);
router.get("/", requireFullAccessOr("bog_media"), listSubscribers);
router.post(
  "/send-donation-reminders",
  requireFullAccessOr("bog_media"),
  sendDonationRemindersNow,
);
router.patch("/:id/unsubscribe", requireFullAccessOr("bog_media"), unsubscribe);
router.delete("/:id", requireFullAccessOr("bog_media"), deleteSubscriber);

export default router;
