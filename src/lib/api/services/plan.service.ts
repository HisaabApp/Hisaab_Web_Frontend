/**
 * Plan Service
 * API client for subscription plan features, limits, and comparisons
 */

import apiClient from '../client';

export type PlanType = 'FREE' | 'BASIC' | 'PREMIUM';

export interface PlanLimits {
  customers: number;
  branches: number;
  teamMembers: number;
  messages: number;
  invoices: number;
  dailyReports: number;
  whatsappDaily: number;
  smsDaily: number;
  dataRetentionMonths: number;
}

export interface PlanFeatures {
  [key: string]: boolean;
}

export interface PlanDetails {
  name: PlanType;
  displayName: string;
  price: number;
  currency: string;
  limits: PlanLimits;
  features: PlanFeatures;
  description: string;
  popular?: boolean;
}

export interface UsageStats {
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
}

export interface PlanStatus {
  plan: PlanType;
  limits: PlanLimits;
  usage: {
    customers: UsageStats;
    branches: UsageStats;
    teamMembers: UsageStats;
    messages: UsageStats;
    invoices: UsageStats;
  };
  features: PlanFeatures;
  messagesResetDate: string;
}

export interface FeatureDescription {
  name: string;
  description: string;
  category: string;
}

export interface PlanComparison {
  plans: PlanDetails[];
  features: {
    category: string;
    items: {
      name: string;
      description: string;
      plans: {
        [key in PlanType]: boolean | string | number;
      };
    }[];
  }[];
}

export const planService = {
  /**
   * Get current user's plan status and usage
   */
  async getStatus(): Promise<PlanStatus> {
    const response = await apiClient.get('/plan/status');
    return response.data.data;
  },

  /**
   * Get all plan limits and details
   */
  async getLimits(): Promise<Record<PlanType, PlanDetails>> {
    const response = await apiClient.get('/plan/limits');
    return response.data.data;
  },

  /**
   * Get all feature descriptions
   */
  async getFeatures(): Promise<FeatureDescription[]> {
    const response = await apiClient.get('/plan/features');
    return response.data.data;
  },

  /**
   * Get plan comparison table
   */
  async getComparison(): Promise<PlanComparison> {
    const response = await apiClient.get('/plan/compare');
    return response.data.data;
  },

  /**
   * Check if user can add more customers
   */
  async canAddCustomer(): Promise<{ allowed: boolean; message?: string; limit?: number; current?: number }> {
    try {
      const response = await apiClient.get('/plan/check/customer');
      // Backend returns 200 with data.allowed=true when allowed
      return { 
        allowed: response.data.data?.allowed ?? true,
        limit: response.data.data?.limit,
        current: response.data.data?.current
      };
    } catch (error: any) {
      // Backend returns 403 when limit reached
      return {
        allowed: false,
        message: error.response?.data?.message || 'Limit reached',
        limit: error.response?.data?.limit,
        current: error.response?.data?.current
      };
    }
  },

  /**
   * Check if organization can add more branches
   */
  async canAddBranch(organizationId: string): Promise<{ allowed: boolean; message?: string; limit?: number; current?: number }> {
    try {
      const response = await apiClient.get(`/plan/check/branch?organizationId=${organizationId}`);
      // Backend returns 200 with data.allowed=true when allowed
      return { 
        allowed: response.data.data?.allowed ?? true,
        limit: response.data.data?.limit,
        current: response.data.data?.current
      };
    } catch (error: any) {
      // Backend returns 403 when limit reached
      return {
        allowed: false,
        message: error.response?.data?.message || 'Branch limit reached',
        limit: error.response?.data?.limit,
        current: error.response?.data?.current
      };
    }
  },

  /**
   * Check if organization can add more team members
   */
  async canAddTeamMember(organizationId: string): Promise<{ allowed: boolean; message?: string; limit?: number; current?: number }> {
    try {
      const response = await apiClient.get(`/plan/check/team-member?organizationId=${organizationId}`);
      // Backend returns 200 with data.allowed=true when allowed
      return { 
        allowed: response.data.data?.allowed ?? true,
        limit: response.data.data?.limit,
        current: response.data.data?.current
      };
    } catch (error: any) {
      // Backend returns 403 when limit reached
      return {
        allowed: false,
        message: error.response?.data?.message || 'Team member limit reached',
        limit: error.response?.data?.limit,
        current: error.response?.data?.current
      };
    }
  },

  /**
   * Check if user has access to a specific feature
   */
  async hasFeature(feature: string): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.features[feature] === true;
    } catch {
      return false;
    }
  }
};
