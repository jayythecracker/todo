import jwt from "jsonwebtoken";
import { Response } from "express";

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validate that secrets are available
if (!ACCESS_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (!REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET environment variable is required");
}

// ✅ SENIOR APPROACH: Pure JWT functions (no side effects)
export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};

// ✅ SENIOR APPROACH: Cookie configuration constants
export const COOKIE_OPTIONS = {
  ACCESS_TOKEN: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 15 * 60 * 1000, // 15 minutes
  },
  REFRESH_TOKEN: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// ✅ SENIOR APPROACH: Dedicated cookie helper functions
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("accessToken", accessToken, COOKIE_OPTIONS.ACCESS_TOKEN);
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS.REFRESH_TOKEN);
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// ✅ SENIOR APPROACH: Convenience function for common use case
export const generateTokensWithCookies = (res: Response, payload: object) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  setAuthCookies(res, accessToken, refreshToken);

  return { accessToken, refreshToken };
};
