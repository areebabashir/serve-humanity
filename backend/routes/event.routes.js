import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent } from "../controllers/event.controller.js";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEvent);
router.post("/", protect, requireRole("ceo", "president", "event_head"), createEvent);
router.patch("/:id", protect, requireRole("ceo", "president", "event_head"), updateEvent);
router.delete("/:id", protect, requireRole("ceo", "president"), deleteEvent);

export default router;
