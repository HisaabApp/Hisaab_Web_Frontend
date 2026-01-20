'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { subscriptionService, type SubscriptionInfo, type Plan } from '@/lib/api/services/subscription.service';
import { CheckCircle2, XCircle, Crown, Zap, TrendingUp, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleUpgrade = async (planName: 'BASIC' | 'PREMIUM') => {
    // Show confirmation dialog
    const planDetails = plans.find(p => p.name === planName);
    if (!planDetails) return;

    const confirmed = confirm(
      `⚠️ DEMO MODE - Payment Gateway Not Integrated\n\n` +
      `You are about to upgrade to ${planName} plan (Rs.${planDetails.price}/month).\n\n` +
      `NOTE: This is currently in DEMO MODE. In production, you would be redirected to ` +
      `a payment gateway (Razorpay) to complete the payment.\n\n` +
      `For now, the upgrade will happen immediately without payment.\n\n` +
      `Do you want to continue?`
    );

    if (!confirmed) return;

    try {
      setUpgrading(true);
      setError(null);
      const result = await subscriptionService.upgradePlan(planName);
      if (result.success) {
        await loadData(); // Reload data
        alert(result.message || `Successfully upgraded to ${planName} plan`);
      }
    } catch (err: any) {
      console.error('Upgrade Error:', err);
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        'Failed to upgrade plan. Please try again.';
      setError(errorMessage);
    } finally {
      setUpgrading(false);
    }
  };

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

      {/* Demo Mode Warning */}
      <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <AlertDescription className="text-xs sm:text-sm text-amber-900 dark:text-amber-100">
          <strong>DEMO MODE:</strong> Payment gateway is not yet integrated. 
          Plan upgrades will work immediately without payment. 
          In production, Razorpay payment gateway will be required for paid plans.
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
                    className="w-full"
                  >
                    {upgrading ? 'Processing...' : `Upgrade to ${plan.name}`}
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
