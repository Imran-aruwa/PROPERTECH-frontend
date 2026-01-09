'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './api-services';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'owner' | 'tenant' | 'staff' | 'admin' | 'caretaker' | 'agent';
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'owner' | 'tenant';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');
        const savedRole = localStorage.getItem('user_role');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setRole(savedRole);

          // Sync cookies with localStorage for middleware verification
          document.cookie = `auth_token=${savedToken}; path=/; max-age=86400; SameSite=Lax`;
          if (savedRole) {
            document.cookie = `user_role=${savedRole}; path=/; max-age=86400; SameSite=Lax`;
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.clear();
        // Clear cookies too
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      console.log('[AuthContext.login] Response:', JSON.stringify(response, null, 2));

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      // authApi.login now unwraps the double-wrapped response
      // So response.data should be { access_token, user_id, ... } directly
      const backendData = response.data;
      console.log('[AuthContext.login] Backend data:', JSON.stringify(backendData, null, 2));

      const { access_token, user_id, email: userEmail, full_name, role: userRole } = backendData;
      console.log('[AuthContext.login] Token:', access_token ? `${access_token.substring(0, 20)}...` : 'MISSING');

      // Construct user object from response (safe toLowerCase with fallback)
      const userData = {
        id: user_id,
        email: userEmail,
        full_name: full_name,
        phone: null,
        role: (userRole || 'owner').toLowerCase(),
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('user_role', userData.role);

      // Set cookies for middleware verification (secure, httpOnly not possible from client)
      document.cookie = `auth_token=${access_token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user_role=${userData.role}; path=/; max-age=86400; SameSite=Lax`;

      // Update state
      setToken(access_token);
      setUser(userData);
      setRole(userData.role);

      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        owner: '/owner',
        caretaker: '/caretaker',
        agent: '/agent',
        tenant: '/tenant',
        staff: '/staff',
        admin: '/admin'
      };

      const redirectPath = roleRedirects[userData.role] || '/';
      // Use window.location for full page reload to ensure auth state is properly initialized
      window.location.href = redirectPath;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Registration failed');
      }

      // Backend returns user data at root level
      const { id, email: userEmail, full_name, role: userRole } = response.data;

      // Construct user object (safe toLowerCase with fallback)
      const userData = {
        id: id,
        email: userEmail,
        full_name: full_name,
        phone: data.phone || null,
        role: (userRole || 'owner').toLowerCase(),
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Auto-login after registration
      await login(data.email, data.password);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_role');

    // Clear cookies
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Clear state
    setToken(null);
    setUser(null);
    setRole(null);

    // Redirect to login
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      if (!token) return;

      const response = await authApi.getCurrentUser();

      if (response.success && response.data) {
        const userData = response.data;
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
        setRole(userData.role);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    role,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route wrapper
export function useRequireAuth(requiredRole?: string) {
  const { isAuthenticated, isLoading, role, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requiredRole && role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, role, requiredRole, router]);

  return { isAuthenticated, isLoading, role, user };
}