/**
 * Expense Service
 * All expense-related API calls
 */

import apiClient, { handleApiError } from '../client';
import {
  ApiResponse,
  ExpenseWithCustomer,
  CreateExpenseData,
  UpdateExpenseData,
} from '../types';

class ExpenseService {
  /**
   * Get all expenses for logged-in user
   */
  async getExpenses(): Promise<ApiResponse<ExpenseWithCustomer[]>> {
    try {
      const response = await apiClient.get<ApiResponse<ExpenseWithCustomer[]>>('/expenses');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get expenses for specific customer
   */
  async getCustomerExpenses(customerId: string): Promise<ApiResponse<ExpenseWithCustomer[]>> {
    try {
      const response = await apiClient.get<ApiResponse<ExpenseWithCustomer[]>>(
        `/expenses/customer/${customerId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get single expense by ID
   */
  async getExpense(id: string): Promise<ApiResponse<ExpenseWithCustomer>> {
    try {
      const response = await apiClient.get<ApiResponse<ExpenseWithCustomer>>(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create new expense
   */
  async createExpense(data: CreateExpenseData): Promise<ApiResponse<ExpenseWithCustomer>> {
    try {
      const response = await apiClient.post<ApiResponse<ExpenseWithCustomer>>('/expenses', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update existing expense
   */
  async updateExpense(id: string, data: UpdateExpenseData): Promise<ApiResponse<ExpenseWithCustomer>> {
    try {
      const response = await apiClient.put<ApiResponse<ExpenseWithCustomer>>(`/expenses/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(id: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Toggle expense paid status
   */
  async togglePaidStatus(id: string): Promise<ApiResponse<ExpenseWithCustomer>> {
    try {
      const response = await apiClient.patch<ApiResponse<ExpenseWithCustomer>>(
        `/expenses/${id}/toggle-paid`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const expenseService = new ExpenseService();
export default expenseService;
