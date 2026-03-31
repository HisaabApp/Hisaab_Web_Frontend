/**
 * PlanUsageWidget
 * Dashboard widget showing current plan usage and quick upgrade CTA
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { planService } from '@/lib/api/services';
import type { PlanStatus } from '@/lib/api/services/plan.service';
import { TrendingUp, Users, AlertTriangle, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export const PlanUsageWidget: React.FC = () => {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await planService.getStatus();
      setStatus(data);
    } catch (err: any) {
      // 401 means user is not authenticated (e.g. just logged out) — ignore silently
      if (err?.response?.status !== 401) {
        console.error('Failed to load plan status:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  // Check if any usage is over 75%
  const hasWarning = Object.values(status.usage).some(
    usage => usage.limit !== -1 && usage.percentage >= 75
  );

  // Check if any usage is at limit
  const hasLimit = Object.values(status.usage).some(
    usage => usage.limit !== -1 && usage.percentage >= 90
  );

  // Get the most critical usage
  const criticalUsage = Object.entries(status.usage)
    .filter(([_, usage]) => usage.limit !== -1)
    .sort((a, b) => b[1].percentage - a[1].percentage)[0];

  return (
    <Card className={hasLimit ? 'border-red-500' : hasWarning ? 'border-yellow-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Plan Usage</CardTitle>
            <CardDescription>
              {status.plan} Plan
            </CardDescription>
          </div>
          <Badge variant={status.plan === 'FREE' ? 'secondary' : 'default'}>
            {status.plan}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Most Critical Usage */}
        {criticalUsage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium capitalize">
                  {criticalUsage[0].replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <span className="text-muted-foreground">
                {criticalUsage[1].current} / {criticalUsage[1].limit === -1 ? '∞' : criticalUsage[1].limit}
              </span>
            </div>
            <Progress 
              value={Math.min(criticalUsage[1].percentage, 100)} 
              className={`h-2 ${
                criticalUsage[1].percentage >= 90 
                  ? 'bg-red-500' 
                  : criticalUsage[1].percentage >= 75 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              }`}
            />
            <p className="text-xs text-muted-foreground">
              {criticalUsage[1].percentage.toFixed(0)}% used
            </p>
          </div>
        )}

        {/* Warning or CTA */}
        {hasLimit ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-red-900 dark:text-red-100">
                Limit Reached
              </p>
              <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                Upgrade to continue adding more resources
              </p>
            </div>
          </div>
        ) : hasWarning ? (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Approaching Limit
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                Consider upgrading soon
              </p>
            </div>
          </div>
        ) : null}

        {/* Upgrade Button */}
        {status.plan !== 'PREMIUM' && (
          <Button 
            className="w-full" 
            size="sm"
            variant={hasLimit || hasWarning ? 'default' : 'outline'}
            onClick={() => router.push('/subscription')}
          >
            {status.plan === 'FREE' ? (
              <>
                <Crown className="h-4 w-4 mr-2" />
                View Plans
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
