'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { subscriptionService, type SubscriptionInfo } from '@/lib/api/services/subscription.service';
import { 
  Check, Crown, Zap, Star, Loader2, ArrowRight, 
  Sparkles, Users, MessageSquare, Building2, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Billing period configuration
type BillingPeriod = 'monthly' | 'quarterly' | 'halfYearly' | 'yearly';

interface PricingConfig {
  label: string;
  months: number;
  discount: number; // percentage discount
}

const BILLING_PERIODS: Record<BillingPeriod, PricingConfig> = {
  monthly: { label: '1 Month', months: 1, discount: 0 },
  quarterly: { label: '3 Months', months: 3, discount: 10 },
  halfYearly: { label: '6 Months', months: 6, discount: 15 },
  yearly: { label: '1 Year', months: 12, discount: 25 },
};

// Plan configuration
interface PlanConfig {
  name: string;
  monthlyPrice: number;
  features: string[];
  limits: {
    customers: string;
    messages: string;
    branches: string;
    team: string;
  };
  popular?: boolean;
  color: string;
  icon: React.ReactNode;
}

const PLANS: Record<string, PlanConfig> = {
  FREE: {
    name: 'Free',
    monthlyPrice: 0,
    color: 'gray',
    icon: <Star className="h-6 w-6" />,
    limits: {
      customers: '200',
      messages: '10/month',
      branches: '1',
      team: '1',
    },
    features: [
      'Basic customer management',
      'PDF invoices',
      'Expense tracking',
      'Basic reports',
    ],
  },
  BASIC: {
    name: 'Basic',
    monthlyPrice: 499,
    color: 'blue',
    popular: true,
    icon: <Zap className="h-6 w-6" />,
    limits: {
      customers: '1,000',
      messages: '100/month',
      branches: '3',
      team: '5',
    },
    features: [
      'Everything in Free',
      'WhatsApp & SMS notifications',
      'Multi-branch support',
      'Team collaboration',
      'Payment reminders',
      'Excel export',
      'Advanced analytics',
      'Priority email support',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    monthlyPrice: 999,
    color: 'amber',
    icon: <Crown className="h-6 w-6" />,
    limits: {
      customers: 'Unlimited',
      messages: '500/month',
      branches: 'Unlimited',
      team: 'Unlimited',
    },
    features: [
      'Everything in Basic',
      'Unlimited customers',
      'Unlimited branches',
      'Unlimited team members',
      'Custom branding',
      'API access',
      'Dedicated support',
      'Data export anytime',
    ],
  },
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

function SubscriptionContent() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.contains(script) && document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const sub = await subscriptionService.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (planKey: string, period: BillingPeriod) => {
    const plan = PLANS[planKey];
    const periodConfig = BILLING_PERIODS[period];
    const basePrice = plan.monthlyPrice * periodConfig.months;
    const discount = basePrice * (periodConfig.discount / 100);
    return Math.round(basePrice - discount);
  };

  const calculateUpgradePrice = (targetPlan: string, period: BillingPeriod) => {
    const currentPlan = subscription?.plan || 'FREE';
    
    // If downgrading or same plan, return 0
    const planOrder = { FREE: 0, BASIC: 1, PREMIUM: 2 };
    if (planOrder[targetPlan as keyof typeof planOrder] <= planOrder[currentPlan as keyof typeof planOrder]) {
      return 0;
    }

    // Calculate the price for target plan
    const targetPrice = calculatePrice(targetPlan, period);
    
    // If upgrading from a paid plan, calculate pro-rated credit
    if (currentPlan !== 'FREE' && subscription?.planExpiry) {
      const now = new Date();
      const expiry = new Date(subscription.planExpiry);
      const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const currentMonthlyPrice = PLANS[currentPlan].monthlyPrice;
      const dailyRate = currentMonthlyPrice / 30;
      const credit = Math.round(dailyRate * daysRemaining);
      return Math.max(0, targetPrice - credit);
    }

    return targetPrice;
  };

  const handleUpgrade = useCallback(async (planKey: string) => {
    if (planKey === 'FREE') {
      // Handle downgrade
      try {
        setUpgrading(planKey);
        await subscriptionService.cancelSubscription(true);
        await loadData();
        toast({ title: 'Plan Changed', description: 'You are now on the Free plan.' });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setUpgrading(null);
      }
      return;
    }

    const amount = calculateUpgradePrice(planKey, billingPeriod);
    const periodMonths = BILLING_PERIODS[billingPeriod].months;

    try {
      setUpgrading(planKey);

      // Try to create order
      const orderResponse = await subscriptionService.createOrder(planKey as 'BASIC' | 'PREMIUM');
      
      if (!orderResponse.success || !orderResponse.data) {
        // Demo mode - upgrade without payment
        const result = await subscriptionService.upgradePlan(planKey as 'BASIC' | 'PREMIUM');
        if (result.success) {
          await loadData();
          toast({ title: 'Success!', description: `Upgraded to ${PLANS[planKey].name} plan.` });
        }
        setUpgrading(null);
        return;
      }

      if (!razorpayLoaded || !window.Razorpay) {
        toast({ title: 'Loading...', description: 'Payment gateway loading. Try again.' });
        setUpgrading(null);
        return;
      }

      const options = {
        key: orderResponse.data.keyId,
        amount: amount * 100,
        currency: 'INR',
        name: 'HisaabApp',
        description: `${PLANS[planKey].name} Plan - ${BILLING_PERIODS[billingPeriod].label}`,
        order_id: orderResponse.data.orderId,
        handler: async (response: any) => {
          try {
            const result = await subscriptionService.upgradePlan(planKey as 'BASIC' | 'PREMIUM', {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            });
            if (result.success) {
              await loadData();
              toast({ title: 'Payment Successful!', description: `Welcome to ${PLANS[planKey].name}!` });
            }
          } catch (err: any) {
            toast({ title: 'Error', description: 'Payment verification failed.', variant: 'destructive' });
          }
          setUpgrading(null);
        },
        prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
        theme: { color: '#10b981' },
        modal: { ondismiss: () => setUpgrading(null) }
      };

      new window.Razorpay(options).open();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Something went wrong.', variant: 'destructive' });
      setUpgrading(null);
    }
  }, [billingPeriod, subscription, razorpayLoaded, user, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'FREE';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Simple pricing. No hidden fees. Cancel anytime.
          </p>
        </div>

        {/* Current Plan Badge */}
        {currentPlan !== 'FREE' && (
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="px-4 py-1.5 text-sm">
              Current Plan: <span className="font-bold ml-1">{PLANS[currentPlan].name}</span>
              {subscription?.planExpiry && (
                <span className="ml-2 text-muted-foreground">
                  • Expires {new Date(subscription.planExpiry).toLocaleDateString()}
                </span>
              )}
            </Badge>
          </div>
        )}

        {/* Billing Period Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-muted p-1 rounded-lg">
            {(Object.entries(BILLING_PERIODS) as [BillingPeriod, PricingConfig][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setBillingPeriod(key)}
                className={`
                  px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${billingPeriod === key 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'}
                `}
              >
                {config.label}
                {config.discount > 0 && (
                  <span className="ml-1 text-xs text-green-600 font-bold">-{config.discount}%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(Object.entries(PLANS) as [string, PlanConfig][]).map(([key, plan]) => {
            const price = calculatePrice(key, billingPeriod);
            const upgradePrice = calculateUpgradePrice(key, billingPeriod);
            const isCurrentPlan = currentPlan === key;
            const isUpgrade = !isCurrentPlan && (
              (key === 'BASIC' && currentPlan === 'FREE') ||
              (key === 'PREMIUM' && currentPlan !== 'PREMIUM')
            );
            const isDowngrade = !isCurrentPlan && (
              (key === 'FREE' && currentPlan !== 'FREE') ||
              (key === 'BASIC' && currentPlan === 'PREMIUM')
            );

            return (
              <Card 
                key={key}
                className={`
                  relative overflow-hidden transition-all duration-200
                  ${plan.popular ? 'border-primary shadow-lg scale-[1.02]' : ''}
                  ${isCurrentPlan ? 'ring-2 ring-primary' : ''}
                `}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`
                      p-2 rounded-lg
                      ${plan.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                      ${plan.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                      ${plan.color === 'gray' ? 'bg-gray-100 text-gray-600' : ''}
                    `}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {price === 0 ? 'Free' : `Rs.${price.toLocaleString()}`}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{BILLING_PERIODS[billingPeriod].label.toLowerCase()}
                        </span>
                      )}
                    </div>
                    {price > 0 && billingPeriod !== 'monthly' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Rs.{Math.round(price / BILLING_PERIODS[billingPeriod].months)}/month
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.limits.customers} customers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.limits.messages}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.limits.branches} branches</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.limits.team} team</span>
                    </div>
                  </div>

                  <Separator className="mb-6" />

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button 
                      className="w-full"
                      onClick={() => handleUpgrade(key)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {currentPlan !== 'FREE' && upgradePrice < price ? (
                        <>Upgrade for Rs.{upgradePrice.toLocaleString()}</>
                      ) : (
                        <>Get {plan.name} - Rs.{price.toLocaleString()}</>
                      )}
                    </Button>
                  ) : isDowngrade ? (
                    <Button 
                      variant="ghost" 
                      className="w-full text-muted-foreground"
                      onClick={() => handleUpgrade(key)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Downgrade to {plan.name}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>No Hidden Fees</span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">Can I upgrade or downgrade anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can change your plan anytime. When upgrading, you only pay the difference. 
                When downgrading, your current plan stays active until it expires.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept UPI, Credit/Debit cards, Net Banking, and Wallets via Razorpay.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">Is there a refund policy?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, we offer a 7-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}
