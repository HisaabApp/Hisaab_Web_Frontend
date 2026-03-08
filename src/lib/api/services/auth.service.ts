/**
 * Authentication Service
 * All authentication-related API calls including OTP
 */

import apiClient, { handleApiError } from '../client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  User,
  SendOTPData,
  VerifyOTPData,
  SendOTPResponse,
  VerifyOTPResponse,
  VerifyEmailData,
  VerifyEmailResponse,
} from '../types';

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Login user with email/password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(data: SendOTPData): Promise<SendOTPResponse> {
    try {
      const response = await apiClient.post<SendOTPResponse>('/auth/otp/send', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verify OTP and login/register
   */
  async verifyOTP(data: VerifyOTPData): Promise<VerifyOTPResponse> {
    try {
      // Backend expects 'code' instead of 'otp'
      const payload = { phone: data.phone, code: data.otp };
      const response = await apiClient.post<VerifyOTPResponse>('/auth/otp/verify', payload);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(data: SendOTPData): Promise<SendOTPResponse> {
    try {
      const response = await apiClient.post<SendOTPResponse>('/auth/otp/resend', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(data: VerifyEmailData): Promise<VerifyEmailResponse> {
    try {
      const response = await apiClient.post<VerifyEmailResponse>('/auth/verify-email', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check if OTP is configured
   */
  async checkOTPStatus(): Promise<{ configured: boolean }> {
    try {
      const response = await apiClient.get<{ configured: boolean }>('/auth/otp/status');
      return response.data;
    } catch (error) {
      return { configured: false };
    }
  }

  /**
   * Get current user profile
   */
  async getMe(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const authService = new AuthService();
export default authService;
