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
      // Handle payment disabled error with friendly message
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const data = error.response.data;
        if (data?.action) {
          throw new Error(`${data.error} ${data.action}`);
        }
        throw new Error(data?.error || 'Failed to send notification');
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
    const response = await apiClient.post('/notifications/bulk', data);
    return response.data;
  }
};
