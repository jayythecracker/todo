# Refresh Token Implementation Guide

## Overview

This implementation provides a secure JWT-based authentication system with refresh tokens. Access tokens expire in 15 minutes, while refresh tokens last 7 days.

## API Endpoints

### 1. Login
```
POST /v1/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "profile_photo": "photo_url"
  }
}
```

### 2. Refresh Token
```
POST /v1/refresh
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Tokens refreshed successfully",
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token",
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "user",
    "profile_photo": "photo_url"
  }
}
```

### 3. Logout
```
POST /v1/logout
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Frontend Implementation Example

### JavaScript/TypeScript Client

```javascript
class AuthService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.baseURL = 'http://localhost:4000/v1';
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        this.setTokens(data.accessToken, data.refreshToken);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();
      
      if (response.ok) {
        this.setTokens(data.accessToken, data.refreshToken);
        return { success: true };
      } else {
        this.clearTokens();
        return { success: false, message: data.message };
      }
    } catch (error) {
      this.clearTokens();
      return { success: false, message: 'Network error' };
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshResult = await this.refreshAccessToken();
      
      if (refreshResult.success) {
        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        // Redirect to login or handle auth failure
        window.location.href = '/login';
        return null;
      }
    }

    return response;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  isAuthenticated() {
    return !!this.accessToken && !!this.refreshToken;
  }
}

// Usage example
const authService = new AuthService();

// Login
const loginResult = await authService.login('user@example.com', 'password');
if (loginResult.success) {
  console.log('Logged in successfully');
}

// Make authenticated requests
const response = await authService.makeAuthenticatedRequest('/v1/users');
if (response) {
  const data = await response.json();
  console.log('Users:', data);
}
```

## Error Handling

The authentication middleware returns specific error codes:

- `NO_TOKEN`: No access token provided
- `TOKEN_EXPIRED`: Access token has expired (use refresh token)
- `INVALID_TOKEN`: Access token is malformed or invalid
- `AUTH_ERROR`: General authentication error

## Security Best Practices

1. **Store tokens securely**: Use httpOnly cookies in production
2. **Implement token rotation**: Generate new refresh tokens on each refresh
3. **Add token blacklisting**: Store revoked tokens in database
4. **Use HTTPS**: Always use HTTPS in production
5. **Implement rate limiting**: Limit refresh token requests
6. **Add device tracking**: Track and limit active sessions per user

## Environment Variables

Make sure these are set in your `.env` file:

```env
JWT_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
```

## Token Lifespans

- **Access Token**: 15 minutes (short-lived for security)
- **Refresh Token**: 7 days (longer-lived for convenience)

You can adjust these in `src/utils/jwt.ts` as needed.
