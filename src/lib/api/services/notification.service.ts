import apiClient, { handleApiError } from '../client';
import axios from 'axios';

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

export interface QuotaExceededError {
  error: string;
  message: string;
  remaining: number;
  limit: number;
  plan: string;
}

/**
 * Check if error is quota exceeded
 */
export const isQuotaExceededError = (error: unknown): error is { response: { status: number; data: QuotaExceededError } } => {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return error.response.data?.error === 'Message quota exceeded';
  }
  return false;
};

/**
 * Send payment notification to customer
 */
export const sendPaymentNotification = async (data: PaymentNotificationData): Promise<{
  success: boolean;
  message: string;
  paymentLink?: string;
}> => {
  try {
    const response = await apiClient.post('/notifications/payment', data);
    return response.data;
  } catch (error) {
    // Check for quota exceeded
    if (isQuotaExceededError(error)) {
      const quotaData = error.response.data;
      throw new Error(`Message limit reached! You've used all ${quotaData.limit} messages on your ${quotaData.plan} plan. Upgrade to send more.`);
    }
    // Check for payment disabled error
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const action = error.response.data?.action;
      if (action) {
        throw new Error(`${error.response.data.error} ${action}`);
      }
    }
    throw new Error(handleApiError(error));
  }
};

/**
 * Send payment confirmation to customer
 */
export const sendPaymentConfirmation = async (data: PaymentConfirmationData): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await apiClient.post('/notifications/confirmation', data);
    return response.data;
  } catch (error) {
    // Check for quota exceeded
    if (isQuotaExceededError(error)) {
      const quotaData = error.response.data;
      throw new Error(`Message limit reached! You've used all ${quotaData.limit} messages on your ${quotaData.plan} plan. Upgrade to send more.`);
    }
    throw new Error(handleApiError(error));
  }
};

/**
 * Generate UPI QR code for payment
 */
export const generateQRCode = async (expenseId: string): Promise<QRCodeResponse> => {
  try {
    const response = await apiClient.post('/notifications/qr-code', { expenseId });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get all payment links for an expense
 */
export const getPaymentLinks = async (expenseId: string): Promise<PaymentLinksResponse> => {
  try {
    const response = await apiClient.get(`/notifications/payment-links/${expenseId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Check if notification and payment services are configured
 */
export const getServiceStatus = async (): Promise<ServiceStatusResponse> => {
  try {
    const response = await apiClient.get('/notifications/status');
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
