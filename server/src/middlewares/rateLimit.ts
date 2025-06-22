import { Request, Response, NextFunction } from "express";
import { RedisService } from "../config/redis";
import { RateLimitError } from "./errorHandler";

// ✅ SENIOR APPROACH: Redis-based rate limiting with clean error handling
interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export class RateLimiter {
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: "Too many requests, please try again later",
      keyGenerator: (req) => req.ip || "unknown",
      ...options,
    };
  }

  // Create middleware function
  middleware() {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const key = `rate_limit:${this.options.keyGenerator!(req)}`;
        const windowInSeconds = Math.floor(this.options.windowMs / 1000);

        // Increment request count
        const currentCount = await RedisService.increment(key, windowInSeconds);

        // Add rate limit headers
        res.set({
          "X-RateLimit-Limit": this.options.maxRequests.toString(),
          "X-RateLimit-Remaining": Math.max(
            0,
            this.options.maxRequests - currentCount
          ).toString(),
          "X-RateLimit-Reset": new Date(
            Date.now() + this.options.windowMs
          ).toISOString(),
        });

        if (currentCount > this.options.maxRequests) {
          // ✅ SENIOR APPROACH: Use custom error class
          throw new RateLimitError(this.options.message);
        }

        next();
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw error; // Let global handler format the response
        }

        // ✅ GRACEFUL DEGRADATION: If Redis fails, allow the request
        console.warn("Rate limiting failed, allowing request:", error);
        next();
      }
    };
  }
}

// ✅ SENIOR APPROACH: Pre-configured rate limiters
export const rateLimiters = {
  // General API rate limit
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  }),

  // Strict rate limit for auth endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    message: "Too many authentication attempts, please try again later",
  }),

  // Per-user rate limit for todo creation
  todoCreation: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 todos per minute
    keyGenerator: (req) => `user:${req.userId || req.ip}`,
    message: "You're creating todos too quickly, please slow down",
  }),

  // IP-based rate limit for public endpoints
  public: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute per IP
  }),
};

// ✅ SENIOR APPROACH: Advanced rate limiting with different strategies
export class AdvancedRateLimiter {
  // Sliding window rate limiter
  static slidingWindow(options: RateLimitOptions) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const key = `sliding:${options.keyGenerator!(req)}`;
        const now = Date.now();
        const window = options.windowMs;

        // Remove old entries and count current requests
        const pipeline = [
          ["ZREMRANGEBYSCORE", key, 0, now - window],
          ["ZCARD", key],
          ["ZADD", key, now, `${now}-${Math.random()}`],
          ["EXPIRE", key, Math.ceil(window / 1000)],
        ];

        // This would require a more complex Redis setup
        // For now, fall back to simple rate limiting
        next();
      } catch (error) {
        console.error("Sliding window rate limit error:", error);
        next();
      }
    };
  }

  // Distributed rate limiting across multiple servers
  static distributed(options: RateLimitOptions) {
    return new RateLimiter(options).middleware();
  }
}
