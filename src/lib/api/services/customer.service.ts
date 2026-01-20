/**
 * Customer Service
 * All customer-related API calls
 */

import apiClient, { handleApiError } from '../client';
import {
  ApiResponse,
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
} from '../types';

class CustomerService {
  /**
   * Get all customers for logged-in user
   */
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Customer[]>>('/customers');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get single customer by ID
   */
  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    try {
      const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<ApiResponse<Customer>> {
    try {
      const response = await apiClient.post<ApiResponse<Customer>>('/customers', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(id: string, data: UpdateCustomerData): Promise<ApiResponse<Customer>> {
    try {
      const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Bulk delete multiple customers
   */
  async bulkDeleteCustomers(customerIds: string[]): Promise<ApiResponse<{ deletedCount: number; deletedCustomers: string[] }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ deletedCount: number; deletedCustomers: string[] }>>('/customers/bulk-delete', { customerIds });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search customers by name or phone
   */
  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Customer[]>>('/customers/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const customerService = new CustomerService();
export default customerService;
