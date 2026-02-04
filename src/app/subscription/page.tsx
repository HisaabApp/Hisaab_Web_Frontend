'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { subscriptionService, type SubscriptionInfo, type Plan } from '@/lib/api/services/subscription.service';
import { CheckCircle2, XCircle, Crown, Zap, TrendingUp, Calendar, MessageSquare, AlertTriangle, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Declare Razorpay type
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay script');
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subData, plansData] = await Promise.all([
        subscriptionService.getSubscription(),
        subscriptionService.getPlans()
      ]);
      setSubscription(subData);
      setPlans(plansData);
    } catch (err) {
      setError('Failed to load subscription data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = useCallback(async (planName: 'BASIC' | 'PREMIUM') => {
    const planDetails = plans.find(p => p.name === planName);
    if (!planDetails) return;

    try {
      setUpgrading(true);
      setError(null);

      // Step 1: Create Razorpay order
      const orderResponse = await subscriptionService.createOrder(planName);
      
      if (!orderResponse.success || !orderResponse.data) {
        // If Razorpay not configured, try demo mode upgrade
        const result = await subscriptionService.upgradePlan(planName);
        if (result.success) {
          await loadData();
          toast({
            title: 'Plan Upgraded!',
            description: result.message,
          });
        } else if (result.requiresPayment) {
          setError('Payment gateway not configured. Please contact support.');
        }
        setUpgrading(false);
        return;
      }

      const { orderId, amount, keyId, isTestMode } = orderResponse.data;

      // Step 2: Open Razorpay checkout
      if (!razorpayLoaded || !window.Razorpay) {
        setError('Payment gateway is loading. Please try again.');
        setUpgrading(false);
        return;
      }

      const options = {
        key: keyId,
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'HisaabApp',
        description: `${planName} Plan Subscription`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#10b981', // Emerald color
        },
        handler: async (response: any) => {
          // Step 3: Verify payment and upgrade
          try {
            const upgradeResult = await subscriptionService.upgradePlan(planName, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            if (upgradeResult.success) {
              await loadData();
              toast({
                title: 'Payment Successful!',
                description: `You are now on the ${planName} plan.`,
              });
            } else {
              setError(upgradeResult.message || 'Failed to verify payment');
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
          }
          setUpgrading(false);
        },
        modal: {
          ondismiss: () => {
            setUpgrading(false);
            toast({
              title: 'Payment Cancelled',
              description: 'You can upgrade anytime.',
              variant: 'destructive',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error('Upgrade Error:', err);
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        'Failed to initiate payment. Please try again.';
      setError(errorMessage);
      setUpgrading(false);
    }
  }, [plans, razorpayLoaded, user, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription...</p>
        </div>
      </div>
    );
  }

  const usagePercentage = subscription 
    ? (subscription.messagesUsed / subscription.messageLimit) * 100 
    : 0;

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'PREMIUM': return <Crown className="h-5 w-5 text-amber-500" />;
      case 'BASIC': return <Zap className="h-5 w-5 text-blue-500" />;
      default: return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanBadge = (planName: string) => {
    switch (planName) {
      case 'PREMIUM': return <Badge className="bg-amber-500">Premium</Badge>;
      case 'BASIC': return <Badge className="bg-blue-500">Basic</Badge>;
      default: return <Badge variant="outline">Free</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your plan and message usage
        </p>
      </div>

      {/* Payment Info */}
      <Alert className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
        <Shield className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <AlertDescription className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
          <strong>Secure Payments:</strong> All payments are processed securely via Razorpay (UPI only).
          Your payment information is never stored on our servers.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPlanIcon(subscription.plan)}
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your active subscription</CardDescription>
                </div>
              </div>
              {getPlanBadge(subscription.plan)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Usage Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Message Usage</span>
                <span className="font-medium">
                  {subscription.messagesUsed} / {subscription.messageLimit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {subscription.remaining} messages remaining this month
              </p>
            </div>

            {/* Reset Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Resets on: {new Date(subscription.resetDate).toLocaleDateString()}
              </span>
            </div>

            {/* Warning if low on messages */}
            {subscription.remaining < subscription.messageLimit * 0.2 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  You're running low on messages. Consider upgrading for more capacity.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={subscription?.plan === plan.name ? 'border-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    {getPlanIcon(plan.name)}
                    {plan.name}
                  </CardTitle>
                  {subscription?.plan === plan.name && (
                    <Badge variant="outline">Current</Badge>
                  )}
                </div>
                <CardDescription>
                  <span className="text-2xl sm:text-3xl font-bold">
                    {plan.price === 0 ? 'Free' : `Rs.${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-xs sm:text-sm">/month</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {plan.messageLimit} messages/month
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {subscription?.plan !== plan.name && plan.name !== 'FREE' && (
                  <Button
                    onClick={() => handleUpgrade(plan.name as 'BASIC' | 'PREMIUM')}
                    disabled={upgrading}
                    className="w-full gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    {upgrading ? 'Processing...' : `Pay Rs.${plan.price} & Upgrade`}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cost Information */}
      <Card>
        <CardHeader>
          <CardTitle>Message Costs</CardTitle>
          <CardDescription>Understanding your message usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="font-medium">SMS</span>
              </div>
              <p className="text-2xl font-bold">Rs.0.20</p>
              <p className="text-sm text-muted-foreground">per message</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="font-medium">WhatsApp</span>
              </div>
              <p className="text-2xl font-bold">Rs.0.05</p>
              <p className="text-sm text-muted-foreground">per message</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
