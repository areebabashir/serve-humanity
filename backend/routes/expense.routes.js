import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { getExpenses, createExpense, updateExpenseStatus, deleteExpense } from "../controllers/expense.controller.js";

const router = Router();

router.use(protect);
router.get("/", getExpenses);
router.post("/", requireRole("ceo", "president", "finance_head", "operations_head"), createExpense);
router.patch("/:id/status", requireRole("ceo", "president", "finance_head"), updateExpenseStatus);
router.delete("/:id", requireRole("ceo", "president"), deleteExpense);

export default router;
