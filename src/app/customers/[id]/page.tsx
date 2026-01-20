
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import type { Customer, ExpenseRecord } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, Edit, PlusCircle, Send, FileDown, Phone, MapPin, 
  Calendar, IndianRupee, CheckCircle2, XCircle, Clock, TrendingUp,
  MessageSquare, Receipt
} from 'lucide-react';
import ExpenseFormModal from './ExpenseFormModal';
import { format, getYear, parseISO, differenceInDays, isToday, isYesterday } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { downloadCustomerInvoice } from '@/lib/api/invoice';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
];

const getAvatarColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCustomerById, getExpensesForCustomer, updateExpense } = useAppContext();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerExpenses, setCustomerExpenses] = useState<ExpenseRecord[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [targetMonthYear, setTargetMonthYear] = useState<{ month: number, year: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (customerId) {
      const cust = getCustomerById(customerId);
      if (cust) {
        setCustomer(cust);
        setCustomerExpenses(getExpensesForCustomer(customerId));
      } else {
        router.push('/customers'); 
      }
    }
  }, [customerId, getCustomerById, getExpensesForCustomer, router]);

  const availableYears = useMemo(() => {
    if (!mounted) return [getYear(new Date())];
    const expenseYears = new Set(customerExpenses.map(e => e.year));
    const currentActionYear = getYear(new Date()); // Year for actions like adding new expense for current year
    expenseYears.add(currentActionYear); 
    
    // Ensure selectedYear is an option, especially if navigating or no expenses exist for it yet
    if (selectedYear && !expenseYears.has(selectedYear)) {
        expenseYears.add(selectedYear);
    }

    const sortedYears = Array.from(expenseYears).sort((a, b) => b - a);
    return sortedYears;
  }, [customerExpenses, mounted, selectedYear]);

  // Adjust selectedYear if it becomes invalid (e.g., after deleting all expenses for that year)
  useEffect(() => {
    if (mounted && availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || getYear(new Date()));
    }
  }, [availableYears, selectedYear, mounted]);


  const handleAddExpenseClick = (year: number, month: number) => {
    setEditingExpense(null);
    setTargetMonthYear({ year, month });
    setIsExpenseModalOpen(true);
  };

  const handleEditExpenseClick = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setTargetMonthYear(null); 
    setIsExpenseModalOpen(true);
  };

  const handleTogglePaidStatus = async (expense: ExpenseRecord) => {
    try {
      // Optimistically update UI first
      const newPaidStatus = !expense.paid;
      setCustomerExpenses(prev => 
        prev.map(e => e.id === expense.id ? { ...e, paid: newPaidStatus } : e)
      );
      
      // Then update the backend
      await updateExpense({ ...expense, paid: newPaidStatus });
      
      toast({ 
        title: "Payment Status Updated", 
        description: `Expense for ${format(new Date(expense.year, expense.month -1), 'MMMM yyyy')} marked as ${newPaidStatus ? 'paid' : 'unpaid'}.`
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      // Revert optimistic update on error
      setCustomerExpenses(prev => 
        prev.map(e => e.id === expense.id ? { ...e, paid: expense.paid } : e)
      );
      toast({ 
        title: "Error", 
        description: "Failed to update payment status. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleSendPaymentLink = async (expenseId: string) => {
    try {
      toast({ title: "Sending...", description: "Generating payment link" });
      
      // Import the service dynamically
      const { sendPaymentNotification, getPaymentLinks } = await import('@/lib/api/services/notification.service');
      
      // Get payment links
      const links = await getPaymentLinks(expenseId);
      
      if (customer?.phone) {
        // Send notification via SMS/WhatsApp
        await sendPaymentNotification({ expenseId, method: 'sms' });
        toast({ 
          title: "Payment Link Sent!", 
          description: `Payment notification sent to ${customer.name}` 
        });
      } else {
        // Just show the links
        const linkText = links.razorpayLink || links.upiLinks?.generic || 'No link available';
        toast({ 
          title: "Payment Link Generated", 
          description: linkText,
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Error sending payment link:', error);
      toast({ 
        title: "Error", 
        description: "Failed to send payment link. Check service configuration.", 
        variant: "destructive" 
      });
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      toast({ title: "Generating Invoice...", description: "Please wait" });
      await downloadCustomerInvoice(customerId);
      toast({ 
        title: "Invoice Downloaded!", 
        description: "PDF invoice has been downloaded successfully" 
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({ 
        title: "Error", 
        description: "Failed to download invoice", 
        variant: "destructive" 
      });
    }
  };

  const monthsForDisplay = Array.from({ length: 12 }).map((_, i) => {
    return { year: selectedYear, month: i + 1 };
  });

  // Calculate payment stats
  const paymentStats = useMemo(() => {
    const yearExpenses = customerExpenses.filter(e => e.year === selectedYear);
    const totalAmount = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paidAmount = yearExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    const paidCount = yearExpenses.filter(e => e.paid).length;
    const unpaidCount = yearExpenses.filter(e => !e.paid).length;
    const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    
    // Calculate all-time stats
    const allTimeTotal = customerExpenses.reduce((sum, e) => sum + e.amount, 0);
    const allTimePaid = customerExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    const allTimeOutstanding = allTimeTotal - allTimePaid;
    
    return { totalAmount, paidAmount, unpaidAmount, paidCount, unpaidCount, paymentProgress, allTimeOutstanding };
  }, [customerExpenses, selectedYear]);

  // Recent payment activity
  const recentActivity = useMemo(() => {
    return customerExpenses
      .filter(e => e.paid)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 5);
  }, [customerExpenses]);

  const formatRelativeTime = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    const days = differenceInDays(new Date(), date);
    if (days < 7) return `${days}d ago`;
    return format(date, 'MMM d');
  };

  if (!mounted || !customer) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." description="Please wait...">
          <Button variant="outline" onClick={() => router.push('/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </PageHeader>
        <CustomerDetailSkeleton />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <PageHeader title={customer.name} description="Customer details and payment history">
        <Button variant="outline" onClick={() => router.push('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </PageHeader>

      {/* Customer Profile Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-4">
              <Avatar className={`h-16 w-16 ${getAvatarColor(customer.id)}`}>
                <AvatarFallback className="text-white text-xl font-semibold">
                  {getInitials(customer.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <div className="flex items-center gap-4 text-muted-foreground mt-1">
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" /> {customer.phone}
                    </span>
                  )}
                  {customer.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Since {format(new Date(customer.createdAt), 'MMM yyyy')}
                    </span>
                  )}
                </div>
                {customer.address && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" /> {customer.address}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Button onClick={handleDownloadInvoice} variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" /> Invoice
              </Button>
              {customer.phone && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`tel:${customer.phone}`, '_self')}
                >
                  <Phone className="mr-2 h-4 w-4" /> Call
                </Button>
              )}
            </div>
          </div>

          {/* Outstanding Alert */}
          {paymentStats.allTimeOutstanding > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-700 dark:text-orange-300">
                    Total Outstanding: Rs. {paymentStats.allTimeOutstanding.toFixed(0)}
                  </span>
                </div>
                <Badge variant="outline" className="border-orange-400 text-orange-600">
                  {paymentStats.unpaidCount} unpaid month(s)
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">Rs. {paymentStats.totalAmount.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">{selectedYear} Billed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">Rs. {paymentStats.paidAmount.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">{paymentStats.paidCount} Paid</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">Rs. {paymentStats.unpaidAmount.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">{paymentStats.unpaidCount} Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{paymentStats.paymentProgress.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Collection Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Progress */}
      {paymentStats.totalAmount > 0 && (
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{selectedYear} Collection Progress</span>
            <span className="text-sm text-muted-foreground">
              Rs. {paymentStats.paidAmount.toFixed(0)} / Rs. {paymentStats.totalAmount.toFixed(0)}
            </span>
          </div>
          <Progress value={paymentStats.paymentProgress} className="h-3" />
        </Card>
      )}

      {/* Monthly Expenses Grid */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Monthly Records</CardTitle>
              <CardDescription>Click any month to add or edit expense</CardDescription>
            </div>
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthsForDisplay.map(({ year, month }, index) => {
              const expense = customerExpenses.find(e => e.year === year && e.month === month);
              const isPastMonth = new Date(year, month - 1) < new Date(new Date().getFullYear(), new Date().getMonth());
              const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth() + 1;
              
              return (
                <Card 
                  key={`${year}-${month}`}
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2 ${
                    expense?.paid 
                      ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' 
                      : expense 
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' 
                        : isCurrentMonth 
                          ? 'border-blue-300 border-dashed' 
                          : ''
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => expense ? handleEditExpenseClick(expense) : handleAddExpenseClick(year, month)}
                >
                  <CardContent className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{format(new Date(year, month - 1), 'MMM')}</span>
                      {expense?.paid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : expense ? (
                        <XCircle className="h-5 w-5 text-orange-600" />
                      ) : isCurrentMonth ? (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      ) : null}
                    </div>
                    
                    {expense ? (
                      <>
                        <p className="text-xl font-bold mb-1">Rs. {expense.amount.toFixed(0)}</p>
                        <Badge 
                          variant={expense.paid ? "default" : "secondary"}
                          className={expense.paid ? "bg-green-600" : "bg-orange-600 text-white"}
                        >
                          {expense.paid ? 'Paid' : 'Unpaid'}
                        </Badge>
                        
                        <div className="mt-3 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2"
                                onClick={() => handleTogglePaidStatus(expense)}
                              >
                                {expense.paid ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{expense.paid ? 'Mark Unpaid' : 'Mark Paid'}</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2"
                                onClick={() => handleEditExpenseClick(expense)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          
                          {!expense.paid && customer.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="h-8 px-2"
                                  onClick={() => handleSendPaymentLink(expense.id)}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Send Reminder</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <p className="text-sm text-muted-foreground mb-2">No record</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleAddExpenseClick(year, month)}
                        >
                          <PlusCircle className="mr-1 h-3 w-3" /> Add
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payment Activity */}
      {recentActivity.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{format(new Date(expense.year, expense.month - 1), 'MMMM yyyy')}</p>
                      <p className="text-xs text-muted-foreground">Paid {formatRelativeTime(expense.lastUpdated)}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">Rs. {expense.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onOpenChange={setIsExpenseModalOpen}
        customerId={customerId}
        expense={editingExpense}
        targetMonthYear={targetMonthYear}
        onSuccess={() => {
          setCustomerExpenses(getExpensesForCustomer(customerId));
        }} 
      />
    </TooltipProvider>
  );
}

