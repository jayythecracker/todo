import { NextFunction, Request, Response } from "express";
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateTokensWithCookies,
} from "../utils/jwt";
import User from "../models/user";
import {
  UserRole,
  Permission,
  hasPermission,
  hasRole,
  canAccessResource,
} from "../utils/roles";

/**
 * Advanced authentication middleware that automatically refreshes tokens
 * This is how senior developers handle token expiration seamlessly
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for access token in cookies first, then Authorization header
    let accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      accessToken = req.headers.authorization?.split(" ")[1];
    }

    if (!accessToken) {
      res.status(401).json({
        message: "Access token is required",
        code: "NO_TOKEN",
      });
      return;
    }

    try {
      // Try to verify the access token
      const decoded = verifyAccessToken(accessToken);
      (req as any).userId = (decoded as any).userId;
      next();
      return;
    } catch (error: any) {
      // If access token is expired, try to refresh it
      if (error.name === "TokenExpiredError") {
        const refreshResult = await attemptTokenRefresh(req, res);

        if (refreshResult.success) {
          (req as any).userId = refreshResult.userId;
          next();
          return;
        } else {
          res.status(401).json({
            message: "Session expired. Please log in again.",
            code: "SESSION_EXPIRED",
          });
          return;
        }
      } else {
        // Invalid token
        res.status(401).json({
          message: "Invalid access token",
          code: "INVALID_TOKEN",
        });
        return;
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      message: "Authentication service error",
      code: "AUTH_SERVICE_ERROR",
    });
  }
};

/**
 * Attempts to refresh the access token using the refresh token
 */
async function attemptTokenRefresh(req: Request, res: Response) {
  try {
    // Check for refresh token in cookies first, then request body
    let candidateRefreshToken = req.cookies?.refreshToken;

    if (!candidateRefreshToken) {
      candidateRefreshToken = req.body.refreshToken;
    }

    if (!candidateRefreshToken) {
      return { success: false, message: "No refresh token available" };
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(candidateRefreshToken) as any;

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Generate new tokens
    const payload = { userId: user._id };

    const { accessToken, refreshToken } = generateTokensWithCookies(
      res,
      payload
    );

    // Also set headers for client-side access if needed
    res.setHeader("X-New-Access-Token", accessToken);
    res.setHeader("X-New-Refresh-Token", refreshToken);

    return {
      success: true,
      userId: user._id,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return { success: false, message: "Token refresh failed" };
  }
}

/**
 * Legacy middleware for routes that require admin privileges (backward compatibility)
 * Use this after authenticate or autoRefreshAuthenticate
 */
export const authorize = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById((req as any).userId);
    if (!user) {
      res
        .status(403)
        .json({ message: "User not found", code: "USER_NOT_FOUND" });
      return;
    }
    if (user.role !== "admin") {
      res.status(403).json({
        message: "Admin access required",
        code: "INSUFFICIENT_PRIVILEGES",
      });
      return;
    }
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({
      message: "Authorization service error",
      code: "AUTH_SERVICE_ERROR",
    });
  }
};

// ✅ SENIOR APPROACH: Advanced Role-Based Authorization

/**
 * Middleware factory for role-based authorization
 * @param requiredRole - Minimum role required (uses hierarchy)
 */
export const requireRole = (requiredRole: UserRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById((req as any).userId);
      if (!user) {
        res.status(403).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      if (!hasRole(user.role as UserRole, requiredRole)) {
        res.status(403).json({
          message: `${requiredRole} access required`,
          code: "INSUFFICIENT_ROLE",
          required: requiredRole,
          current: user.role,
        });
        return;
      }

      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      res.status(500).json({
        message: "Authorization service error",
        code: "AUTH_SERVICE_ERROR",
      });
    }
  };
};

/**
 * Middleware factory for permission-based authorization
 * @param requiredPermissions - Array of permissions required
 */
export const requirePermissions = (requiredPermissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById((req as any).userId);
      if (!user) {
        res.status(403).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      if (!canAccessResource(user.role as UserRole, requiredPermissions)) {
        res.status(403).json({
          message: "Insufficient permissions",
          code: "INSUFFICIENT_PERMISSIONS",
          required: requiredPermissions,
          userRole: user.role,
        });
        return;
      }

      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Permission authorization error:", error);
      res.status(500).json({
        message: "Authorization service error",
        code: "AUTH_SERVICE_ERROR",
      });
    }
  };
};

/**
 * Middleware for checking specific permission
 * @param permission - Single permission to check
 */
export const requirePermission = (permission: Permission) => {
  return requirePermissions([permission]);
};

// Convenience middleware for common roles
export const requireModerator = requireRole(UserRole.MODERATOR);
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);
