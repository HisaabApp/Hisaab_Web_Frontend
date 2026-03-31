/**
 * Login Page
 * Enterprise-grade authentication UI with Email/Password and Phone/OTP options
 */

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { warmupService } from '@/lib/api/services/warmup.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import GoogleSignButton from '@/components/GoogleSignButton';

export default function LoginPage() {
  // Only Google OAuth is enabled (no email/password or phone OTP due to SMTP limitations on Render)
  
  // Keep backend warm to prevent Render free-tier sleep
  useEffect(() => {
    warmupService.keepBackendWarm(); // Immediate warmup on page load
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      >
      <Card className="w-full shadow-xl">
        <CardHeader className="space-y-2 sm:space-y-3 text-center px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
            <Image 
              src="/icons/HisaabAApplogo.svg" 
              alt="HisaabApp Logo" 
              width={64} 
              height={64}
              className="w-12 h-12 sm:w-16 sm:h-16"
            />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Sign in to your HisaabApp account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Gmail/Google Sign-in Only - Email/Password disabled (no SMTP on Render) */}
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Sign in with your Google account
            </p>
            <GoogleSignButton mode="login" />
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create Account
            </Link>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
