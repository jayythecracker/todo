# Senior Developer Authentication Patterns

## 🍪 Cookie-Based Authentication (Recommended Approach)

### Why Cookies Over localStorage?

Senior developers prefer HTTP-only cookies because:

1. **XSS Protection**: HTTP-only cookies can't be accessed by JavaScript
2. **Automatic Handling**: Browsers automatically send cookies with requests
3. **CSRF Protection**: Combined with SameSite attribute
4. **Secure by Default**: Can be marked as secure for HTTPS

### Implementation Strategy

```typescript
// 1. Set HTTP-only cookies on login
res.cookie('accessToken', accessToken, {
  httpOnly: true,                    // Prevents XSS
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',               // CSRF protection
  maxAge: 15 * 60 * 1000           // 15 minutes
});
```

## 🔄 Automatic Token Refresh Pattern

### The Problem
- Access tokens expire frequently (15 minutes)
- Users shouldn't be logged out constantly
- Manual refresh is poor UX

### Senior Solution: Transparent Refresh

```typescript
// Middleware that automatically refreshes expired tokens
export const autoRefreshAuthenticate = async (req, res, next) => {
  try {
    // Try access token first
    const decoded = verifyAccessToken(accessToken);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Automatically refresh and continue
      const refreshResult = await attemptTokenRefresh(req, res);
      if (refreshResult.success) {
        next(); // Continue with new token
      } else {
        res.status(401).json({ message: "Session expired" });
      }
    }
  }
};
```

## 🏗️ Architecture Patterns

### 1. Dual Token Strategy
- **Access Token**: Short-lived (15 min), for API access
- **Refresh Token**: Long-lived (7 days), for getting new access tokens

### 2. Cookie + Header Fallback
```typescript
// Check cookies first (preferred), then headers (fallback)
let token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
```

### 3. Graceful Degradation
```typescript
// Multiple authentication strategies
const authStrategies = [
  () => authenticateWithCookies(req),
  () => authenticateWithHeaders(req),
  () => authenticateWithRefreshToken(req)
];
```

## 🛡️ Security Best Practices

### 1. Cookie Configuration
```typescript
const cookieOptions = {
  httpOnly: true,                    // No JS access
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict',               // CSRF protection
  domain: process.env.COOKIE_DOMAIN, // Specific domain
  path: '/',                        // Cookie path
};
```

### 2. CORS Configuration
```typescript
const corsOptions = {
  origin: process.env.CLIENT_URL,   // Specific origin, not wildcard
  credentials: true,                // Allow cookies
  optionsSuccessStatus: 200
};
```

### 3. Token Rotation
```typescript
// Generate new refresh token on each refresh
const newRefreshToken = generateRefreshToken(payload);
// Invalidate old refresh token (in production, store in DB)
```

## 🚀 Frontend Integration

### Modern Fetch with Credentials
```javascript
// Automatically includes cookies
fetch('/api/users', {
  credentials: 'include',  // Include cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Axios Configuration
```javascript
// Global axios configuration
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:4000';

// Automatic retry on 401
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      // Token was automatically refreshed by server
      // Retry the original request
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

## 📊 Monitoring & Observability

### Token Metrics
```typescript
// Track token usage patterns
const tokenMetrics = {
  accessTokenRefreshes: 0,
  failedRefreshAttempts: 0,
  averageSessionDuration: 0
};
```

### Logging Strategy
```typescript
// Structured logging for auth events
logger.info('Token refreshed', {
  userId: user._id,
  userAgent: req.headers['user-agent'],
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

## 🔧 Advanced Patterns

### 1. Token Blacklisting
```typescript
// Store revoked tokens in Redis
const revokedTokens = new Set();
const isTokenRevoked = (token) => revokedTokens.has(token);
```

### 2. Device Tracking
```typescript
// Track active sessions per user
const activeSessions = new Map();
const maxSessionsPerUser = 5;
```

### 3. Rate Limiting
```typescript
// Limit refresh attempts
const refreshAttempts = new Map();
const maxRefreshAttempts = 5;
```

## 🎯 Production Considerations

### Environment Variables
```env
# Security
JWT_SECRET=complex_secret_for_access_tokens
JWT_REFRESH_SECRET=different_complex_secret_for_refresh_tokens
COOKIE_DOMAIN=.yourdomain.com
CLIENT_URL=https://app.yourdomain.com

# Session Management
MAX_SESSIONS_PER_USER=5
TOKEN_REFRESH_THRESHOLD=300  # 5 minutes before expiry
```

### Database Schema for Sessions
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  refresh_token_hash VARCHAR(255),
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);
```

## 🏆 Why This Approach Wins

1. **Security**: HTTP-only cookies + automatic refresh
2. **UX**: Seamless experience, no manual token management
3. **Scalability**: Stateless with optional session tracking
4. **Maintainability**: Clear separation of concerns
5. **Observability**: Comprehensive logging and metrics

This is how senior developers build production-ready authentication systems that are both secure and user-friendly.
