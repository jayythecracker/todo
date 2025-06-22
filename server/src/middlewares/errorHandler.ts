import { Request, Response, NextFunction } from "express";
import { MongoError } from "mongodb";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

// ✅ SENIOR APPROACH: Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ✅ SENIOR APPROACH: Specific error types
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT_ERROR");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_ERROR");
  }
}

// ✅ SENIOR APPROACH: Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    stack?: string;
    details?: any;
  };
}

// ✅ SENIOR APPROACH: Handle different error types
const handleMongoError = (error: MongoError): AppError => {
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys((error as any).keyValue)[0];
    return new ConflictError(`${field} already exists`);
  }
  
  return new AppError("Database error", 500, "DATABASE_ERROR");
};

const handleJWTError = (error: JsonWebTokenError): AppError => {
  if (error instanceof TokenExpiredError) {
    return new AuthenticationError("Token expired");
  }
  
  return new AuthenticationError("Invalid token");
};

const handleValidationError = (error: any): AppError => {
  const errors = Object.values(error.errors).map((err: any) => err.message);
  return new ValidationError(`Validation failed: ${errors.join(", ")}`);
};

// ✅ SENIOR APPROACH: Log errors appropriately
const logError = (error: Error, req: Request): void => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.userId || "anonymous",
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  };

  if (error instanceof AppError && error.statusCode < 500) {
    // Client errors (4xx) - log as warning
    console.warn("Client Error:", JSON.stringify(logData, null, 2));
  } else {
    // Server errors (5xx) - log as error
    console.error("Server Error:", JSON.stringify(logData, null, 2));
  }

  // ✅ PRODUCTION: Send to error monitoring service
  // if (process.env.NODE_ENV === "production") {
  //   Sentry.captureException(error, {
  //     user: { id: req.userId },
  //     extra: logData,
  //   });
  // }
};

// ✅ SENIOR APPROACH: Global error handler middleware
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert different error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === "MongoError" || error.name === "MongoServerError") {
    appError = handleMongoError(error as MongoError);
  } else if (error instanceof JsonWebTokenError) {
    appError = handleJWTError(error);
  } else if (error.name === "ValidationError") {
    appError = handleValidationError(error);
  } else if (error.name === "CastError") {
    appError = new ValidationError("Invalid ID format");
  } else {
    // Unknown error - treat as server error
    appError = new AppError(
      process.env.NODE_ENV === "production" 
        ? "Something went wrong" 
        : error.message,
      500,
      "INTERNAL_SERVER_ERROR"
    );
  }

  // Log the error
  logError(error, req);

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  // ✅ SECURITY: Only include stack trace in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = error.stack;
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

// ✅ SENIOR APPROACH: Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ✅ SENIOR APPROACH: 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// ✅ SENIOR APPROACH: Unhandled rejection handler
export const setupGlobalErrorHandlers = (): void => {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Close server gracefully
    process.exit(1);
  });

  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught Exception:", error);
    // Close server gracefully
    process.exit(1);
  });
};
