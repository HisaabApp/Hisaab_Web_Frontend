/**
 * Login Page
 * Enterprise-grade authentication UI with Email/Password and Phone/OTP options
 */

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, BookOpen, Phone, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, sendOTP, verifyOTP, resendOTP, error, isLoading, clearError } = useAuth();
  
  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone OTP login state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [validationError, setValidationError] = useState('');
  const [activeTab, setActiveTab] = useState('email');

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!email || !password) {
      setValidationError('Email and password are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    try {
      await login({ email, password });
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!phone) {
      setValidationError('Phone number is required');
      return;
    }

    // Basic phone validation (10 digits for Indian numbers)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setValidationError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const response = await sendOTP({ phone: cleanPhone });
      if (response.success) {
        setOtpSent(true);
        setCountdown(60); // 60 seconds before resend
      }
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!otp) {
      setValidationError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setValidationError('OTP must be 6 digits');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    try {
      await verifyOTP({ phone: cleanPhone, otp });
      // Redirect handled by AuthContext
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setValidationError('');
    clearError();
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    try {
      const response = await resendOTP({ phone: cleanPhone });
      if (response.success) {
        setCountdown(60);
      }
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtp('');
    clearError();
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 sm:space-y-3 text-center px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <BookOpen className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Sign in to your HisaabApp account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); clearError(); setValidationError(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-11">
              <TabsTrigger value="email" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Phone
              </TabsTrigger>
            </TabsList>

            {/* Email Login Tab */}
            <TabsContent value="email">
              <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-5">
                {displayError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{displayError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Phone OTP Login Tab */}
            <TabsContent value="phone">
              {!otpSent ? (
                // Phone number input form
                <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-5">
                  {displayError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{displayError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md border">
                        <span className="text-sm text-muted-foreground">+91</span>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={isLoading}
                        autoComplete="tel"
                        className="h-11 flex-1"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll send you a one-time password (OTP)
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </form>
              ) : (
                // OTP verification form
                <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-5">
                  {displayError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{displayError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      OTP sent to <span className="font-medium">+91 {phone}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleBackToPhone}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Change number
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={isLoading}
                      autoComplete="one-time-code"
                      className="h-11 text-center text-2xl tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Sign In'
                    )}
                  </Button>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Resend OTP in {countdown}s
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        disabled={isLoading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

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
    </div>
  );
}
