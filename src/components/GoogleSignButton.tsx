'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { googleAuth } from '@/lib/api/services/google-auth.service';
import { setAuthToken } from '@/lib/api/client';
import config from '@/lib/config';

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: 'GOOGLE_ACCOUNT_EXISTS' | 'EMAIL_EXISTS' | 'INVALID_TOKEN' | string;
}

interface GoogleSignButtonProps {
  mode: 'login' | 'signup'; // Different context/messaging
  businessName?: string; // For signup
  onSuccess?: () => void; // Callback after successful auth
}

export default function GoogleSignButton({ mode, businessName, onSuccess }: GoogleSignButtonProps) {
  const router = useRouter();
  const { toast } = useToast();

  const isConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse?.credential) {
        throw new Error('Failed to get authentication token from Google');
      }

      // credentialResponse.credential is the JWT ID token
      const response = await googleAuth({
        googleIdToken: credentialResponse.credential,
        businessName,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Authentication failed');
      }

      // Set auth token in API client (both in-memory and localStorage)
      setAuthToken(response.data.token);

      // Also store user data for quick access
      localStorage.setItem(config.auth.userKey, JSON.stringify(response.data.user));

      // Show success toast
      const message = response.data.isNewUser
        ? `Welcome ${response.data.user.name}! Account created successfully.`
        : `Welcome back, ${response.data.user.name}!`;

      toast({
        title: 'Success',
        description: message,
      });

      // Trigger callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      let errorTitle = 'Authentication Error';
      let errorMessage = 'Google authentication failed. Please try again.';
      let errorCode = (error as any)?.errorCode;

      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific backend error codes
        if (errorCode === 'GOOGLE_ACCOUNT_EXISTS' || errorMessage.includes('Google Sign-in')) {
          errorTitle = 'Account Already Exists';
          errorMessage = 'An account with this email already exists using Google Sign-in. Please login with Google instead.';
        } else if (errorCode === 'EMAIL_EXISTS' || errorMessage.includes('email already exists')) {
          errorTitle = 'Account Already Exists';
          errorMessage = 'An account with this email already exists. Please log in with email/password instead.';
        } else if (errorCode === 'INVALID_TOKEN' || errorMessage.includes('Invalid')) {
          errorTitle = 'Invalid Token';
          errorMessage = 'The authentication token is invalid. Please try again.';
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleGoogleError = () => {
    toast({
      title: 'Error',
      description: 'Failed to sign in with Google. Please try again.',
      variant: 'destructive',
    });
  };

  if (!isConfigured) {
    return (
      <div className="w-full p-3 text-center text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
        ⚠️ Google Sign-in not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
      />
    </div>
  );
}
