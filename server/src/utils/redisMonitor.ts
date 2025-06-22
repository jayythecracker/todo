import { RedisService } from "../config/redis";

// ✅ SENIOR APPROACH: Redis monitoring and health checks
export class RedisMonitor {
  // Health check
  static async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await RedisService.set("health_check", "ok", 10);
      const result = await RedisService.get("health_check");
      const latency = Date.now() - start;

      if (result === "ok") {
        return { status: "healthy", latency };
      } else {
        return { status: "unhealthy", error: "Health check failed" };
      }
    } catch (error) {
      return { 
        status: "unhealthy", 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  // Get Redis info (memory usage, connections, etc.)
  static async getRedisInfo(): Promise<any> {
    try {
      // This would require direct Redis client access
      // For now, return basic health info
      return await this.healthCheck();
    } catch (error) {
      console.error("Error getting Redis info:", error);
      return { status: "error", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Cache hit rate monitoring
  static cacheStats = {
    hits: 0,
    misses: 0,
    
    recordHit() {
      this.hits++;
    },
    
    recordMiss() {
      this.misses++;
    },
    
    getHitRate() {
      const total = this.hits + this.misses;
      return total > 0 ? (this.hits / total) * 100 : 0;
    },
    
    reset() {
      this.hits = 0;
      this.misses = 0;
    }
  };
}

// ✅ SENIOR APPROACH: Redis best practices
export const RedisBestPractices = {
  // Key naming conventions
  keyPatterns: {
    user: (id: string) => `user:${id}`,
    session: (id: string) => `session:${id}`,
    cache: (type: string, id: string) => `cache:${type}:${id}`,
    rateLimit: (identifier: string) => `rate_limit:${identifier}`,
    lock: (resource: string) => `lock:${resource}`,
  },

  // TTL recommendations
  ttl: {
    shortTerm: 300,      // 5 minutes
    mediumTerm: 3600,    // 1 hour
    longTerm: 86400,     // 1 day
    session: 604800,     // 1 week
  },

  // Memory optimization
  memoryOptimization: {
    // Use appropriate data types
    useHashForObjects: true,
    useSetsForUniqueValues: true,
    useListsForQueues: true,
    
    // Compression for large values
    compressLargeValues: true,
    compressionThreshold: 1024, // bytes
  },

  // Error handling
  errorHandling: {
    // Always fail gracefully
    failOpen: true,
    
    // Retry strategy
    maxRetries: 3,
    retryDelay: 100, // ms
    
    // Circuit breaker pattern
    circuitBreakerThreshold: 5, // failures
    circuitBreakerTimeout: 30000, // ms
  }
};

// ✅ SENIOR APPROACH: Redis utilities
export class RedisUtils {
  // Distributed lock implementation
  static async acquireLock(resource: string, ttl: number = 10000): Promise<string | null> {
    try {
      const lockKey = RedisBestPractices.keyPatterns.lock(resource);
      const lockValue = `${Date.now()}-${Math.random()}`;
      
      // This would require Redis SET with NX and EX options
      // For now, return a simple implementation
      const exists = await RedisService.exists(lockKey);
      if (!exists) {
        await RedisService.set(lockKey, lockValue, ttl / 1000);
        return lockValue;
      }
      return null;
    } catch (error) {
      console.error("Error acquiring lock:", error);
      return null;
    }
  }

  // Release distributed lock
  static async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    try {
      const lockKey = RedisBestPractices.keyPatterns.lock(resource);
      const currentValue = await RedisService.get(lockKey);
      
      if (currentValue === lockValue) {
        await RedisService.del(lockKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error releasing lock:", error);
      return false;
    }
  }

  // Batch operations
  static async batchGet(keys: string[]): Promise<any[]> {
    try {
      const promises = keys.map(key => RedisService.get(key));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error in batch get:", error);
      return new Array(keys.length).fill(null);
    }
  }

  // Cache warming utility
  static async warmCache(warmingFunction: () => Promise<void>): Promise<void> {
    try {
      console.log("🔥 Starting cache warming...");
      await warmingFunction();
      console.log("✅ Cache warming completed");
    } catch (error) {
      console.error("❌ Cache warming failed:", error);
    }
  }
}
