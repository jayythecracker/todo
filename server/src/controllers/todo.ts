import { Request, Response } from "express";
import { Todo } from "../models/todo";
import { TodoCacheService } from "../services/todoCache";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  asyncHandler,
} from "../middlewares/errorHandler";
// Import the global type augmentation
import "../types/express";

// ✅ SENIOR APPROACH: Clean controller with global error handling
export const createTdo = asyncHandler(async (req: Request, res: Response) => {
  const { title, todo } = req.body;

  // ✅ SENIOR APPROACH: Use custom error classes
  if (!req.userId) {
    throw new AuthenticationError("Authentication required");
  }

  if (!title || !todo) {
    throw new ValidationError("Title and todo content are required");
  }

  const userId = req.userId;

  const newTodo = await Todo.create({
    title,
    todo,
    createdBy: userId,
  });

  // ✅ REDIS USE CASE: Invalidate cache when new todo is created
  await TodoCacheService.invalidateUserTodos(userId);

  res.status(201).json({
    success: true,
    message: "New Todo created!",
    data: newTodo,
  });
});

export const getAll = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // ✅ SENIOR APPROACH: Type-safe access with null check
    if (!req.userId) {
      throw new AuthenticationError("Authentication required");
    }

    // ✅ REDIS USE CASE: Get todos with caching
    const todos = await TodoCacheService.getTodosWithCache(req.userId);
    res.status(200).json({ message: "All Todos", data: todos });
  }
);

export const deleteTodo = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // ✅ SENIOR APPROACH: Type-safe access with null check
    if (!req.userId) {
      throw new AuthenticationError("Authentication required");
    }

    // Only allow users to delete their own todos
    const deleteTdo = await Todo.findOneAndDelete({
      _id: id,
      createdBy: req.userId,
    });

    if (!deleteTdo) {
      throw new NotFoundError("Todo not found or unauthorized");
    }

    res.status(200).json({ message: "Deleted Todo", data: deleteTdo });
  }
);

export const getTodo = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // ✅ SENIOR APPROACH: Type-safe access with null check
    if (!req.userId) {
      throw new AuthenticationError("Authentication required");
    }

    // Only allow users to get their own todos
    const single = await Todo.findOne({
      _id: id,
      createdBy: req.userId,
    });

    if (!single) {
      throw new NotFoundError("Todo not found or unauthorized");
    }

    res.status(200).json({ message: "Single Get", data: single });
  }
);

export const updateTodo = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id, todo, title } = req.body;

    // ✅ SENIOR APPROACH: Type-safe access with null check
    if (!req.userId) {
      throw new AuthenticationError("Authentication required");
    }

    // Only allow users to update their own todos
    const single = await Todo.findOneAndUpdate(
      { _id: id, createdBy: req.userId },
      { todo, title },
      { new: true } // Return updated document
    );

    if (!single) {
      throw new NotFoundError("Todo not found or unauthorized");
    }

    // ✅ REDIS USE CASE: Invalidate cache when todo is updated
    await TodoCacheService.invalidateUserTodos(req.userId);

    res.status(200).json({ message: "Update Todo", data: single });
  }
);
