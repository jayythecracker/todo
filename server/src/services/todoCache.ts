import { RedisService } from "../config/redis";
import { Todo } from "../models/todo";

// ✅ SENIOR APPROACH: Cache service with clean error handling
export class TodoCacheService {
  private static CACHE_PREFIX = "todos:user:";
  private static CACHE_TTL = 300; // 5 minutes

  // Generate cache key for user's todos
  private static getUserTodosKey(userId: string): string {
    return `${this.CACHE_PREFIX}${userId}`;
  }

  // ✅ SENIOR APPROACH: Get todos with graceful error handling
  static async getUserTodos(userId: string): Promise<any[] | null> {
    const cacheKey = this.getUserTodosKey(userId);
    const cachedTodos = await RedisService.get(cacheKey);

    if (cachedTodos) {
      console.log(`🚀 Cache HIT for user ${userId}`);
      return cachedTodos;
    }

    console.log(`💾 Cache MISS for user ${userId}`);
    return null;
  }

  // ✅ SENIOR APPROACH: Cache todos with success feedback
  static async setUserTodos(userId: string, todos: any[]): Promise<void> {
    const cacheKey = this.getUserTodosKey(userId);
    const success = await RedisService.set(cacheKey, todos, this.CACHE_TTL);

    if (success) {
      console.log(`💾 Cached todos for user ${userId}`);
    } else {
      console.warn(`⚠️  Failed to cache todos for user ${userId}`);
    }
  }

  // ✅ SENIOR APPROACH: Invalidate cache with success feedback
  static async invalidateUserTodos(userId: string): Promise<void> {
    const cacheKey = this.getUserTodosKey(userId);
    const success = await RedisService.del(cacheKey);

    if (success) {
      console.log(`🗑️  Invalidated cache for user ${userId}`);
    } else {
      console.warn(`⚠️  Failed to invalidate cache for user ${userId}`);
    }
  }

  // ✅ SENIOR APPROACH: Cache-aside pattern with clean error handling
  static async getTodosWithCache(userId: string): Promise<any[]> {
    // 1. Try to get from cache first
    let todos = await this.getUserTodos(userId);

    if (todos) {
      return todos; // Return cached data
    }

    // 2. Cache miss - get from database
    todos = await Todo.find({ createdBy: userId }).lean(); // .lean() for better performance

    // 3. Store in cache for next time
    if (todos && todos.length > 0) {
      await this.setUserTodos(userId, todos);
    }

    return todos || [];
  }
}

// ✅ SENIOR APPROACH: Cache warming (optional)
export class CacheWarmingService {
  // Warm cache for active users
  static async warmUserCache(userId: string): Promise<void> {
    try {
      const todos = await Todo.find({ createdBy: userId }).lean();
      await TodoCacheService.setUserTodos(userId, todos);
      console.log(`🔥 Warmed cache for user ${userId}`);
    } catch (error) {
      console.error("Error warming cache:", error);
    }
  }

  // Warm cache for multiple users (background job)
  static async warmMultipleUsers(userIds: string[]): Promise<void> {
    const promises = userIds.map((userId) => this.warmUserCache(userId));
    await Promise.allSettled(promises); // Don't fail if one user fails
  }
}
