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

    // Log request in debug mode
    if (config.api.debug) {
      console.log('🚀 API Request:', {
        method: requestConfig.method?.toUpperCase(),
        url: requestConfig.url,
        data: requestConfig.data,
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
      console.error('❌ API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        responseData: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear auth and redirect to login
      setAuthToken(null);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden');
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found');
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('Server error occurred');
    }

    // Handle Network Error
    if (!error.response) {
      console.error('Network error - API server may be down');
    }

    return Promise.reject(error);
  }
);

// API Error Handler - Extract meaningful error messages
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    
    // Server returned error message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
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
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. This record may already exist.';
      case 422:
        return 'Validation error. Please check your input.';
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
