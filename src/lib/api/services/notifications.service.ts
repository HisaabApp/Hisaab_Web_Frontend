import apiClient from '../client';

export interface BulkSendRequest {
  customerIds?: string[];
  sendToAll?: boolean;
  method?: 'sms' | 'whatsapp';
}

export interface BulkSendResult {
  success: boolean;
  message: string;
  results: {
    total: number;
    sent: number;
    failed: number;
    errors: Array<{
      customerId: string;
      customerName: string;
      error: string;
    }>;
  };
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
   * Send bulk payment notifications
   */
  async sendBulkNotifications(request: BulkSendRequest): Promise<BulkSendResult> {
    const response = await apiClient.post('/notifications/bulk', request);
    return response.data;
  }
};
