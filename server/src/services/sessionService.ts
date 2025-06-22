import { RedisService } from "../config/redis";
import { v4 as uuidv4 } from "uuid";

// ✅ SENIOR APPROACH: Redis-based session management
interface SessionData {
  userId: string;
  email: string;
  role: string;
  loginTime: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionService {
  private static SESSION_PREFIX = "session:";
  private static USER_SESSIONS_PREFIX = "user_sessions:";
  private static SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  // Generate session key
  private static getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }

  // Generate user sessions key
  private static getUserSessionsKey(userId: string): string {
    return `${this.USER_SESSIONS_PREFIX}${userId}`;
  }

  // Create new session
  static async createSession(sessionData: Omit<SessionData, 'loginTime' | 'lastActivity'>): Promise<string> {
    try {
      const sessionId = uuidv4();
      const sessionKey = this.getSessionKey(sessionId);
      const userSessionsKey = this.getUserSessionsKey(sessionData.userId);

      const fullSessionData: SessionData = {
        ...sessionData,
        loginTime: Date.now(),
        lastActivity: Date.now(),
      };

      // Store session data
      await RedisService.set(sessionKey, fullSessionData, this.SESSION_TTL);

      // Add session to user's session list (for multi-device support)
      await RedisService.set(userSessionsKey, [sessionId], this.SESSION_TTL);

      console.log(`✅ Created session ${sessionId} for user ${sessionData.userId}`);
      return sessionId;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  // Get session data
  static async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const sessionData = await RedisService.get(sessionKey);

      if (sessionData) {
        // Update last activity
        sessionData.lastActivity = Date.now();
        await RedisService.set(sessionKey, sessionData, this.SESSION_TTL);
      }

      return sessionData;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  // Update session data
  static async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const existingData = await RedisService.get(sessionKey);

      if (existingData) {
        const updatedData = {
          ...existingData,
          ...updates,
          lastActivity: Date.now(),
        };

        await RedisService.set(sessionKey, updatedData, this.SESSION_TTL);
      }
    } catch (error) {
      console.error("Error updating session:", error);
    }
  }

  // Delete session
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const sessionData = await RedisService.get(sessionKey);

      if (sessionData) {
        // Remove from user's session list
        const userSessionsKey = this.getUserSessionsKey(sessionData.userId);
        const userSessions = await RedisService.get(userSessionsKey) || [];
        const updatedSessions = userSessions.filter((id: string) => id !== sessionId);
        
        if (updatedSessions.length > 0) {
          await RedisService.set(userSessionsKey, updatedSessions, this.SESSION_TTL);
        } else {
          await RedisService.del(userSessionsKey);
        }
      }

      // Delete the session
      await RedisService.del(sessionKey);
      console.log(`🗑️  Deleted session ${sessionId}`);
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  }

  // Get all sessions for a user
  static async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId);
      const sessionIds = await RedisService.get(userSessionsKey) || [];

      const sessions: SessionData[] = [];
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
          sessions.push(sessionData);
        }
      }

      return sessions;
    } catch (error) {
      console.error("Error getting user sessions:", error);
      return [];
    }
  }

  // Logout from all devices
  static async logoutAllDevices(userId: string): Promise<void> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId);
      const sessionIds = await RedisService.get(userSessionsKey) || [];

      // Delete all sessions
      for (const sessionId of sessionIds) {
        const sessionKey = this.getSessionKey(sessionId);
        await RedisService.del(sessionKey);
      }

      // Clear user sessions list
      await RedisService.del(userSessionsKey);
      console.log(`🚪 Logged out user ${userId} from all devices`);
    } catch (error) {
      console.error("Error logging out all devices:", error);
    }
  }

  // Clean up expired sessions (background job)
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      // This would typically be done with Redis SCAN command
      // For now, we rely on Redis TTL to handle expiration
      console.log("🧹 Session cleanup completed");
    } catch (error) {
      console.error("Error during session cleanup:", error);
    }
  }
}
