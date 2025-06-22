import { Request, Response } from "express";
import User from "../models/user";
// Import the global type augmentation
import "../types/express";

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ SENIOR APPROACH: Type-safe access with null check
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.userId).select("-password");
    res.status(200).json({ message: "Me", data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const allUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).select("-password");
    res.status(200).json({ message: "All Users", data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
