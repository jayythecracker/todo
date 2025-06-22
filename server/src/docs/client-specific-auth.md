# Client-Specific Authentication Strategies

## 🎯 **The Right Approach for Each Client Type**

You're absolutely correct! Senior developers use different authentication strategies based on the client platform:

### 📱 **Mobile Apps (Flutter, React Native, Kotlin, Swift)**
**Use: Traditional Header-Based Auth + Manual Refresh**

### 🌐 **Web Apps (React, Vue, Angular, Next.js)**
**Use: Cookie-Based Auth + Automatic Refresh**

---

## 📱 **Mobile Client Implementation**

### Why Manual Refresh for Mobile?

1. **Secure Storage**: Mobile apps have secure storage (Keychain/Keystore)
2. **Background Tasks**: Can refresh tokens in background
3. **Network Control**: Better control over network requests
4. **Cookie Limitations**: HTTP-only cookies don't work well with mobile HTTP clients

### Flutter Example:

```dart
class AuthService {
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  
  // Store tokens securely
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    final storage = FlutterSecureStorage();
    await storage.write(key: _accessTokenKey, value: accessToken);
    await storage.write(key: _refreshTokenKey, value: refreshToken);
  }
  
  // Make authenticated request with auto-retry
  Future<Response> authenticatedRequest(String url) async {
    final storage = FlutterSecureStorage();
    String? accessToken = await storage.read(key: _accessTokenKey);
    
    var response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    
    // If token expired, refresh and retry
    if (response.statusCode == 401) {
      bool refreshed = await refreshToken();
      if (refreshed) {
        accessToken = await storage.read(key: _accessTokenKey);
        response = await http.get(
          Uri.parse(url),
          headers: {'Authorization': 'Bearer $accessToken'},
        );
      }
    }
    
    return response;
  }
  
  Future<bool> refreshToken() async {
    final storage = FlutterSecureStorage();
    String? refreshToken = await storage.read(key: _refreshTokenKey);
    
    if (refreshToken == null) return false;
    
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/v1/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await saveTokens(data['accessToken'], data['refreshToken']);
        return true;
      }
    } catch (e) {
      print('Token refresh failed: $e');
    }
    
    return false;
  }
}
```

### React Native Example:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class MobileAuthService {
  private baseURL = 'http://localhost:4000/v1';
  
  async saveTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
  }
  
  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
    let accessToken = await AsyncStorage.getItem('accessToken');
    
    let response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Auto-refresh on 401
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        accessToken = await AsyncStorage.getItem('accessToken');
        response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      }
    }
    
    return response;
  }
  
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        await this.saveTokens(data.accessToken, data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }
}
```

---

## 🌐 **Web Client Implementation**

### Why Automatic Refresh for Web?

1. **Security**: HTTP-only cookies prevent XSS
2. **Simplicity**: No manual token management
3. **Browser Support**: Cookies work seamlessly with browsers
4. **CSRF Protection**: SameSite cookies prevent CSRF attacks

### React Example:

```typescript
// Simple - just make requests, cookies are automatic!
const WebAuthService = {
  baseURL: 'http://localhost:4000/v1',
  
  // Configure axios globally
  setupAxios() {
    axios.defaults.baseURL = this.baseURL;
    axios.defaults.withCredentials = true; // Include cookies
    
    // Optional: Handle automatic refresh responses
    axios.interceptors.response.use(
      response => {
        // Check if server refreshed tokens
        const newAccessToken = response.headers['x-new-access-token'];
        if (newAccessToken) {
          console.log('Tokens automatically refreshed by server');
        }
        return response;
      },
      error => {
        if (error.response?.status === 401) {
          // Redirect to login if session truly expired
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  },
  
  async login(email: string, password: string) {
    const response = await axios.post('/login', { email, password });
    return response.data;
  },
  
  async getProfile() {
    // Cookies sent automatically, tokens refreshed automatically
    const response = await axios.get('/web/profile');
    return response.data;
  },
  
  async logout() {
    await axios.post('/logout');
    window.location.href = '/login';
  }
};
```

### Next.js Example:

```typescript
// pages/api/proxy/[...path].ts - API route proxy
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  
  // Forward cookies to backend
  const response = await fetch(`${process.env.BACKEND_URL}/v1/${apiPath}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': req.headers.cookie || '',
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });
  
  // Forward set-cookie headers back to client
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    res.setHeader('Set-Cookie', setCookieHeader);
  }
  
  const data = await response.json();
  res.status(response.status).json(data);
}
```

---

## 🏗️ **Backend Route Organization**

```typescript
// Mobile-specific routes (manual refresh)
router.use('/mobile', authenticate); // Traditional auth middleware

// Web-specific routes (auto refresh)
router.use('/web', autoRefreshAuthenticate); // Auto-refresh middleware

// Universal routes (support both)
router.use('/api', (req, res, next) => {
  // Detect client type and use appropriate middleware
  const userAgent = req.headers['user-agent'];
  const isMobile = /Mobile|Android|iPhone/.test(userAgent);
  
  if (isMobile) {
    return authenticate(req, res, next);
  } else {
    return autoRefreshAuthenticate(req, res, next);
  }
});
```

---

## 📊 **Comparison Table**

| Feature | Mobile Apps | Web Apps |
|---------|-------------|----------|
| **Token Storage** | Secure Storage (Keychain/Keystore) | HTTP-only Cookies |
| **Refresh Strategy** | Manual (client-controlled) | Automatic (server-controlled) |
| **Security** | App-level security | Browser-level security |
| **Network Control** | Full control | Browser-managed |
| **Background Refresh** | Yes (background tasks) | No (tab-based) |
| **CSRF Protection** | Not needed | SameSite cookies |
| **XSS Protection** | App sandbox | HTTP-only cookies |

---

## 🎯 **Best Practices Summary**

### For Mobile Development:
- ✅ Use secure storage for tokens
- ✅ Implement manual refresh with retry logic
- ✅ Handle background token refresh
- ✅ Use Authorization headers

### For Web Development:
- ✅ Use HTTP-only cookies
- ✅ Implement automatic server-side refresh
- ✅ Configure CORS with credentials
- ✅ Use SameSite cookie protection

This dual approach gives you the best of both worlds - security and user experience optimized for each platform! 🚀
