/**
 * Authentication Service
 * All authentication-related API calls
 */

import apiClient, { handleApiError } from '../client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  User,
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
   * Login user
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
