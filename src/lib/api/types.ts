/**
 * API Response Types
 * Type definitions for all API responses matching backend structure
 */

import { Customer, ExpenseRecord } from '../types';

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  address?: string;
  logo?: string;
  // Subscription & Quota fields
  subscription?: 'FREE' | 'BASIC' | 'PREMIUM';
  messageLimit?: number;
  messagesUsed?: number;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  businessName?: string;
  address?: string;
  logo?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Customer Types (extends base Customer type)
export interface CustomerWithExpenses extends Customer {
  expenses?: ExpenseRecord[];
}

export interface CreateCustomerData {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerData extends CreateCustomerData {}

// Expense Types (extends base ExpenseRecord type)
export interface ExpenseWithCustomer extends ExpenseRecord {
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface CreateExpenseData {
  customerId: string;
  year: number;
  month: number;
  amount: number;
  paid?: boolean;
}

export interface UpdateExpenseData {
  year?: number;
  month?: number;
  amount?: number;
  paid?: boolean;
}

// Dashboard Types
export interface DashboardSummary {
  totalCustomers: number;
  totalOutstanding: number;
  collectedThisMonth: number;
  collectedLastMonth: number;
  currentMonth: number;
  currentYear: number;
  lastMonth: number;
  lastMonthYear: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  customerCount: number;
}

export interface YearlySummary {
  year: number;
  months: Array<{
    month: number;
    totalBilled: number;
    totalPaid: number;
    totalUnpaid: number;
  }>;
  yearTotal: {
    totalBilled: number;
    totalPaid: number;
    totalUnpaid: number;
  };
}

export interface PaymentStats {
  totalExpenses: number;
  paidExpenses: number;
  unpaidExpenses: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentRate: number;
}
