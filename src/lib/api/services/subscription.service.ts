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
  customerCount?: number;
  customerLimit?: number;
}

// Subscription status types
export type SubscriptionStatusType = 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED';

export interface SubscriptionStatus {
  status: SubscriptionStatusType;
  plan: string;
  planExpiry: string | null;
  graceEndDate: string | null;
  daysUntilExpiry: number | null;
  daysInGracePeriod: number | null;
  isLocked: boolean;
  lockedReason: string | null;
  canAccessFeatures: boolean;
  message: string;
  effectiveLimits: {
    customers: number;
    messages: number;
    branches: number;
    teamMembers: number;
  };
  currentUsage: {
    customers: number;
    messages: number;
  };
  exceedsFreeLimit: boolean;
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
  scheduled?: boolean;
  effectiveDate?: string;
}

export interface BillingTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  plan: string;
  invoiceUrl: string | null;
}

export interface BillingHistory {
  transactions: BillingTransaction[];
  nextBillingDate: string | null;
  currentPlan: string;
}

export interface CancelResponse {
  success: boolean;
  message: string;
  data?: {
    effectiveDate: string;
  };
  scheduled?: boolean;
  effectiveDate?: string;
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
   * Get subscription status (grace period, lock state, etc.)
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await apiClient.get('/subscription/status');
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
   * Get billing history
   */
  async getBillingHistory(): Promise<BillingHistory> {
    const response = await apiClient.get('/subscription/billing');
    return response.data.data || response.data;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(immediate: boolean = false): Promise<CancelResponse> {
    const response = await apiClient.post('/subscription/cancel', { immediate });
    return response.data;
  },

  /**
   * Create Razorpay order for subscription upgrade
   */
  async createOrder(plan: 'BASIC' | 'PREMIUM', months: number = 1): Promise<CreateOrderResponse> {
    const response = await apiClient.post('/subscription/create-order', { plan, months });
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
  },

  /**
   * Sync organization plan with user plan (fix for existing users)
   */
  async syncOrganizationPlan(): Promise<{
    success: boolean;
    message: string;
    userPlan?: string;
    organizationPlan?: string;
    previousOrgPlan?: string;
  }> {
    const response = await apiClient.post('/subscription/sync-organization-plan');
    return response.data;
  }
};
