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
    monthlyPrice: 99,
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
    monthlyPrice: 499,
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

  // Check if user is within 10-day upgrade window
  const isWithinUpgradeWindow = () => {
    if (!subscription?.planExpiry || subscription.plan === 'FREE') return false;
    
    const now = new Date();
    const expiry = new Date(subscription.planExpiry);
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Within upgrade window if 10 days or less remaining AND still active
    return daysRemaining <= 10 && daysRemaining > 0;
  };

  // Get days remaining in current subscription
  const getDaysRemaining = () => {
    if (!subscription?.planExpiry || subscription.plan === 'FREE') return -1;
    
    const now = new Date();
    const expiry = new Date(subscription.planExpiry);
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining;
  };

  // Check if can upgrade to a longer period
  const canUpgradeToLongerPeriod = (period: BillingPeriod) => {
    if (subscription?.plan === 'FREE') return true; // FREE users can upgrade anytime
    if (period === 'monthly') return true; // Always allow 1-month renewal
    
    // Longer periods only allowed within 10-day window
    return isWithinUpgradeWindow();
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
    
    // If upgrading from a paid plan, calculate pro-rated credit based on DAILY rate
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
    const currentPlan = subscription?.plan || 'FREE';
    const planOrder = { FREE: 0, BASIC: 1, PREMIUM: 2 };
    const isDowngrade = planOrder[planKey as keyof typeof planOrder] < planOrder[currentPlan as keyof typeof planOrder];

    // Check if this is a downgrade during active paid period
    if (isDowngrade && subscription?.planExpiry) {
      const now = new Date();
      const expiry = new Date(subscription.planExpiry);
      
      if (expiry > now) {
        // Active paid period - cannot downgrade immediately
        toast({ 
          title: 'Cannot Downgrade Now', 
          description: `You have an active ${currentPlan} subscription until ${expiry.toLocaleDateString()}. You've already paid for this period and will keep access to all features until then.`,
          variant: 'default'
        });
        return;
      }
    }

    if (planKey === 'FREE') {
      // Handle downgrade
      try {
        setUpgrading(planKey);
        const result = await subscriptionService.cancelSubscription(true);
        await loadData();
        
        if (result.scheduled) {
          toast({ 
            title: 'Downgrade Scheduled', 
            description: result.message,
            variant: 'default'
          });
        } else {
          toast({ 
            title: 'Plan Changed', 
            description: result.message || 'You are now on the Free plan.' 
          });
        }
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
      const orderResponse = await subscriptionService.createOrder(planKey as 'BASIC' | 'PREMIUM', periodMonths);
      
      if (!orderResponse.success || !orderResponse.data) {
        // Check if error is due to upgrade window validation
        const errorMsg = orderResponse.message || '';
        if (errorMsg.includes('upgrade window') || errorMsg.includes('10 days')) {
          toast({ 
            title: 'Cannot Upgrade Now', 
            description: errorMsg,
            variant: 'destructive'
          });
          setUpgrading(null);
          return;
        }

        // Demo mode - upgrade without payment
        const result = await subscriptionService.upgradePlan(planKey as 'BASIC' | 'PREMIUM');
        if (result.success) {
          await loadData();
          
          if (result.scheduled) {
            toast({ 
              title: 'Plan Change Scheduled', 
              description: result.message,
              variant: 'default'
            });
          } else {
            toast({ 
              title: 'Success!', 
              description: result.message || `Upgraded to ${PLANS[planKey].name} plan.` 
            });
          }
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
        amount: orderResponse.data.amount * 100, // Use backend amount to ensure consistency
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
              toast({ 
                title: 'Payment Successful!', 
                description: result.message || `Welcome to ${PLANS[planKey].name}!` 
              });
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
              {subscription?.planExpiry && (() => {
                const expiry = new Date(subscription.planExpiry);
                const now = new Date();
                const isActive = expiry > now;
                return (
                  <span className={`ml-2 ${isActive ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    • {isActive ? `Active until ${expiry.toLocaleDateString()}` : `Expired ${expiry.toLocaleDateString()}`}
                  </span>
                );
              })()}
            </Badge>
          </div>
        )}

        {/* Billing Period Selector */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="inline-flex items-center bg-muted p-1 rounded-lg">
            {(Object.entries(BILLING_PERIODS) as [BillingPeriod, PricingConfig][]).map(([key, config]) => {
              const isDisabled = !canUpgradeToLongerPeriod(key);
              return (
                <button
                  key={key}
                  onClick={() => !isDisabled && setBillingPeriod(key)}
                  disabled={isDisabled}
                  className={`
                    px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                    ${billingPeriod === key 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'}
                  `}
                  title={isDisabled ? `Available within 10 days of renewal` : ''}
                >
                  {config.label}
                  {config.discount > 0 && (
                    <span className="ml-1 text-xs text-green-600 font-bold">-{config.discount}%</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Upgrade Window Notice */}
          {currentPlan !== 'FREE' && (
            <div className="text-xs text-muted-foreground text-center max-w-md">
              {isWithinUpgradeWindow() ? (
                <span className="text-green-600 font-medium">
                  ✅ 10-day upgrade window active - Upgrade to longer plans now! 
                  ({getDaysRemaining()} days remaining)
                </span>
              ) : getDaysRemaining() > 0 ? (
                <span>
                  Longer plans available in {30 - getDaysRemaining()} days. 
                  You can renew for 1 month anytime.
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(PLANS).length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-muted-foreground">No plans available</p>
            </div>
          ) : (
            Object.entries(PLANS).map(([key, plan]) => {
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
            
            // Check if downgrade is blocked due to active paid period
            const hasActivePlan = isDowngrade && subscription?.planExpiry && 
              (new Date(subscription.planExpiry).getTime() > new Date().getTime());

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
                      disabled={upgrading !== null || !canUpgradeToLongerPeriod(billingPeriod)}
                      title={!canUpgradeToLongerPeriod(billingPeriod) ? 'Available within 10 days of renewal' : ''}
                    >
                      {upgrading === key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {currentPlan !== 'FREE' && upgradePrice < price ? (
                        <>
                          Upgrade for Rs.{upgradePrice.toLocaleString()}
                          <span className="text-xs opacity-75 ml-1">
                            (save {(price - upgradePrice).toLocaleString()})
                          </span>
                        </>
                      ) : (
                        <>Get {plan.name} - Rs.{price.toLocaleString()}</>
                      )}
                    </Button>
                  ) : isDowngrade ? (
                    <Button 
                      variant={hasActivePlan ? "outline" : "ghost"} 
                      className={`w-full ${hasActivePlan ? 'opacity-60 cursor-not-allowed' : 'text-muted-foreground'}`}
                      onClick={() => !hasActivePlan && handleUpgrade(key)}
                      disabled={upgrading !== null || !!hasActivePlan}
                    >
                      {upgrading === key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {hasActivePlan ? (
                        <span className="text-xs">🔒 Available after {new Date(subscription!.planExpiry!).toLocaleDateString()}</span>
                      ) : (
                        `Downgrade to ${plan.name}`
                      )}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
          )}
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
              <h3 className="font-medium mb-1">💡 What is the 10-Day Upgrade Window?</h3>
              <p className="text-sm text-muted-foreground">
                We offer a 10-day upgrade window before your subscription expires. During this period, you can upgrade to longer plans (3 months, 6 months, 1 year) and receive credit for your remaining days. 
                <strong> Example:</strong> If you subscribed for 1 month at ₹99 and have 5 days left, upgrading to 3 months costs only ₹250 (₹267 - ₹17 credit) instead of ₹267.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">📅 What happens after my 10-day window?</h3>
              <p className="text-sm text-muted-foreground">
                After the upgrade window closes, you can only renew for 1 month. This prevents accidental bulk purchases. Once you renew for 1 month, you'll get another 10-day window at the end of that month.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">Can I upgrade or downgrade anytime?</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Upgrades:</strong> Applied immediately! You'll get credit for remaining days on your current plan. Pay only the difference and upgrade to longer plans within 10 days of expiry.<br/>
                <strong>Downgrades:</strong> Cannot downgrade during active paid period. You've already paid, so you keep your current plan features until the end of your billing period.
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
