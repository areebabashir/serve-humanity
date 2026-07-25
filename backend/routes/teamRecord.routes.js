import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  listTeamRecords,
  createTeamRecord,
  updateTeamRecord,
  deleteTeamRecord,
} from "../controllers/teamRecord.controller.js";

const router = Router();

router.use(protect);
router.get("/", listTeamRecords);
router.post("/", createTeamRecord);
router.patch("/:id", updateTeamRecord);
router.delete("/:id", deleteTeamRecord);

export default router;
