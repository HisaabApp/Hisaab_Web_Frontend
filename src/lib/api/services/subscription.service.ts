import apiClient from '../client';

export interface Plan {
  name: string;
  messageLimit: number;
  price: number;
  features: string[];
}

export interface SubscriptionInfo {
  plan: string;
  planExpiry: string | null;
  messageLimit: number;
  messagesUsed: number;
  remaining: number;
  resetDate: string;
}

export const subscriptionService = {
  /**
   * Get current user's subscription info
   */
  async getSubscription(): Promise<SubscriptionInfo> {
    const response = await apiClient.get('/subscription');
    return response.data.data || response.data;
  },

  /**
   * Get available subscription plans
   */
  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get('/subscription/plans');
    return response.data.data || response.data;
  },

  /**
   * Upgrade to a new plan
   */
  async upgradePlan(plan: 'BASIC' | 'PREMIUM'): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/subscription/upgrade', { plan });
    return response.data;
  }
};
