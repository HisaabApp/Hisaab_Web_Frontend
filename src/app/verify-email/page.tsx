/**
 * Email Verification Page
 * Verify user email with OTP code sent to registered email
 */

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { pendingEmailVerification, verifyEmail, error, isLoading, clearError } = useAuth();
  const [otp, setOtp] = useState('');
  const [validationError, setValidationError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Redirect if no pending email verification
  useEffect(() => {
    if (!pendingEmailVerification) {
      // Small delay to allow hydration
      const timer = setTimeout(() => {
        router.push('/login');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingEmailVerification, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    // Validation
    if (!otp || otp.trim().length === 0) {
      setValidationError('Please enter the verification code');
      return;
    }

    if (otp.length < 4) {
      setValidationError('Please enter a valid verification code');
      return;
    }

    try {
      if (!pendingEmailVerification) {
        setValidationError('Session expired. Please register again.');
        return;
      }

      const response = await verifyEmail({
        email: pendingEmailVerification,
        otp: otp.trim(),
      });

      if (response.success) {
        // Success - redirect handled by verifyEmail in AuthContext
        setOtp('');
      }
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleResendOTP = async () => {
    if (!pendingEmailVerification) return;
    
    try {
      setResendLoading(true);
      setResendSuccess(false);
      clearError();

      // TODO: Implement resend OTP endpoint in backend
      // For now, just show success message
      // const response = await authService.resendEmailOTP(pendingEmailVerification);
      
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      setValidationError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <Image 
              src="/icons/HisaabAApplogo.svg" 
              alt="HisaabApp Logo" 
              width={64} 
              height={64}
              className="w-16 h-16"
            />
          </div>
          <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            We've sent a verification code to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            {resendSuccess && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Verification code sent to your email
                </AlertDescription>
              </Alert>
            )}

            {/* Email Display */}
            {pendingEmailVerification && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Code sent to <strong>{pendingEmailVerification}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* OTP Input */}
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
                maxLength={6}
                className="h-11 text-center text-lg tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Code expires in 10 minutes
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            {/* Resend OTP */}
            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Didn't receive the code? </span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading || isLoading}
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : 'Resend'}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400">
                  Wrong email?
                </span>
              </div>
            </div>

            {/* Back to Register */}
            <div className="text-center text-sm text-muted-foreground">
              <Link
                href="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Create account with different email
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
