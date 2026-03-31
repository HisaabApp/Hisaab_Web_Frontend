"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import PendingInvitations from '@/components/PendingInvitations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  FileText, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Send,
  IndianRupee,
  Calendar,
  UserPlus,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { getYear, getMonth, subMonths, format, parseISO, differenceInDays, isToday, isYesterday } from 'date-fns';
import { motion } from 'framer-motion';

// Skeleton loader for dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome skeleton */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Activity skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { customers, expenses, isLoadingCustomers, isLoadingExpenses } = useAppContext();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent rendering if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Memoize date calculations to avoid recreating Date objects
  const { currentMonth, currentYear, lastMonth, lastMonthYear, lastMonthDate, greeting } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const lastMonthDate = subMonths(now, 1);
    return {
      currentMonth: getMonth(now) + 1,
      currentYear: getYear(now),
      lastMonth: getMonth(lastMonthDate) + 1,
      lastMonthYear: getYear(lastMonthDate),
      lastMonthDate,
      greeting: hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    };
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    
    // Outstanding calculation
    const totalOutstanding = expenses
      .filter(e => !e.paid)
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Customers with outstanding
    const customersWithOutstanding = new Set(
      expenses.filter(e => !e.paid).map(e => e.customerId)
    ).size;
    
    // This month collection
    const collectedThisMonth = expenses
      .filter(e => e.paid && e.year === currentYear && e.month === currentMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Last month collection
    const collectedLastMonth = expenses
      .filter(e => e.paid && e.year === lastMonthYear && e.month === lastMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    
    // This month billed
    const billedThisMonth = expenses
      .filter(e => e.year === currentYear && e.month === currentMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Collection trend (percentage change)
    const collectionTrend = collectedLastMonth > 0 
      ? ((collectedThisMonth - collectedLastMonth) / collectedLastMonth) * 100 
      : 0;
    
    // Collection progress (this month)
    const collectionProgress = billedThisMonth > 0 
      ? (collectedThisMonth / billedThisMonth) * 100 
      : 0;

    // New customers this month
    const newCustomersThisMonth = customers.filter(c => {
      const createdDate = parseISO(c.createdAt);
      return getMonth(createdDate) + 1 === currentMonth && getYear(createdDate) === currentYear;
    }).length;

    return {
      totalCustomers,
      totalOutstanding,
      customersWithOutstanding,
      collectedThisMonth,
      collectedLastMonth,
      billedThisMonth,
      collectionTrend,
      collectionProgress,
      newCustomersThisMonth,
    };
  }, [customers, expenses, currentMonth, currentYear, lastMonth, lastMonthYear]);

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'payment' | 'new_customer' | 'expense_added';
      title: string;
      description: string;
      time: string;
      icon: 'check' | 'user' | 'plus';
      color: string;
    }> = [];

    // Recent payments (paid expenses)
    expenses
      .filter(e => e.paid)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 5)
      .forEach(expense => {
        const customer = customers.find(c => c.id === expense.customerId);
        if (customer) {
          activities.push({
            id: `payment-${expense.id}`,
            type: 'payment',
            title: `Payment received`,
            description: `Rs. ${expense.amount.toFixed(0)} from ${customer.name}`,
            time: expense.lastUpdated,
            icon: 'check',
            color: 'text-green-600',
          });
        }
      });

    // New customers
    customers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .forEach(customer => {
        activities.push({
          id: `customer-${customer.id}`,
          type: 'new_customer',
          title: `New customer added`,
          description: customer.name,
          time: customer.createdAt,
          icon: 'user',
          color: 'text-blue-600',
        });
      });

    // Sort all activities by time and take top 5
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [customers, expenses]);

  // Customers needing attention (overdue)
  const customersNeedingAttention = useMemo(() => {
    const customerOutstanding = new Map<string, number>();
    
    expenses.filter(e => !e.paid).forEach(expense => {
      const current = customerOutstanding.get(expense.customerId) || 0;
      customerOutstanding.set(expense.customerId, current + expense.amount);
    });

    return customers
      .filter(c => customerOutstanding.has(c.id))
      .map(c => ({
        ...c,
        outstanding: customerOutstanding.get(c.id) || 0,
      }))
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 5);
  }, [customers, expenses]);

  // Top customers with outstanding - use memoized now date
  const topCustomers = useMemo(() => {
    const now = new Date();
    const customerOutstanding = new Map<string, number>();
    expenses
      .filter(e => !e.paid)
      .forEach(e => {
        const current = customerOutstanding.get(e.customerId) || 0;
        customerOutstanding.set(e.customerId, current + e.amount);
      });

    return customers
      .filter(c => customerOutstanding.has(c.id))
      .map(c => ({
        ...c,
        outstanding: customerOutstanding.get(c.id) || 0,
        daysSinceCreated: differenceInDays(now, parseISO(c.createdAt)),
      }))
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 5);
  }, [customers, expenses]);

  // Format relative time - memoize formatter
  const formatRelativeTime = useCallback((dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    const days = differenceInDays(now, date);
    if (days < 7) return `${days} days ago`;
    return format(date, 'MMM d');
  }, []);

  if (!mounted || isLoadingCustomers || isLoadingExpenses) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
    >
      {/* Pending Invitations Banner */}
      <PendingInvitations />
      
      {/* Welcome Banner */}
      <motion.div
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border"
        variants={{ hidden: { opacity: 0, y: -16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              {greeting}, {user?.name?.split(' ')[0] || 'there'}! 
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground mt-1">
              {stats.customersWithOutstanding > 0 ? (
                <>You have <span className="font-semibold text-orange-600">Rs. {stats.totalOutstanding.toFixed(0)}</span> outstanding from <span className="font-semibold">{stats.customersWithOutstanding}</span> customers</>
              ) : (
                <>All payments collected! Great job! 🎉</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/customers')} variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Customers
            </Button>
            <Button onClick={() => router.push('/customers/add')} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards - Clickable */
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
      >
        {/* Total Customers */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
          onClick={() => router.push('/customers')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <div className="flex items-center gap-2 mt-1">
              {stats.newCustomersThisMonth > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <UserPlus className="h-3 w-3 mr-1" />
                  +{stats.newCustomersThisMonth} this month
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Outstanding - Clickable to see unpaid */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:border-orange-500/50 border-orange-200 dark:border-orange-900"
          onClick={() => router.push('/reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              Rs. {stats.totalOutstanding.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats.customersWithOutstanding} customers
            </p>
          </CardContent>
        </Card>

        {/* This Month Collection */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:border-green-500/50"
          onClick={() => router.push('/reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected This Month</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              Rs. {stats.collectedThisMonth.toFixed(0)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {stats.collectionTrend !== 0 && (
                <span className={`text-xs flex items-center ${stats.collectionTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.collectionTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stats.collectionTrend).toFixed(0)}% vs last month
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last Month */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
          onClick={() => router.push('/reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Last Month</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {stats.collectedLastMonth.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(lastMonthDate, 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Collection Progress */
      {stats.billedThisMonth > 0 && (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">This Month's Collection Progress</CardTitle>
              <span className="text-sm font-semibold">{stats.collectionProgress.toFixed(0)}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={stats.collectionProgress} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Collected: Rs. {stats.collectedThisMonth.toFixed(0)}</span>
              <span>Pending: Rs. {(stats.billedThisMonth - stats.collectedThisMonth).toFixed(0)}</span>
              <span>Total: Rs. {stats.billedThisMonth.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* Two Column Layout */
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
      >
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your business</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.icon === 'check' ? 'bg-green-100 dark:bg-green-900' :
                      activity.icon === 'user' ? 'bg-blue-100 dark:bg-blue-900' :
                      'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {activity.icon === 'check' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {activity.icon === 'user' && <UserPlus className="h-4 w-4 text-blue-600" />}
                      {activity.icon === 'plus' && <PlusCircle className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(activity.time)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Add customers and expenses to see updates here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Follow-up Required
            </CardTitle>
            <CardDescription>Customers with outstanding payments</CardDescription>
          </CardHeader>
          <CardContent>
            {customersNeedingAttention.length > 0 ? (
              <div className="space-y-3">
                {customersNeedingAttention.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">Rs. {customer.outstanding.toFixed(0)}</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => router.push('/customers')}
                >
                  View All Customers
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="font-medium text-green-600">All caught up! 🎉</p>
                <p className="text-sm">No pending payments to follow up on</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => router.push('/customers/add')}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-xs">Add Customer</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => router.push('/customers')}
            >
              <Send className="h-5 w-5" />
              <span className="text-xs">Send Reminders</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => router.push('/reports')}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">View Reports</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => router.push('/analytics')}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  );
}
