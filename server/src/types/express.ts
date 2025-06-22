import { Request } from "express";

// ✅ SENIOR APPROACH: Extend Express Request interface for authentication
export interface AuthenticatedRequest extends Request {
  userId: string;
  user?: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

// ✅ Alternative approach: Module augmentation (global extension)
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        _id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}
