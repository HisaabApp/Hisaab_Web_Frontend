import apiClient from '../client';

export interface PaymentNotificationData {
  expenseId: string;
  method?: 'sms' | 'whatsapp';
}

export interface PaymentConfirmationData {
  expenseId: string;
  paymentMethod?: string;
}

export interface PaymentLinksResponse {
  razorpayLink: string | null;
  upiLinks: {
    generic: string;
    googlePay: string;
    phonePe: string;
    paytm: string;
  } | null;
  upiId: string | null;
}

export interface ServiceStatusResponse {
  notificationConfigured: boolean;
  paymentConfigured: boolean;
  upiConfigured: boolean;
}

export interface QRCodeResponse {
  success: boolean;
  qrCode?: string;
  error?: string;
}

/**
 * Send payment notification to customer
 */
export const sendPaymentNotification = async (data: PaymentNotificationData): Promise<{
  success: boolean;
  message: string;
  paymentLink?: string;
}> => {
  const response = await apiClient.post('/notifications/payment', data);
  return response.data;
};

/**
 * Send payment confirmation to customer
 */
export const sendPaymentConfirmation = async (data: PaymentConfirmationData): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await apiClient.post('/notifications/confirmation', data);
  return response.data;
};

/**
 * Generate UPI QR code for payment
 */
export const generateQRCode = async (expenseId: string): Promise<QRCodeResponse> => {
  const response = await apiClient.post('/notifications/qr-code', { expenseId });
  return response.data;
};

/**
 * Get all payment links for an expense
 */
export const getPaymentLinks = async (expenseId: string): Promise<PaymentLinksResponse> => {
  const response = await apiClient.get(`/notifications/payment-links/${expenseId}`);
  return response.data;
};

/**
 * Check if notification and payment services are configured
 */
export const getServiceStatus = async (): Promise<ServiceStatusResponse> => {
  const response = await apiClient.get('/notifications/status');
  return response.data;
};
