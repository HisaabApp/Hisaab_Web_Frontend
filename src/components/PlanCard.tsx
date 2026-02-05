/**
 * PlanCard Component
 * Display individual plan details with features and CTA
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap, Star } from 'lucide-react';
import type { PlanDetails } from '@/lib/api/services/plan.service';

interface PlanCardProps {
  plan: PlanDetails;
  currentPlan: string;
  onUpgrade: (planName: 'BASIC' | 'PREMIUM') => void;
  loading?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, currentPlan, onUpgrade, loading }) => {
  // Add safety checks for undefined plan properties
  if (!plan || !plan.name) {
    return null;
  }

  const isCurrentPlan = plan.name === currentPlan;
  const isDowngrade = plan.name === 'FREE' && currentPlan !== 'FREE';
  const canUpgrade = plan.name !== 'FREE' && !isCurrentPlan && !isDowngrade;

  const planIcon = {
    FREE: Star,
    BASIC: Zap,
    PREMIUM: Crown
  }[plan.name] || Star;

  const Icon = planIcon;

  const formatLimit = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    if (value === -1) return 'Unlimited';
    if (value >= 1000) return `${value / 1000}K`;
    return value.toString();
  };

  // Safety check for limits
  const limits = plan.limits || {
    customers: 0,
    branches: 0,
    teamMembers: 0,
    dataRetentionMonths: 0
  };

  // Safety check for features
  const features = plan.features || {};

  return (
    <Card className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'border-green-500' : ''}`}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {plan.displayName}
          </CardTitle>
          {isCurrentPlan && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Current Plan
            </Badge>
          )}
        </div>
        <CardDescription>{plan.description}</CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{plan.currency}{plan.price}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Limits Section */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Limits</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customers</span>
              <span className="font-medium">{formatLimit(limits.customers)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branches</span>
              <span className="font-medium">{formatLimit(limits.branches)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Team Members</span>
              <span className="font-medium">{formatLimit(limits.teamMembers)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Retention</span>
              <span className="font-medium">{limits.dataRetentionMonths || 'N/A'} months</span>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Key Features</h4>
          <ul className="space-y-2">
            {Object.entries(features)
              .filter(([_, enabled]) => enabled)
              .slice(0, 6)
              .map(([feature]) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        {canUpgrade ? (
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => onUpgrade(plan.name as 'BASIC' | 'PREMIUM')}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Upgrade to ${plan.displayName}`}
          </Button>
        ) : isCurrentPlan ? (
          <Button className="w-full" size="lg" variant="outline" disabled>
            Current Plan
          </Button>
        ) : (
          <Button className="w-full" size="lg" variant="ghost" disabled>
            {isDowngrade ? 'Downgrade Not Available' : 'Get Started'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
