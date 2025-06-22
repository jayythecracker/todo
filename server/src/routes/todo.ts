import { Router } from "express";
import {
  createTdo,
  deleteTodo,
  getAll,
  getTodo,
  updateTodo,
} from "../controllers/todo";
import { authenticate } from "../middlewares/auth";
import { rateLimiters } from "../middlewares/rateLimit";

const router = Router();

// ✅ REDIS USE CASE: Apply rate limiting to todo routes
router.post(
  "/create",
  rateLimiters.todoCreation.middleware(),
  authenticate,
  createTdo
);
router.get("/", rateLimiters.general.middleware(), authenticate, getAll);
router.delete(
  "/:id",
  rateLimiters.general.middleware(),
  authenticate,
  deleteTodo
);
router.get("/:id", rateLimiters.general.middleware(), authenticate, getTodo);
router.patch("/", rateLimiters.general.middleware(), authenticate, updateTodo);

export default router;
