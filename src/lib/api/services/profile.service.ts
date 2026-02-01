/**
 * Profile Service
 * All profile-related API calls including phone linking
 */

import apiClient, { handleApiError } from '../client';
import { ApiResponse, User, UpdateProfileData, ChangePasswordData } from '../types';

// Phone linking types
interface LinkPhoneData {
  phone: string;
}

interface VerifyPhoneData {
  phone: string;
  otp: string;
}

interface PhoneLinkResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  user?: User;
}

class ProfileService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/profile');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/profile', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.put<ApiResponse<void>>('/profile/password', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Send OTP to link phone number
   */
  async linkPhone(data: LinkPhoneData): Promise<PhoneLinkResponse> {
    try {
      const response = await apiClient.post<PhoneLinkResponse>('/profile/link-phone', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verify OTP and link phone to account
   */
  async verifyPhone(data: VerifyPhoneData): Promise<PhoneLinkResponse> {
    try {
      const response = await apiClient.post<PhoneLinkResponse>('/profile/verify-phone', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Unlink phone number from account
   */
  async unlinkPhone(): Promise<PhoneLinkResponse> {
    try {
      const response = await apiClient.delete<PhoneLinkResponse>('/profile/unlink-phone');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const profileService = new ProfileService();
export default profileService;
