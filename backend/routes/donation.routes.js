import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { getDonations, getDonationStats, createDonation, updateDonation, deleteDonation } from "../controllers/donation.controller.js";

const router = Router();

// Public route — anyone can donate from the website
router.post("/", createDonation);

router.use(protect);
router.get("/", getDonations);
router.get("/stats", getDonationStats);
router.patch("/:id", requireRole("ceo", "president", "finance_head"), updateDonation);
router.delete("/:id", requireRole("ceo"), deleteDonation);

export default router;
