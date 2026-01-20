/**
 * Analytics API Service
 * API calls for message analytics
 */

import apiClient, { handleApiError } from '../client';
import { ApiResponse } from '../types';

export interface MessageStats {
  totalMessages: number;
  smsCount: number;
  whatsappCount: number;
  successCount: number;
  failedCount: number;
  totalCost: number;
}

export interface DailyMessageCount {
  date: string;
  count: number;
  sms: number;
  whatsapp: number;
}

export interface MessageLog {
  id: string;
  customerName: string;
  phoneNumber: string;
  messageType: string;
  purpose: string;
  status: string;
  amount?: number;
  createdAt: string;
}

export interface MessageBreakdown {
  purpose: string;
  count: number;
}

export interface TopCustomer {
  customerName: string;
  phoneNumber: string;
  messageCount: number;
}

class AnalyticsService {
  /**
   * Get message statistics
   */
  async getMessageStats(): Promise<ApiResponse<MessageStats>> {
    try {
      const response = await apiClient.get<ApiResponse<MessageStats>>('/analytics/stats');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get daily message count
   */
  async getDailyMessageCount(days: number = 30): Promise<ApiResponse<DailyMessageCount[]>> {
    try {
      const response = await apiClient.get<ApiResponse<DailyMessageCount[]>>(
        `/analytics/daily?days=${days}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(limit: number = 50): Promise<ApiResponse<MessageLog[]>> {
    try {
      const response = await apiClient.get<ApiResponse<MessageLog[]>>(
        `/analytics/recent?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get message breakdown by purpose
   */
  async getMessageBreakdownByPurpose(): Promise<ApiResponse<MessageBreakdown[]>> {
    try {
      const response = await apiClient.get<ApiResponse<MessageBreakdown[]>>(
        '/analytics/breakdown/purpose'
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get top customers by message count
   */
  async getTopCustomers(limit: number = 10): Promise<ApiResponse<TopCustomer[]>> {
    try {
      const response = await apiClient.get<ApiResponse<TopCustomer[]>>(
        `/analytics/top-customers?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
