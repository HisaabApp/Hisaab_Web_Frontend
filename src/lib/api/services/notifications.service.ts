import apiClient from '../client';

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
  }
};
