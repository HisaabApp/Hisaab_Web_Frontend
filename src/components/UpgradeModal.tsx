/**
 * UpgradeModal Component
 * Modal dialog that appears when user hits plan limits
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { planService, subscriptionService } from '@/lib/api/services';
import type { PlanDetails } from '@/lib/api/services/plan.service';
import { Crown, Zap, Check, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType?: 'customers' | 'branches' | 'teamMembers' | 'messages' | 'invoices';
  currentPlan: string;
  message?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  limitType,
  currentPlan,
  message
}) => {
  const [plans, setPlans] = useState<Record<string, PlanDetails> | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const plansData = await planService.getLimits();
      setPlans(plansData);
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const getRecommendedPlan = () => {
    if (currentPlan === 'FREE') return 'BASIC';
    if (currentPlan === 'BASIC') return 'PREMIUM';
    return null;
  };

  const handleUpgrade = () => {
    router.push('/subscription');
    onClose();
  };

  const handleViewPlans = () => {
    router.push('/subscription');
    onClose();
  };

  const recommendedPlan = getRecommendedPlan();
  const rawPlanDetails = plans && recommendedPlan ? plans[recommendedPlan] : null;
  
  // Handle both nested (limits.customers) and flat (customers) API response structures
  const recommendedPlanDetails = rawPlanDetails ? {
    ...rawPlanDetails,
    limits: rawPlanDetails.limits || {
      customers: (rawPlanDetails as any).customers ?? 0,
      branches: (rawPlanDetails as any).branches ?? 0,
      teamMembers: (rawPlanDetails as any).teamMembers ?? 0,
      messages: (rawPlanDetails as any).messages ?? 0,
      invoices: (rawPlanDetails as any).invoices ?? 0,
      dailyReports: (rawPlanDetails as any).dailyReports ?? 0,
      whatsappDaily: (rawPlanDetails as any).whatsappDaily ?? 0,
      smsDaily: (rawPlanDetails as any).smsDaily ?? 0,
      dataRetentionMonths: (rawPlanDetails as any).dataRetentionMonths ?? 0,
    },
    features: rawPlanDetails.features || {},
    displayName: rawPlanDetails.displayName || (recommendedPlan === 'BASIC' ? 'Basic Plan' : 'Premium Plan'),
    currency: rawPlanDetails.currency || '₹',
    price: rawPlanDetails.price ?? 0,
  } : null;

  const getLimitLabel = (type?: string) => {
    const labels: Record<string, string> = {
      customers: 'Customer',
      branches: 'Branch',
      teamMembers: 'Team Member',
      messages: 'Message',
      invoices: 'Invoice'
    };
    return type ? labels[type] || 'Resource' : 'Resource';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <DialogTitle className="text-2xl">Upgrade Required</DialogTitle>
          </div>
          <DialogDescription>
            {message || `You've reached your ${currentPlan} plan limit for ${getLimitLabel(limitType)}s`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Situation */}
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Your business is growing! Upgrade to continue adding more {getLimitLabel(limitType).toLowerCase()}s
              and unlock powerful features.
            </AlertDescription>
          </Alert>

          {/* Recommended Plan */}
          {recommendedPlanDetails && recommendedPlanDetails.limits && (
            <div className="border-2 border-primary rounded-lg p-6 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {recommendedPlan === 'BASIC' ? (
                    <Zap className="h-6 w-6 text-primary" />
                  ) : (
                    <Crown className="h-6 w-6 text-primary" />
                  )}
                  <h3 className="text-xl font-bold">{recommendedPlanDetails.displayName}</h3>
                </div>
                <Badge variant="default">Recommended</Badge>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">{recommendedPlanDetails.currency}{recommendedPlanDetails.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">What you'll get:</h4>
                
                {/* Limits Comparison */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-muted-foreground">Customers</span>
                    <span className="font-bold">
                      {recommendedPlanDetails.limits?.customers === -1 
                        ? '∞' 
                        : (recommendedPlanDetails.limits?.customers || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-muted-foreground">Branches</span>
                    <span className="font-bold">
                      {recommendedPlanDetails.limits?.branches === -1 
                        ? '∞' 
                        : recommendedPlanDetails.limits?.branches || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-muted-foreground">Team Members</span>
                    <span className="font-bold">
                      {recommendedPlanDetails.limits?.teamMembers === -1 
                        ? '∞' 
                        : recommendedPlanDetails.limits?.teamMembers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-muted-foreground">Messages/Month</span>
                    <span className="font-bold">
                      {recommendedPlanDetails.limits?.messages === -1 
                        ? '∞' 
                        : recommendedPlanDetails.limits?.messages || 0}
                    </span>
                  </div>
                </div>

                {/* Key Features */}
                <ul className="space-y-2 mt-4">
                  {(() => {
                    const features = recommendedPlanDetails.features;
                    // Handle both array format (from backend) and object format
                    if (Array.isArray(features)) {
                      return features.slice(0, 5).map((feature: string) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>
                            {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </li>
                      ));
                    } else if (features && typeof features === 'object') {
                      return Object.entries(features)
                        .filter(([_, enabled]) => enabled)
                        .slice(0, 5)
                        .map(([feature]) => (
                          <li key={feature} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </li>
                        ));
                    }
                    return null;
                  })()}
                </ul>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Benefits of Upgrading
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Immediate access to all features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>No interruption to your business operations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Cancel anytime, no long-term commitment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Secure payment through Razorpay</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Maybe Later
          </Button>
          <Button variant="secondary" onClick={handleViewPlans} className="w-full sm:w-auto">
            Compare All Plans
          </Button>
          {recommendedPlan && (
            <Button onClick={handleUpgrade} className="w-full sm:w-auto">
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade to {recommendedPlan}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
