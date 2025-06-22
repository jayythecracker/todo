import axios from "axios";

// Configure axios for authentication
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Token storage utilities
export class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = "access_token";
  private static readonly REFRESH_TOKEN_KEY = "refresh_token";

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }
}

// Create axios instance with default config
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  withCredentials: true, // Important: This enables cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include token in headers
authApi.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "moderator" | "admin" | "super_admin";
  profile_photo?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  profile_photo?: File;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Auth Service
export class AuthService {
  // Login with email and password
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await authApi.post("/login", credentials);
      const authData = response.data;

      // Store tokens if they exist in the response
      if (authData.accessToken && authData.refreshToken) {
        TokenStorage.setTokens(authData.accessToken, authData.refreshToken);
      }

      return authData;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  }

  // Signup new user
  static async signup(signupData: SignupData): Promise<AuthResponse> {
    try {
      const formData = new FormData();
      formData.append("name", signupData.name);
      formData.append("email", signupData.email);
      formData.append("password", signupData.password);

      if (signupData.profile_photo) {
        formData.append("profile_photo", signupData.profile_photo);
      }

      const response = await authApi.post("/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const authData = response.data;

      // Store tokens if they exist in the response
      if (authData.accessToken && authData.refreshToken) {
        TokenStorage.setTokens(authData.accessToken, authData.refreshToken);
      }

      return authData;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Signup failed");
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await authApi.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails on server, we should clear local state
    } finally {
      // Always clear tokens from local storage
      TokenStorage.clearTokens();
    }
  }

  // Get current user profile
  static async getProfile(): Promise<User> {
    try {
      const response = await authApi.get("/me");
      return response.data.user || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to get profile");
    }
  }

  // Refresh tokens manually (usually not needed with cookie-based auth)
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = TokenStorage.getRefreshToken();
      const response = await authApi.post(
        "/refresh",
        refreshToken ? { refreshToken } : {}
      );

      const authData = response.data;

      // Store new tokens if they exist in the response
      if (authData.accessToken && authData.refreshToken) {
        TokenStorage.setTokens(authData.accessToken, authData.refreshToken);
      }

      return authData;
    } catch (error: any) {
      // Clear tokens if refresh fails
      TokenStorage.clearTokens();
      throw new Error(error.response?.data?.message || "Token refresh failed");
    }
  }

  // Check if user is authenticated by trying to get profile
  static async checkAuth(): Promise<User | null> {
    try {
      return await this.getProfile();
    } catch (error) {
      return null;
    }
  }

  // Check if we have stored tokens (useful for determining auth method)
  static hasStoredTokens(): boolean {
    return TokenStorage.hasTokens();
  }

  // Get stored access token
  static getStoredAccessToken(): string | null {
    return TokenStorage.getAccessToken();
  }

  // Clear all stored tokens
  static clearStoredTokens(): void {
    TokenStorage.clearTokens();
  }
}

// Setup axios interceptors for automatic error handling
authApi.interceptors.response.use(
  (response) => {
    // Check if server refreshed tokens automatically
    const newAccessToken = response.headers["x-new-access-token"];
    const newRefreshToken = response.headers["x-new-refresh-token"];

    if (newAccessToken && newRefreshToken) {
      console.log("🔄 Tokens automatically refreshed by server");
      TokenStorage.setTokens(newAccessToken, newRefreshToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle authentication errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.code;

      if (errorCode === "TOKEN_EXPIRED" && TokenStorage.hasTokens()) {
        // Try to refresh token automatically
        originalRequest._retry = true;

        try {
          await AuthService.refreshToken();
          // Retry the original request with new token
          const token = TokenStorage.getAccessToken();
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return authApi(originalRequest);
        } catch (refreshError) {
          console.log("🔒 Token refresh failed, redirecting to login");
          TokenStorage.clearTokens();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else if (errorCode === "SESSION_EXPIRED" || errorCode === "NO_TOKEN") {
        // Session truly expired, redirect to login
        console.log("🔒 Session expired, redirecting to login");
        TokenStorage.clearTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default authApi;
