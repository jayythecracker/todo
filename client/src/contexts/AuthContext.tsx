import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  AuthService,
  type User,
  type LoginCredentials,
  type SignupData,
} from "../services/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (signupData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isSuperAdmin: boolean;
  hasRole: (role: User["role"]) => boolean;
  hasAnyRole: (roles: User["role"][]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const userData = await AuthService.checkAuth();
      setUser(userData);
    } catch (error) {
      console.log("Not authenticated");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await AuthService.login(credentials);
      setUser(response.user);
    } catch (error) {
      setUser(null);
      throw error; // Re-throw to handle in component
    } finally {
      setLoading(false);
    }
  };

  const signup = async (signupData: SignupData) => {
    try {
      setLoading(true);
      const response = await AuthService.signup(signupData);
      setUser(response.user);
    } catch (error) {
      setUser(null);
      throw error; // Re-throw to handle in component
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  // Role hierarchy helper functions
  const roleHierarchy = {
    user: 1,
    moderator: 2,
    admin: 3,
    super_admin: 4,
  };

  const hasRole = (requiredRole: User["role"]): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const hasAnyRole = (roles: User["role"][]): boolean => {
    if (!user) return false;
    return roles.some((role) => hasRole(role));
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: hasRole("admin"),
    isModerator: hasRole("moderator"),
    isSuperAdmin: hasRole("super_admin"),
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// HOC for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">
            Please log in to access this page.
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// HOC for admin-only routes
export const withAdminAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">
            Please log in to access this page.
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Admin access required.</div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
