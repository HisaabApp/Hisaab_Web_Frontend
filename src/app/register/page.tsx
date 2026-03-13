/**
 * Register Page
 * User registration with comprehensive form validation
 */

"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import GoogleSignButton from '@/components/GoogleSignButton';

export default function RegisterPage() {
  // Only Google OAuth is enabled (no email/password due to SMTP limitations on Render)
  const [formData, setFormData] = useState({
    businessName: '',
  });

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
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription className="text-base">
            Start managing your business billing today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Gmail/Google Sign-up Only - Email/Password disabled (no SMTP on Render) */}
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Create your account with Google
            </p>
            <GoogleSignButton mode="signup" businessName={formData.businessName} />
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign In
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
