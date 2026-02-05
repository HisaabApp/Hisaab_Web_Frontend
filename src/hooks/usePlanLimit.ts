/**
 * usePlanLimit Hook
 * Check plan limits and show upgrade modal when limits are reached
 */

import { useState, useCallback } from 'react';
import { planService } from '@/lib/api/services';
import { useAuth } from '@/contexts/AuthContext';

interface LimitCheckResult {
  allowed: boolean;
  showUpgrade: boolean;
  message?: string;
  limit?: number;
  current?: number;
}

interface UsePlanLimitReturn {
  canAddCustomer: () => Promise<LimitCheckResult>;
  canAddBranch: (organizationId: string) => Promise<LimitCheckResult>;
  canAddTeamMember: (organizationId: string) => Promise<LimitCheckResult>;
  checkFeatureAccess: (feature: string) => Promise<boolean>;
  isLoading: boolean;
}

export const usePlanLimit = (): UsePlanLimitReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const canAddCustomer = useCallback(async (): Promise<LimitCheckResult> => {
    setIsLoading(true);
    try {
      const result = await planService.canAddCustomer();
      
      return {
        allowed: result.allowed,
        showUpgrade: !result.allowed,
        message: result.message,
        limit: result.limit,
        current: result.current
      };
    } catch (error: any) {
      // If API returns 403, it means limit is reached
      if (error.response?.status === 403) {
        return {
          allowed: false,
          showUpgrade: true,
          message: error.response?.data?.message || 'Customer limit reached',
          limit: error.response?.data?.limit,
          current: error.response?.data?.current
        };
      }
      
      // For other errors, allow the action but log the error
      console.error('Error checking customer limit:', error);
      return { allowed: true, showUpgrade: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const canAddBranch = useCallback(async (organizationId: string): Promise<LimitCheckResult> => {
    setIsLoading(true);
    try {
      const result = await planService.canAddBranch(organizationId);
      
      return {
        allowed: result.allowed,
        showUpgrade: !result.allowed,
        message: result.message,
        limit: result.limit,
        current: result.current
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        return {
          allowed: false,
          showUpgrade: true,
          message: error.response?.data?.message || 'Branch limit reached',
          limit: error.response?.data?.limit,
          current: error.response?.data?.current
        };
      }
      
      console.error('Error checking branch limit:', error);
      return { allowed: true, showUpgrade: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const canAddTeamMember = useCallback(async (organizationId: string): Promise<LimitCheckResult> => {
    setIsLoading(true);
    try {
      const result = await planService.canAddTeamMember(organizationId);
      
      return {
        allowed: result.allowed,
        showUpgrade: !result.allowed,
        message: result.message,
        limit: result.limit,
        current: result.current
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        return {
          allowed: false,
          showUpgrade: true,
          message: error.response?.data?.message || 'Team member limit reached',
          limit: error.response?.data?.limit,
          current: error.response?.data?.current
        };
      }
      
      console.error('Error checking team member limit:', error);
      return { allowed: true, showUpgrade: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkFeatureAccess = useCallback(async (feature: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const hasAccess = await planService.hasFeature(feature);
      return hasAccess;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    canAddCustomer,
    canAddBranch,
    canAddTeamMember,
    checkFeatureAccess,
    isLoading
  };
};
