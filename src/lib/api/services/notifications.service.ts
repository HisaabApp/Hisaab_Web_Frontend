import apiClient from '../client';

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
    const response = await apiClient.post('/notifications/payment', {
      expenseId,
      method
    });
    return response.data;
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
