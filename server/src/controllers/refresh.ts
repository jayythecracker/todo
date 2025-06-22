import { Request, Response } from "express";
import {
  verifyRefreshToken,
  generateTokensWithCookies,
  clearAuthCookies,
} from "../utils/jwt";
import User from "../models/user";
import {
  AuthenticationError,
  NotFoundError,
  asyncHandler,
} from "../middlewares/errorHandler";

// ✅ SENIOR APPROACH: Clean controller with global error handling
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    // Check for refresh token in cookies first, then request body
    let refreshTokenValue = req.cookies?.refreshToken;

    if (!refreshTokenValue) {
      refreshTokenValue = req.body.refreshToken;
    }

    if (!refreshTokenValue) {
      throw new AuthenticationError("Refresh token is required");
    }

    // Verify the refresh token (will throw if invalid)
    const decoded = verifyRefreshToken(refreshTokenValue) as any;

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // ✅ SENIOR APPROACH: Use convenience function
    const payload = { userId: user._id };
    const { accessToken, refreshToken } = generateTokensWithCookies(
      res,
      payload
    );

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile_photo: user.profile_photo,
        },
      },
    });
  }
);

// ✅ SENIOR APPROACH: Clean logout with global error handling
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // ✅ SENIOR APPROACH: Use helper function
  clearAuthCookies(res);

  // In a more sophisticated implementation, you would:
  // 1. Store refresh tokens in database and mark them as revoked
  // 2. Maintain a blacklist of tokens

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
