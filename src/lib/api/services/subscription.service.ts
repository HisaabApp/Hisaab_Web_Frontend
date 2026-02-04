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

export interface CreateOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    plan: string;
    isTestMode: boolean;
  };
}

export interface UpgradeResponse {
  success: boolean;
  message: string;
  demoMode?: boolean;
  requiresPayment?: boolean;
  razorpayConfigured?: boolean;
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
   * Create Razorpay order for subscription upgrade
   */
  async createOrder(plan: 'BASIC' | 'PREMIUM'): Promise<CreateOrderResponse> {
    const response = await apiClient.post('/subscription/create-order', { plan });
    return response.data;
  },

  /**
   * Upgrade to a new plan (with payment verification)
   */
  async upgradePlan(
    plan: 'BASIC' | 'PREMIUM',
    paymentDetails?: { paymentId: string; orderId: string; signature: string }
  ): Promise<UpgradeResponse> {
    const response = await apiClient.post('/subscription/upgrade', { 
      plan,
      ...paymentDetails 
    });
    return response.data;
  }
};
