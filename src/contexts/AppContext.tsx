/**
 * AppContext with Backend API Integration
 * Enterprise-grade data management with:
 * - API-based data fetching
 * - Loading states
 * - Error handling
 * - Optimistic updates
 * - Cache management
 */

"use client";

import type { Customer, ExpenseRecord, Theme } from "@/lib/types";
import useLocalStorage from "@/hooks/useLocalStorage";
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from "react";
import { formatISO } from 'date-fns';
import { customerService, expenseService } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  // Data
  customers: Customer[];
  expenses: ExpenseRecord[];
  
  // Loading states
  isLoadingCustomers: boolean;
  isLoadingExpenses: boolean;
  
  // Customer operations
  addCustomer: (customerData: Omit<Customer, "id" | "createdAt">) => Promise<Customer | null>;
  updateCustomer: (customerData: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<boolean>;
  getCustomerById: (id: string) => Customer | undefined;
  
  // Expense operations
  addExpense: (expenseData: Omit<ExpenseRecord, "id" | "dateAdded" | "lastUpdated">) => Promise<ExpenseRecord | null>;
  updateExpense: (expenseData: ExpenseRecord) => Promise<void>;
  deleteExpense: (id: string) => Promise<boolean>;
  toggleExpensePaid: (id: string) => Promise<void>;
  getExpensesForCustomer: (customerId: string) => ExpenseRecord[];
  getExpenseForCustomerByMonthYear: (customerId: string, year: number, month: number) => ExpenseRecord | undefined;
  
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Analytics
  getMonthlySummary: (year: number, month: number) => { totalBilled: number; totalPaid: number };
  getYearlySummary: (year: number) => Array<{ month: number; totalBilled: number; totalPaid: number }>;
  
  // Data refresh
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STABLE_INITIAL_THEME: Theme = "system";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [theme, setThemeState] = useLocalStorage<Theme>("hisaabapp_theme", STABLE_INITIAL_THEME);
  const [mounted, setMounted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme management
  useEffect(() => {
    if (mounted) {
      const root = window.document.documentElement;
      const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const applyCurrentTheme = () => {
        root.classList.remove("light", "dark");
        if (theme === "system") {
          root.classList.add(systemThemeQuery.matches ? "dark" : "light");
        } else {
          root.classList.add(theme);
        }
      };

      const handleSystemThemeChange = (event: MediaQueryListEvent) => {
        if (theme === "system") {
          root.classList.remove("light", "dark");
          root.classList.add(event.matches ? "dark" : "light");
        }
      };

      applyCurrentTheme();

      if (theme === "system") {
        systemThemeQuery.addEventListener('change', handleSystemThemeChange);
      }

      return () => {
        if (theme === "system") {
          systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
        }
      };
    }
  }, [theme, mounted]);

  // Fetch data on auth
  useEffect(() => {
    console.log('AppContext Auth Check:', { isAuthenticated, authLoading, dataLoaded });
    if (isAuthenticated && !authLoading && !dataLoaded) {
      console.log('AppContext: Fetching all data...');
      fetchAllData();
    }
  }, [isAuthenticated, authLoading, dataLoaded]);

  /**
   * Fetch all data from API
   */
  const fetchAllData = async () => {
    console.log('AppContext: Starting fetchAllData...');
    await Promise.all([fetchCustomers(), fetchExpenses()]);
    setDataLoaded(true);
    console.log('AppContext: Data loaded complete');
  };

  /**
   * Fetch customers from API
   */
  const fetchCustomers = async () => {
    if (!isAuthenticated) {
      console.log('fetchCustomers: Not authenticated, skipping');
      return;
    }
    
    try {
      setIsLoadingCustomers(true);
      console.log('fetchCustomers: Calling API...');
      const response = await customerService.getCustomers();
      console.log('fetchCustomers: Response:', response);
      if (response.success && response.data) {
        setCustomers(response.data);
        console.log('fetchCustomers: Set', response.data.length, 'customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  /**
   * Fetch expenses from API
   */
  const fetchExpenses = async () => {
    if (!isAuthenticated) {
      console.log('fetchExpenses: Not authenticated, skipping');
      return;
    }
    
    try {
      setIsLoadingExpenses(true);
      console.log('fetchExpenses: Calling API...');
      const response = await expenseService.getExpenses();
      console.log('fetchExpenses: Response:', response);
      if (response.success && response.data) {
        // Convert API response to local format
        const formattedExpenses: ExpenseRecord[] = response.data.map(exp => ({
          id: exp.id,
          customerId: exp.customerId,
          year: exp.year,
          month: exp.month,
          amount: exp.amount,
          paid: exp.paid,
          dateAdded: exp.createdAt,
          lastUpdated: exp.updatedAt,
        }));
        setExpenses(formattedExpenses);
        console.log('fetchExpenses: Set', formattedExpenses.length, 'expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    await fetchAllData();
  }, [isAuthenticated]);

  // Customer Operations

  const addCustomer = useCallback(async (customerData: Omit<Customer, "id" | "createdAt">): Promise<Customer | null> => {
    try {
      console.log('addCustomer: Creating customer...', customerData);
      const response = await customerService.createCustomer(customerData);
      console.log('addCustomer: Response:', response);
      if (response.success && response.data) {
        setCustomers(prev => {
          const updated = [...prev, response.data!];
          console.log('addCustomer: Updated customers count:', updated.length);
          return updated;
        });
        toast({
          title: "Success",
          description: "Customer added successfully",
        });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('addCustomer: Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to add customer';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updateCustomer = useCallback(async (customerData: Customer): Promise<void> => {
    try {
      const { id, createdAt, ...updateData } = customerData;
      const response = await customerService.updateCustomer(id, updateData);
      if (response.success && response.data) {
        setCustomers(prev => prev.map(c => c.id === id ? response.data! : c));
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update customer';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await customerService.deleteCustomer(id);
      if (response.success) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        setExpenses(prev => prev.filter(e => e.customerId !== id));
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        });
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete customer';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const getCustomerById = useCallback((id: string): Customer | undefined => {
    return customers.find((c) => c.id === id);
  }, [customers]);

  // Expense Operations

  const addExpense = useCallback(async (expenseData: Omit<ExpenseRecord, "id" | "dateAdded" | "lastUpdated">): Promise<ExpenseRecord | null> => {
    try {
      const createData = {
        customerId: expenseData.customerId,
        year: expenseData.year,
        month: expenseData.month,
        amount: expenseData.amount,
        paid: expenseData.paid,
      };
      
      const response = await expenseService.createExpense(createData);
      if (response.success && response.data) {
        const newExpense: ExpenseRecord = {
          id: response.data.id,
          customerId: response.data.customerId,
          year: response.data.year,
          month: response.data.month,
          amount: response.data.amount,
          paid: response.data.paid,
          dateAdded: response.data.createdAt,
          lastUpdated: response.data.updatedAt,
        };
        setExpenses(prev => [...prev, newExpense]);
        toast({
          title: "Success",
          description: "Expense added successfully",
        });
        return newExpense;
      }
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add expense';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updateExpense = useCallback(async (expenseData: ExpenseRecord): Promise<void> => {
    try {
      const { id, customerId, dateAdded, lastUpdated, ...updateData } = expenseData;
      const response = await expenseService.updateExpense(id, updateData);
      if (response.success && response.data) {
        const updatedExpense: ExpenseRecord = {
          id: response.data.id,
          customerId: response.data.customerId,
          year: response.data.year,
          month: response.data.month,
          amount: response.data.amount,
          paid: response.data.paid,
          dateAdded: response.data.createdAt,
          lastUpdated: response.data.updatedAt,
        };
        setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update expense';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await expenseService.deleteExpense(id);
      if (response.success) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        toast({
          title: "Success",
          description: "Expense deleted successfully",
        });
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete expense';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const toggleExpensePaid = useCallback(async (id: string): Promise<void> => {
    try {
      // Optimistic update
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, paid: !e.paid } : e));
      
      const response = await expenseService.togglePaidStatus(id);
      if (response.success && response.data) {
        // Update with server response
        const updatedExpense: ExpenseRecord = {
          id: response.data.id,
          customerId: response.data.customerId,
          year: response.data.year,
          month: response.data.month,
          amount: response.data.amount,
          paid: response.data.paid,
          dateAdded: response.data.createdAt,
          lastUpdated: response.data.updatedAt,
        };
        setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
      }
    } catch (error) {
      // Revert optimistic update on error
      await fetchExpenses();
      
      const message = error instanceof Error ? error.message : 'Failed to toggle payment status';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const getExpensesForCustomer = useCallback((customerId: string): ExpenseRecord[] => {
    return expenses
      .filter((e) => e.customerId === customerId)
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }, [expenses]);

  const getExpenseForCustomerByMonthYear = useCallback((customerId: string, year: number, month: number): ExpenseRecord | undefined => {
    return expenses.find(e => e.customerId === customerId && e.year === year && e.month === month);
  }, [expenses]);

  // Analytics

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, [setThemeState]);

  const getMonthlySummary = useCallback((year: number, month: number): { totalBilled: number; totalPaid: number } => {
    const monthlyExpenses = expenses.filter(e => e.year === year && e.month === month);
    const totalBilled = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = monthlyExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    return { totalBilled, totalPaid };
  }, [expenses]);

  const getYearlySummary = useCallback((year: number): Array<{ month: number; totalBilled: number; totalPaid: number }> => {
    const summary = [];
    for (let i = 1; i <= 12; i++) {
      summary.push({ month: i, ...getMonthlySummary(year, i) });
    }
    return summary;
  }, [getMonthlySummary]);

  const contextValue = useMemo(() => ({
    customers,
    expenses,
    isLoadingCustomers,
    isLoadingExpenses,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleExpensePaid,
    getExpensesForCustomer,
    getExpenseForCustomerByMonthYear,
    theme,
    setTheme,
    getMonthlySummary,
    getYearlySummary,
    refreshData,
  }), [
    customers,
    expenses,
    isLoadingCustomers,
    isLoadingExpenses,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleExpensePaid,
    getExpensesForCustomer,
    getExpenseForCustomerByMonthYear,
    theme,
    setTheme,
    getMonthlySummary,
    getYearlySummary,
    refreshData,
  ]);

  if (!mounted) {
    return null;
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
