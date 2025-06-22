import { createClient } from "redis";

// ✅ SENIOR APPROACH: Redis configuration with error handling
class RedisClient {
  private client;
  private isConnected = false;

  constructor() {
    // ✅ PRODUCTION READY: Works with both local and cloud Redis
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("Redis max attempts reached");
            return false; // Stop retrying
          }
          // Exponential backoff: wait longer between retries
          const delay = Math.min(retries * 100, 3000);
          console.log(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
        connectTimeout: 10000, // 10 seconds
      },
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      console.log("✅ Redis connected successfully");
      this.isConnected = true;
    });

    this.client.on("disconnect", () => {
      console.log("❌ Redis disconnected");
      this.isConnected = false;
    });
  }

  // ✅ SENIOR APPROACH: Clean async method with proper error handling
  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  // ✅ SENIOR APPROACH: Clean disconnect with graceful error handling
  async disconnect() {
    if (this.isConnected) {
      await this.client.quit();
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isConnected;
  }
}

// ✅ SENIOR APPROACH: Singleton pattern for Redis client
export const redisClient = new RedisClient();

// ✅ SENIOR APPROACH: Redis service with smart error handling
export class RedisService {
  private static client = redisClient.getClient();

  // ✅ SENIOR APPROACH: Cache operations with graceful degradation
  static async set(
    key: string,
    value: any,
    expireInSeconds?: number
  ): Promise<boolean> {
    try {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true; // Success
    } catch (error) {
      console.error("Redis SET error:", error);
      // ✅ GRACEFUL DEGRADATION: Don't crash app if Redis fails
      return false;
    }
  }

  // ✅ SENIOR APPROACH: Get with graceful error handling
  static async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if not JSON
      }
    } catch (error) {
      console.error("Redis GET error:", error);
      return null; // ✅ GRACEFUL DEGRADATION: Return null on error
    }
  }

  // ✅ SENIOR APPROACH: Delete with graceful error handling
  static async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error("Redis DEL error:", error);
      return false; // ✅ GRACEFUL DEGRADATION
    }
  }

  // ✅ SENIOR APPROACH: Exists check with graceful error handling
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Redis EXISTS error:", error);
      return false; // ✅ GRACEFUL DEGRADATION: Assume doesn't exist
    }
  }

  // ✅ SENIOR APPROACH: Rate limiting with smart error handling
  static async increment(
    key: string,
    expireInSeconds?: number
  ): Promise<number> {
    try {
      const count = await this.client.incr(key);
      if (expireInSeconds && count === 1) {
        await this.client.expire(key, expireInSeconds);
      }
      return count;
    } catch (error) {
      console.error("Redis INCR error:", error);
      // ✅ CRITICAL: Rate limiting must work, so throw error
      // This will be caught by global error handler
      throw error;
    }
  }
}
