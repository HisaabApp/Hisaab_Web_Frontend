/**
 * Authentication Context
 * Enterprise-grade authentication management with:
 * - User state management (email/password + OTP login)
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
import { User, LoginCredentials, RegisterData, UpdateProfileData, SendOTPData, VerifyOTPData, VerifyOTPResponse, VerifyEmailData, VerifyEmailResponse } from '@/lib/api/types';
import config from '@/lib/config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingEmailVerification: string | null; // Store email awaiting verification
  login: (credentials: LoginCredentials) => Promise<void>;
  sendOTP: (data: SendOTPData) => Promise<{ success: boolean; message: string; expiresIn?: number }>;
  verifyOTP: (data: VerifyOTPData) => Promise<VerifyOTPResponse>;
  resendOTP: (data: SendOTPData) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<void>;
  verifyEmail: (data: VerifyEmailData) => Promise<VerifyEmailResponse>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify-email', '/offline', '/terms', '/privacy', '/refund', '/about'];

// Route prefixes that are public (for dynamic routes)
const PUBLIC_ROUTE_PREFIXES = ['/invite/'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmailVerification, setPendingEmailVerification] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize pendingEmailVerification from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pendingEmailVerification');
      if (stored) {
        setPendingEmailVerification(stored);
      }
    }
  }, []);

  // Check if current path is a public route
  const isPublicRoute = (path: string) => {
    if (PUBLIC_ROUTES.includes(path)) return true;
    return PUBLIC_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix));
  };

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();

    // Listen for storage changes (logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === config.auth.tokenKey && !e.newValue) {
        // Token was removed in another tab - logout this tab too
        setUser(null);
        setAuthToken(null);
        if (!isPublicRoute(pathname)) {
          router.push('/login');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]);

  // Track redirect to prevent loops
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirect logic based on auth state
  useEffect(() => {
    if (!isLoading && !hasRedirected) {
      const isPublic = isPublicRoute(pathname);
      
      if (!user && !isPublic) {
        // Not authenticated and trying to access protected route
        setHasRedirected(true);
        router.push('/login');
      } else if (user && (pathname === '/login' || pathname === '/register')) {
        // Authenticated but on login/register page
        setHasRedirected(true);
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router, hasRedirected]);

  // Reset redirect flag when user or pathname changes
  useEffect(() => {
    setHasRedirected(false);
  }, [user, pathname]);

  /**
   * Initialize authentication state from stored token
   */
  const initializeAuth = async () => {
    try {
      const token = getAuthToken();
      
      if (token) {
        // Validate token by fetching user profile
        try {
          const response = await authService.getMe();
          if (response.success && response.data) {
            setUser(response.data);
            
            // Store user in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(config.auth.userKey, JSON.stringify(response.data));
            }
          } else {
            // Invalid token, clear it silently
            setAuthToken(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem(config.auth.userKey);
            }
          }
        } catch (apiError) {
          // API call failed (401, network error, etc.)
          // Clear token silently - the redirect logic will handle navigation
          console.warn('Token validation failed, clearing session');
          setAuthToken(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(config.auth.userKey);
          }
        }
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(config.auth.userKey);
      }
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
      
      // Normalize email to lowercase
      const normalizedCredentials = {
        ...credentials,
        email: credentials.email.toLowerCase().trim()
      };

      const response = await authService.login(normalizedCredentials);
      
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
   * Send OTP to phone number
   */
  const sendOTP = async (data: SendOTPData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.sendOTP(data);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP and login/register
   */
  const verifyOTP = async (data: VerifyOTPData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.verifyOTP(data);
      
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
      
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const resendOTP = async (data: SendOTPData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.resendOTP(data);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
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
      
      // Normalize email to lowercase before sending to backend
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim()
      };

      const response = await authService.register(normalizedData);
      
      // Check if email verification is required
      if (response.data?.requiresEmailVerification) {
        // Store email for verification page (persists across reloads)
        const email = normalizedData.email;
        setPendingEmailVerification(email);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingEmailVerification', email);
        }
        setError(null);
        // Navigate to email verification page
        router.push('/verify-email');
        return;
      }
      
      // Normal registration with immediate login
      if (response.success && response.data?.token && response.data?.user) {
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
      
      if (response.success && response.data) {
        setUser(response.data);
        
        // Update user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(config.auth.userKey, JSON.stringify(response.data));
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

  /**
   * Verify email with OTP
   */
  const verifyEmail = async (data: VerifyEmailData): Promise<VerifyEmailResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Normalize email to lowercase before sending to backend
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim()
      };

      const response = await authService.verifyEmail(normalizedData);
      
      if (response.success && response.data?.token && response.data?.user) {
        const { token, user: userData } = response.data;
        
        // Set token in axios client and localStorage
        setAuthToken(token);
        
        // Set user state
        setUser(userData);
        
        // Clear pending email verification
        setPendingEmailVerification(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingEmailVerification');
        }
        
        // Store user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(config.auth.userKey, JSON.stringify(userData));
        }
        
        // Redirect to dashboard
        router.push('/dashboard');
      }
      
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email verification failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    pendingEmailVerification,
    login,
    sendOTP,
    verifyOTP,
    resendOTP,
    register,
    verifyEmail,
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
