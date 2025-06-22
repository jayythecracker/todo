import User from "../models/user";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { generateTokensWithCookies } from "../utils/jwt";
import { asyncHandler, ValidationError } from "../middlewares/errorHandler";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hasUser = await User.findOne({ email }).select("+password");
  if (!hasUser) {
    throw new ValidationError("Invalid credentials");
  }
  const isMatch = await bcrypt.compare(password, hasUser.password);
  if (!isMatch) {
    throw new ValidationError("Invalid credentials");
  }
  // ✅ SENIOR APPROACH: Use convenience function
  const payload = { userId: hasUser._id };
  const { accessToken, refreshToken } = generateTokensWithCookies(res, payload);

  res.status(200).json({
    message: "Login successful",

    accessToken,
    refreshToken,
    user: {
      _id: hasUser._id,
      name: hasUser.name,
      email: hasUser.email,
      profile_photo: hasUser.profile_photo,
      role: hasUser.role,
    },
  });
});
