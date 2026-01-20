/**
 * Authentication Context
 * Enterprise-grade authentication management with:
 * - User state management
 * - Token persistence
 * - Auto-login on page load
 * - Protected route handling
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/api/services/auth.service';
import { profileService } from '@/lib/api/services/profile.service';
import { setAuthToken, getAuthToken } from '@/lib/api/client';
import { User, LoginCredentials, RegisterData, UpdateProfileData } from '@/lib/api/types';
import config from '@/lib/config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Redirect logic based on auth state
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      
      if (!user && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        router.push('/login');
      } else if (user && (pathname === '/login' || pathname === '/register')) {
        // Authenticated but on login/register page
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  /**
   * Initialize authentication state from stored token
   */
  const initializeAuth = async () => {
    try {
      const token = getAuthToken();
      
      if (token) {
        // Validate token by fetching user profile
        const response = await authService.getMe();
        if (response.success && response.data) {
          setUser(response.data);
          
          // Store user in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(config.auth.userKey, JSON.stringify(response.data));
          }
        } else {
          // Invalid token, clear it
          setAuthToken(null);
        }
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        // Set token in axios client and localStorage
        setAuthToken(token);
        
        // Set user state
        setUser(userData);
        
        // Store user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(config.auth.userKey, JSON.stringify(userData));
        }
        
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(data);
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        // Set token in axios client and localStorage
        setAuthToken(token);
        
        // Set user state
        setUser(userData);
        
        // Store user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(config.auth.userKey, JSON.stringify(userData));
        }
        
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    // Clear token
    setAuthToken(null);
    
    // Clear user state
    setUser(null);
    
    // Redirect to login
    router.push('/login');
  };

  /**
   * Update user profile
   */
  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await profileService.updateProfile(data);
      
      if (response.success && response.user) {
        setUser(response.user);
        
        // Update user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(config.auth.userKey, JSON.stringify(response.user));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profile update failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
