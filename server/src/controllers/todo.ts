import { Request, Response } from "express";
import { Todo } from "../models/todo";
export const createTdo = async (req: Request, res: Response) => {
  try {
    const { title, todo } = req.body;
    const newTodo = await Todo.create({
      title,
      todo,
    });
    res.status(201).json({ message: "New Todo created!", data: newTodo });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const todos = await Todo.find({});
    res.status(200).json({ message: "All Todos", data: todos });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleteTdo = await Todo.findByIdAndDelete(id);
    res.status(200).json({ message: "Deleted Todo", data: deleteTdo });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

export const getTodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const single = await Todo.findById(id);
    res.status(200).json({ message: "Single Get", data: single });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

export const updateTodo = async (req: Request, res: Response) => {
  try {
    const { id, todo, title } = req.body;

    const single = await Todo.findByIdAndUpdate(id, { todo, title });
    res.status(200).json({ message: "Update Todo", data: single });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};
