import apiClient from '../client';
import axios from 'axios';

interface BulkNotificationRequest {
  customerIds?: string[];
  sendToAll?: boolean;
  method: 'sms' | 'whatsapp';
}

interface BulkNotificationResult {
  success: boolean;
  message: string;
  sent?: number;
  failed?: number;
  errors?: Array<{ customerId: string; error: string }>;
}

export const notificationsService = {
  /**
   * Send payment notification to a single customer
   */
  async sendPaymentNotification(
    expenseId: string,
    method: 'sms' | 'whatsapp' = 'sms'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/notifications/payment', {
        expenseId,
        method
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        // Handle quota exceeded (403)
        if (status === 403 && data?.error === 'Message quota exceeded') {
          const limit = data.limit || 10;
          const plan = data.plan || 'FREE';
          const planName = plan === 'FREE' ? 'Free' : plan === 'PRO' ? 'Pro' : plan === 'BUSINESS' ? 'Business' : plan;
          throw new Error(`📱 Message Limit Reached! You've used all ${limit} messages on your ${planName} plan. Upgrade to send more.`);
        }
        
        // Handle payment disabled error (400)
        if (status === 400) {
          if (data?.action) {
            throw new Error(`${data.error} ${data.action}`);
          }
          throw new Error(data?.error || 'Failed to send notification');
        }
        
        // Other errors
        throw new Error(data?.error || data?.message || `Request failed with status ${status}`);
      }
      throw error;
    }
  },

  /**
   * Send bulk notifications to multiple customers
   */
  async sendBulkNotifications(
    data: BulkNotificationRequest
  ): Promise<BulkNotificationResult> {
    try {
      const response = await apiClient.post('/notifications/bulk', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        // Handle quota exceeded (403)
        if (status === 403 && data?.error === 'Message quota exceeded') {
          const limit = data.limit || 10;
          const plan = data.plan || 'FREE';
          const planName = plan === 'FREE' ? 'Free' : plan === 'PRO' ? 'Pro' : plan === 'BUSINESS' ? 'Business' : plan;
          throw new Error(`📱 Message Limit Reached! You've used all ${limit} messages on your ${planName} plan. Upgrade to send more.`);
        }
        
        throw new Error(data?.error || data?.message || `Request failed with status ${status}`);
      }
      throw error;
    }
  }
};
