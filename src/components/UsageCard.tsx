/**
 * UsageCard Component
 * Display current plan usage with progress bars
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Building2, UserPlus, MessageSquare, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import type { PlanStatus } from '@/lib/api/services/plan.service';

interface UsageCardProps {
  status: PlanStatus;
}

const usageIcons = {
  customers: Users,
  branches: Building2,
  teamMembers: UserPlus,
  messages: MessageSquare,
  invoices: FileText
};

export const UsageCard: React.FC<UsageCardProps> = ({ status }) => {
  // Safety check
  if (!status || !status.usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (value: number) => {
    if (value === -1) return '∞';
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Your {status.plan} plan limits and usage</CardDescription>
          </div>
          <Badge variant="outline" className="text-lg">
            {status.plan} Plan
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {Object.entries(status.usage).map(([key, usage]) => {
          if (!usage) return null;
          
          const Icon = usageIcons[key as keyof typeof usageIcons] || Users;
          const percentage = usage.percentage || 0;
          const isNearLimit = percentage >= 75;
          const isAtLimit = percentage >= 90;

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {isAtLimit && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {(usage.current || 0).toLocaleString()} / {formatLimit(usage.limit || 0)}
                </span>
              </div>
              
              {usage.limit !== -1 && (
                <div className="space-y-1">
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${getProgressColor(percentage)}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(0)}% used</span>
                    {(usage.remaining || 0) > 0 && (
                      <span>{(usage.remaining || 0).toLocaleString()} remaining</span>
                    )}
                  </div>
                </div>
              )}

              {isNearLimit && usage.limit !== -1 && (
                <Alert variant={isAtLimit ? 'destructive' : 'default'} className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {isAtLimit 
                      ? `You've reached your ${key} limit. Upgrade to add more.`
                      : `You're approaching your ${key} limit (${usage.remaining || 0} remaining)`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          );
        })}

        {/* Messages Reset Info */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Message quota resets on {new Date(status.messagesResetDate).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
