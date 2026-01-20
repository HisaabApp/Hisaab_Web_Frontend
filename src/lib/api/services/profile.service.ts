/**
 * Profile Service
 * All profile-related API calls
 */

import apiClient, { handleApiError } from '../client';
import { ApiResponse, User, UpdateProfileData, ChangePasswordData } from '../types';

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
}

export const profileService = new ProfileService();
export default profileService;
