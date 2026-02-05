'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Lock, 
  CreditCard,
  X
} from 'lucide-react';
import { subscriptionService, type SubscriptionStatus } from '@/lib/api/services/subscription.service';
import { useRouter } from 'next/navigation';

interface SubscriptionBannerProps {
  className?: string;
}

export function SubscriptionBanner({ className }: SubscriptionBannerProps) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await subscriptionService.getSubscriptionStatus();
        setStatus(data);
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Don't show anything while loading or if dismissed
  if (loading || dismissed || !status) return null;

  // Don't show for FREE plan (always active)
  if (status.plan === 'FREE' && status.status === 'ACTIVE') return null;

  // Don't show if subscription is active with more than 7 days
  if (status.status === 'ACTIVE' && (status.daysUntilExpiry === null || status.daysUntilExpiry > 7)) {
    return null;
  }

  const handleRenew = () => {
    router.push('/subscription');
  };

  // Expiring soon (within 7 days)
  if (status.status === 'ACTIVE' && status.daysUntilExpiry !== null && status.daysUntilExpiry <= 7) {
    return (
      <Alert className={`border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 ${className}`}>
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">
          Subscription Expiring Soon
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              Your {status.plan} plan expires in {status.daysUntilExpiry} day{status.daysUntilExpiry !== 1 ? 's' : ''}.
              Renew now to avoid any interruption.
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRenew}>
                <CreditCard className="h-4 w-4 mr-1" />
                Renew Now
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Grace period
  if (status.status === 'GRACE_PERIOD') {
    const daysRemaining = 10 - (status.daysInGracePeriod || 0);
    return (
      <Alert className={`border-orange-500 bg-orange-50 dark:bg-orange-950/20 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 dark:text-orange-200">
          Subscription Expired - Grace Period Active
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-medium">
                You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left to renew.
              </p>
              <p className="text-sm">
                After the grace period, your account will be limited to FREE plan features.
                {status.exceedsFreeLimit && (
                  <span className="font-medium"> You have more customers than the FREE limit allows.</span>
                )}
              </p>
            </div>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={handleRenew}>
              <CreditCard className="h-4 w-4 mr-1" />
              Renew Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Expired (after grace period)
  if (status.status === 'EXPIRED') {
    return (
      <Alert className={`border-red-500 bg-red-50 dark:bg-red-950/20 ${className}`}>
        <Lock className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-200">
          {status.isLocked ? 'Account Locked' : 'Subscription Expired'}
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              {status.isLocked ? (
                <>
                  <p className="font-medium">Your account is locked due to expired subscription.</p>
                  <p className="text-sm">
                    You have {status.currentUsage.customers} customers but FREE plan allows only {status.effectiveLimits.customers}.
                    Renew to restore full access to all your data.
                  </p>
                </>
              ) : (
                <p>
                  Your subscription has expired. You are now on the FREE plan with limited features.
                  Upgrade to access premium features.
                </p>
              )}
            </div>
            <Button size="sm" variant="destructive" onClick={handleRenew}>
              <CreditCard className="h-4 w-4 mr-1" />
              {status.isLocked ? 'Unlock Account' : 'Upgrade Now'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export default SubscriptionBanner;
