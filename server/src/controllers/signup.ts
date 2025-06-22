import { Request, Response } from "express";
import User from "../models/user";
import cloudinary from "../utils/cloudinary";
import { asyncHandler } from "../middlewares/errorHandler";

export const signup = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;
    const hasUser = await User.findOne({ email });
    if (hasUser) {
      res.status(400).json({ message: "User already exists!" });
    }

    let profile_url;
    if (req.file) {
      const fileStr = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;

      const uploadRes = await cloudinary.uploader.upload(fileStr, {
        folder: "profile_photos",
      });
      profile_url = uploadRes.secure_url;
    }
    const createdUser = await User.create({
      name,
      email,
      password,
      profile_photo: profile_url,
    });
    res.status(201).json({
      message: "User created successfully!",
      data: createdUser,
    });
  }
);
