import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { submitContact, getMessages, markRead } from "../controllers/contact.controller.js";
import rateLimit from "express-rate-limit";

const contactLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { success: false, message: "Too many messages. Try again later." } });

const router = Router();

router.post("/", contactLimit, submitContact);

router.use(protect);
router.get("/", requireRole("ceo", "president"), getMessages);
router.patch("/:id/read", requireRole("ceo", "president"), markRead);

export default router;
