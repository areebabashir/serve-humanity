import { Router } from "express";
import { register, login, logout, me, changePassword } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, me);
router.patch("/change-password", protect, changePassword);

export default router;
