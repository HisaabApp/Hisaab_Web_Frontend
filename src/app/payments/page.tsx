"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/api/client';
import {
  Wallet,
  QrCode,
  CreditCard,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  Smartphone,
  Shield,
  Info,
} from 'lucide-react';

interface PaymentSettings {
  id: string;
  name: string;
  upiId: string | null;
  paymentEnabled: boolean;
  razorpayKeyId: string | null;
  razorpayConfigured: boolean;
}

interface RazorpayStatus {
  configured: boolean;
  testMode: boolean;
  mode: 'live' | 'test' | 'not_configured';
}

export default function PaymentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { selectedOrganization } = useBranch();
  const { toast } = useToast();

  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [razorpayStatus, setRazorpayStatus] = useState<RazorpayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [upiId, setUpiId] = useState('');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');

  // Load payment settings
  useEffect(() => {
    if (!selectedOrganization?.id) return;

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Fetch both settings and status in parallel
        const [settingsRes, statusRes] = await Promise.all([
          apiClient.get(`/organizations/${selectedOrganization.id}/payment-settings`),
          apiClient.get('/notifications/status').catch(() => null),
        ]);
        
        if (settingsRes.data.success) {
          const data = settingsRes.data.data;
          setSettings(data);
          setUpiId(data.upiId || '');
          setPaymentEnabled(data.paymentEnabled);
          setRazorpayKeyId(data.razorpayKeyId || '');
        }
        
        // Get Razorpay status
        if (statusRes?.data?.razorpay) {
          setRazorpayStatus(statusRes.data.razorpay);
        }
      } catch (error) {
        console.error('Failed to load payment settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [selectedOrganization?.id, toast]);

  // Save UPI settings
  const handleSaveUpiSettings = async () => {
    if (!selectedOrganization?.id) return;

    try {
      setIsSaving(true);
      const response = await apiClient.patch(`/organizations/${selectedOrganization.id}/payment-settings`, {
        upiId: upiId.trim() || null,
        paymentEnabled,
      });

      if (response.data.success) {
        toast({
          title: 'Settings Saved',
          description: 'UPI payment settings updated successfully',
        });
        setSettings(prev => prev ? { ...prev, ...response.data.data } : null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save Razorpay settings
  const handleSaveRazorpaySettings = async () => {
    if (!selectedOrganization?.id) return;

    try {
      setIsSaving(true);
      const response = await apiClient.patch(`/organizations/${selectedOrganization.id}/payment-settings`, {
        razorpayKeyId: razorpayKeyId.trim() || null,
        razorpayKeySecret: razorpayKeySecret.trim() || null,
      });

      if (response.data.success) {
        toast({
          title: 'Settings Saved',
          description: 'Razorpay settings updated successfully',
        });
        setSettings(prev => prev ? { 
          ...prev, 
          ...response.data.data,
          razorpayConfigured: !!(razorpayKeyId && razorpayKeySecret)
        } : null);
        setRazorpayKeySecret(''); // Clear secret after saving
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Copy UPI ID to clipboard
  const copyUpiId = async () => {
    if (upiId) {
      await navigator.clipboard.writeText(upiId);
      toast({ title: 'Copied!', description: 'UPI ID copied to clipboard' });
    }
  };

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" description="Configure payment collection for your business" />
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payments" 
        description="Configure payment collection for your business"
      />

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${paymentEnabled ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Wallet className={`h-6 w-6 ${paymentEnabled ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Collection</p>
                <p className={`text-lg font-semibold ${paymentEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {paymentEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${upiId ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Smartphone className={`h-6 w-6 ${upiId ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">UPI</p>
                <p className={`text-lg font-semibold ${upiId ? 'text-blue-600' : 'text-gray-500'}`}>
                  {upiId ? 'Configured' : 'Not Set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${settings?.razorpayConfigured ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <CreditCard className={`h-6 w-6 ${settings?.razorpayConfigured ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razorpay</p>
                <p className={`text-lg font-semibold ${settings?.razorpayConfigured ? 'text-purple-600' : 'text-gray-500'}`}>
                  {settings?.razorpayConfigured ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upi" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="upi" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            UPI Settings
          </TabsTrigger>
          <TabsTrigger value="razorpay" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Razorpay (Advanced)
          </TabsTrigger>
        </TabsList>

        {/* UPI Settings Tab */}
        <TabsContent value="upi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                UPI Payment Settings
              </CardTitle>
              <CardDescription>
                Set up your UPI ID to receive direct payments from customers. This is the simplest way to collect payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Payment */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="payment-enabled" className="text-base font-medium">
                    Enable Payment Collection
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to pay via payment links in notifications
                  </p>
                </div>
                <Switch
                  id="payment-enabled"
                  checked={paymentEnabled}
                  onCheckedChange={setPaymentEnabled}
                />
              </div>

              <Separator />

              {/* UPI ID Input */}
              <div className="space-y-2">
                <Label htmlFor="upi-id">Your UPI ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="upi-id"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="flex-1"
                  />
                  {upiId && (
                    <Button variant="outline" size="icon" onClick={copyUpiId}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your UPI ID (e.g., yourname@paytm, yourname@ybl, yourname@oksbi)
                </p>
              </div>

              {/* How it works */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Info className="h-4 w-4" />
                  How it works
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <li>• When you send payment reminders, customers get a UPI link</li>
                  <li>• Clicking the link opens their UPI app with amount pre-filled</li>
                  <li>• They pay directly to your UPI ID - no intermediary</li>
                  <li>• Works with GPay, PhonePe, Paytm, and all UPI apps</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveUpiSettings} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save UPI Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Razorpay Settings Tab */}
        <TabsContent value="razorpay" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Razorpay Integration
                <Badge variant="outline" className="ml-2">Optional</Badge>
                {razorpayStatus?.testMode && (
                  <Badge variant="destructive" className="ml-2">
                    Test Mode
                  </Badge>
                )}
                {razorpayStatus?.mode === 'live' && (
                  <Badge variant="default" className="ml-2 bg-green-600">
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Connect Razorpay for advanced payment tracking, automatic reconciliation, and payment confirmation webhooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Mode Warning */}
              {razorpayStatus?.testMode && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">⚠️ Test Mode Active</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You&apos;re using test keys (rzp_test_*). Payments won&apos;t be charged. Use live keys (rzp_live_*) for real payments.
                    </p>
                  </div>
                </div>
              )}

              {settings?.razorpayConfigured ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Razorpay Connected</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Key ID: {razorpayKeyId || settings.razorpayKeyId}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Razorpay Not Connected</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      UPI links will still work. Razorpay is optional for advanced features.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razorpay-key">Razorpay Key ID</Label>
                  <Input
                    id="razorpay-key"
                    placeholder="rzp_live_xxxxxxxxxx"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razorpay-secret">Razorpay Key Secret</Label>
                  <Input
                    id="razorpay-secret"
                    type="password"
                    placeholder="Enter secret to update"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your secret is securely stored and never displayed after saving
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  <Shield className="h-4 w-4" />
                  Razorpay Benefits
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-purple-700 dark:text-purple-300">
                  <li>• Automatic payment confirmation via webhooks</li>
                  <li>• Expenses automatically marked as paid</li>
                  <li>• Payment tracking and history</li>
                  <li>• Professional payment page with your branding</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <a 
                  href="https://dashboard.razorpay.com/app/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get your Razorpay API keys
                </a>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveRazorpaySettings} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Razorpay Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
