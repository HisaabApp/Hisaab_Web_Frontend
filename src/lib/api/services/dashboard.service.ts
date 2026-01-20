/**
 * Dashboard Service
 * All dashboard and analytics API calls
 */

import apiClient, { handleApiError } from '../client';
import {
  ApiResponse,
  DashboardSummary,
  MonthlySummary,
  YearlySummary,
  PaymentStats,
  ExpenseWithCustomer,
} from '../types';

class DashboardService {
  /**
   * Get dashboard summary (overview stats)
   */
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get monthly summary for specific month/year
   */
  async getMonthlySummary(year: number, month: number): Promise<ApiResponse<MonthlySummary>> {
    try {
      const response = await apiClient.get<ApiResponse<MonthlySummary>>(
        `/dashboard/monthly/${year}/${month}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get yearly summary for specific year
   */
  async getYearlySummary(year: number): Promise<ApiResponse<YearlySummary>> {
    try {
      const response = await apiClient.get<ApiResponse<YearlySummary>>(
        `/dashboard/yearly/${year}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 10): Promise<ApiResponse<ExpenseWithCustomer[]>> {
    try {
      const response = await apiClient.get<ApiResponse<ExpenseWithCustomer[]>>(
        '/dashboard/recent',
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<ApiResponse<PaymentStats>> {
    try {
      const response = await apiClient.get<ApiResponse<PaymentStats>>('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
