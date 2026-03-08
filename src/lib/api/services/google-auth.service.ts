import config from '../../config';
import { ApiResponse } from '../types';

export interface GoogleAuthRequest {
  googleIdToken: string;
  businessName?: string;
}

export interface GoogleAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    businessName?: string;
    address?: string;
    logo?: string;
  };
  token: string;
  isNewUser?: boolean;
}

/**
 * Authenticate with Google OAuth
 * - Exchanges Google ID token for JWT token
 * - Handles both new user registration and existing user login
 * - Prevents duplicate accounts with same email across auth methods
 */
export async function googleAuth(data: GoogleAuthRequest): Promise<ApiResponse<GoogleAuthResponse>> {
  const response = await fetch(`${config.api.baseURL}/auth/google/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    const error = new Error(result.message || 'Google authentication failed');
    // Attach error code if available for specific error handling
    (error as any).errorCode = result.errorCode;
    throw error;
  }

  return result;
}
