/**
 * API Client with Interceptors
 * Enterprise-grade axios configuration with:
 * - Automatic token injection
 * - Request/Response interceptors
 * - Error handling and retry logic
 * - Request/Response logging
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(config.auth.tokenKey, token);
    }
  } else {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.auth.tokenKey);
      localStorage.removeItem(config.auth.userKey);
    }
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem(config.auth.tokenKey);
  }
  return authToken;
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (requestConfig) => {
    const token = getAuthToken();
    
    // Inject authorization token
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    // Inject branch ID from localStorage if available and valid
    if (typeof window !== 'undefined') {
      const selectedBranchId = localStorage.getItem('selectedBranchId');
      // Only send branch ID if it's set and not null/undefined (null means "All Branches")
      if (selectedBranchId && selectedBranchId !== 'null' && selectedBranchId !== 'undefined' && requestConfig.headers) {
        requestConfig.headers['x-branch-id'] = selectedBranchId;
      }
    }

    // Log request in debug mode (filter sensitive data)
    if (config.api.debug) {
      const sanitizedData = requestConfig.data ? { ...requestConfig.data } : {};
      // Remove sensitive fields from logging
      if (sanitizedData.password) sanitizedData.password = '***';
      if (sanitizedData.currentPassword) sanitizedData.currentPassword = '***';
      if (sanitizedData.newPassword) sanitizedData.newPassword = '***';
      if (sanitizedData.token) sanitizedData.token = '***';
      if (sanitizedData.otp) sanitizedData.otp = '***';
      
      console.log('🚀 API Request:', {
        method: requestConfig.method?.toUpperCase(),
        url: requestConfig.url,
        data: sanitizedData,
        branchId: requestConfig.headers?.['x-branch-id']
      });
    }

    return requestConfig;
  },
  (error) => {
    if (config.api.debug) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in debug mode
    if (config.api.debug) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log error in debug mode with full details
    if (config.api.debug) {
      console.error('❌ API Error:', JSON.stringify({
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        responseData: error.response?.data,
      }, null, 2));
    }

    // Handle 401 Unauthorized - Token expired or invalid
    // Skip redirect for auth endpoints (login, register, etc.) - let them handle their own errors
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    
    // Also skip for subscription/status which may be called before full auth
    const isStatusCheck = originalRequest.url?.includes('/subscription/status') || 
                          originalRequest.url?.includes('/plan/status');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isStatusCheck) {
      originalRequest._retry = true;
      
      // Clear auth token
      setAuthToken(null);
      
      // Use router-based navigation instead of hard redirect to prevent crashes
      // The AuthContext will handle the redirect properly
      if (typeof window !== 'undefined') {
        // Clear stored user data too
        localStorage.removeItem('hisaabapp_user');
        
        // Only redirect if not already on login page to prevent loops
        if (!window.location.pathname.includes('/login')) {
          // Use soft navigation to avoid app crash
          window.location.replace('/login');
        }
      }
      
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - Branch access denied
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || '';
      // If it's a branch access error, clear the invalid branch from localStorage
      if (message.includes('branch') || message.includes('Branch')) {
        if (typeof window !== 'undefined') {
          console.warn('Branch access denied - clearing stored branch');
          localStorage.removeItem('selectedBranch');
          localStorage.removeItem('selectedBranchId');
          // Reload to reset state
          window.location.reload();
        }
      }
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      // Resource not found - handled silently
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      // Server error - handled silently
    }

    // Handle Network Error
    if (!error.response) {
      // Network error - handled silently
    }

    return Promise.reject(error);
  }
);

// API Error Handler - Extract meaningful error messages
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; remaining?: number; limit?: number; plan?: string }>;
    
    // Special handling for quota exceeded (check first before generic message handling)
    if (axiosError.response?.data?.error === 'Message quota exceeded') {
      const limit = axiosError.response.data.limit || 10;
      const plan = axiosError.response.data.plan || 'FREE';
      const planName = plan === 'FREE' ? 'Free' : plan === 'PRO' ? 'Pro' : plan === 'BUSINESS' ? 'Business' : plan;
      
      return `📱 Message Limit Reached!\n\nYou've used all ${limit} messages included in your ${planName} plan this month.\n\n💡 Upgrade your plan to send more reminders and invoices to your customers.`;
    }
    
    // Server returned error message - but skip the technical "Insufficient quota" message
    if (axiosError.response?.data?.message) {
      // Skip technical quota messages, we handle them above
      if (!axiosError.response.data.message.includes('Insufficient quota')) {
        return axiosError.response.data.message;
      }
    }
    
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }

    // Network error
    if (!axiosError.response) {
      return 'Network error. Please check your connection and try again.';
    }

    // HTTP status errors
    switch (axiosError.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication failed. Please login again.';
      case 403:
        // Check for quota exceeded in 403 responses
        if (axiosError.response?.data?.error?.includes('quota') || 
            axiosError.response?.data?.message?.includes('quota')) {
          return '📱 Message limit reached! Please upgrade your plan to send more messages.';
        }
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found or access denied.';
      case 405:
        return 'This action is not allowed.';
      case 409:
        return 'Conflict. This record may already exist.';
      case 422:
        return 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `Request failed with status ${axiosError.response.status}`;
    }
  }

  // Non-axios errors
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export default apiClient;
