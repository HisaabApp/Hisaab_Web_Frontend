
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, FileSpreadsheet, Loader2, TrendingUp, TrendingDown, 
  IndianRupee, Users, Calendar, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChartIcon, LineChartIcon
} from 'lucide-react';
import { getYear, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import type { Customer } from '@/lib/types';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { downloadExcelReport } from '@/lib/api/services/report.service';

const COLORS = ['#10b981', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

type DateRange = 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'all-time';

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardContent className="p-6"><Skeleton className="h-[300px]" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-[300px]" /></CardContent></Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { expenses, customers, getYearlySummary, isLoadingCustomers, isLoadingExpenses, refreshData } = useAppContext();
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const [dateRange, setDateRange] = useState<DateRange>('this-year');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Reports Debug:', { 
      mounted, 
      isLoadingCustomers, 
      isLoadingExpenses, 
      customersCount: customers.length, 
      expensesCount: expenses.length 
    });
  }, [mounted, isLoadingCustomers, isLoadingExpenses, customers.length, expenses.length]);

  const isLoading = !mounted || isLoadingCustomers || isLoadingExpenses;

  // Calculate date range bounds
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'last-3-months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'last-6-months':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'this-year':
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      case 'all-time':
      default:
        return { start: new Date(2020, 0, 1), end: now };
    }
  }, [dateRange]);

  // Filtered expenses based on date range
  const filteredExpenses = useMemo(() => {
    if (isLoading) return [];
    return expenses.filter(e => {
      const expenseDate = new Date(e.year, e.month - 1);
      return expenseDate >= dateRangeBounds.start && expenseDate <= dateRangeBounds.end;
    });
  }, [expenses, dateRangeBounds, isLoading]);

  const yearlyData = useMemo(() => {
    if (isLoading) return [];
    return getYearlySummary(selectedYear).map(item => ({
      month: format(new Date(selectedYear, item.month - 1), 'MMM'),
      Billed: item.totalBilled,
      Paid: item.totalPaid,
      Outstanding: item.totalBilled - item.totalPaid,
    }));
  }, [selectedYear, getYearlySummary, isLoading]);

  const customerBalances = useMemo(() => {
    if (isLoading) return [];
    return customers.map(customer => {
      const customerExpenses = expenses.filter(e => e.customerId === customer.id);
      const totalBilled = customerExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalPaid = customerExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
      return {
        id: customer.id,
        name: customer.name,
        totalBilled,
        totalPaid,
        outstanding: totalBilled - totalPaid,
      };
    }).filter(cb => cb.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [customers, expenses, isLoading]);
  
  const overallStats = useMemo(() => {
    if (isLoading) return { totalBilled: 0, totalPaid: 0, totalOutstanding: 0, activeCustomers: 0, collectionRate: 0 };
    const totalBilled = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = filteredExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
    return {
      totalBilled,
      totalPaid,
      totalOutstanding: totalBilled - totalPaid,
      activeCustomers: customers.length,
      collectionRate,
    };
  }, [filteredExpenses, customers, isLoading]);

  // Compare with previous period
  const trendData = useMemo(() => {
    if (isLoading) return { billedTrend: 0, paidTrend: 0, collectionTrend: 0 };
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthExpenses = expenses.filter(e => e.year === currentYear && e.month === currentMonth + 1);
    const lastMonthExpenses = expenses.filter(e => 
      (currentMonth === 0 ? e.year === currentYear - 1 && e.month === 12 : e.year === currentYear && e.month === currentMonth)
    );
    
    const thisMonthBilled = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthBilled = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const thisMonthPaid = thisMonthExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    const lastMonthPaid = lastMonthExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    
    const billedTrend = lastMonthBilled > 0 ? ((thisMonthBilled - lastMonthBilled) / lastMonthBilled) * 100 : 0;
    const paidTrend = lastMonthPaid > 0 ? ((thisMonthPaid - lastMonthPaid) / lastMonthPaid) * 100 : 0;
    
    return { billedTrend, paidTrend, collectionTrend: 0 };
  }, [expenses, isLoading]);

  const paymentStatusData = useMemo(() => {
    if (isLoading) return [];
    const paidAmount = overallStats.totalPaid;
    const outstandingAmount = overallStats.totalOutstanding;
    return [
      { name: 'Paid', value: paidAmount, color: '#10b981' },
      { name: 'Outstanding', value: outstandingAmount, color: '#f97316' },
    ].filter(item => item.value > 0);
  }, [overallStats, isLoading]);


  const availableYears = useMemo(() => {
    if (isLoading || expenses.length === 0) return [getYear(new Date())];
    const years = new Set(expenses.map(e => e.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses, isLoading]);
  
  useEffect(() => {
    if (!isLoading && availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear, isLoading]);

  // Download beautiful Excel report from backend
  const handleDownloadBeautifulReport = async () => {
    try {
      setIsDownloading(true);
      toast({ title: "Generating Report...", description: "Creating your beautiful Excel report with charts" });
      
      await downloadExcelReport();
      
      toast({ 
        title: "Report Downloaded!", 
        description: "Your comprehensive Excel report has been downloaded successfully" 
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({ 
        title: "Error", 
        description: "Failed to download report. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadBalances = () => {
    const dataToExport = customerBalances.map(cb => ({
      'Customer Name': cb.name,
      'Outstanding Amount (Rs)': cb.outstanding.toFixed(2),
    }));

    if (dataToExport.length === 0) {
      toast({ title: "No Data", description: "There are no outstanding balances to download." });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outstanding Balances");
    XLSX.writeFile(workbook, "customer_outstanding_balances.xlsx");
  };

  const handleDownloadMonthlyReport = () => {
    if (expenses.length === 0) {
      toast({ title: "No Data", description: "There are no expenses to generate a report." });
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      { 'Metric': 'Total Customers', 'Value': customers.length },
      { 'Metric': 'Total Billed (Rs)', 'Value': overallStats.totalBilled.toFixed(2) },
      { 'Metric': 'Total Paid (Rs)', 'Value': overallStats.totalPaid.toFixed(2) },
      { 'Metric': 'Total Outstanding (Rs)', 'Value': overallStats.totalOutstanding.toFixed(2) },
      { 'Metric': 'Report Generated', 'Value': format(new Date(), 'yyyy-MM-dd HH:mm') },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summaryWs, "Summary");

    // Customer-wise Monthly Report
    const monthlyReportData: any[] = [];
    
    customers.forEach(customer => {
      const customerExpenses = expenses
        .filter(e => e.customerId === customer.id)
        .sort((a, b) => a.year - b.year || a.month - b.month);
      
      if (customerExpenses.length > 0) {
        customerExpenses.forEach(expense => {
          monthlyReportData.push({
            'Customer Name': customer.name,
            'Phone': customer.phone || 'N/A',
            'Year': expense.year,
            'Month': format(new Date(expense.year, expense.month - 1), 'MMMM'),
            'Amount (Rs)': expense.amount.toFixed(2),
            'Status': expense.paid ? 'PAID' : 'UNPAID',
          });
        });
      }
    });

    const monthlyWs = XLSX.utils.json_to_sheet(monthlyReportData);
    
    // Set column widths
    monthlyWs['!cols'] = [
      { wch: 20 },  // Customer Name
      { wch: 15 },  // Phone
      { wch: 8 },   // Year
      { wch: 12 },  // Month
      { wch: 15 },  // Amount
      { wch: 10 },  // Status
    ];

    // Apply styling to headers
    const range = XLSX.utils.decode_range(monthlyWs['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!monthlyWs[address]) continue;
      monthlyWs[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center" }
      };
    }

    XLSX.utils.book_append_sheet(workbook, monthlyWs, "Monthly Records");

    // Year-wise Summary
    const yearlyReportData = availableYears.flatMap(year => {
      const yearSummary = getYearlySummary(year);
      return yearSummary.map(monthData => ({
        'Year': year,
        'Month': format(new Date(year, monthData.month - 1), 'MMMM'),
        'Total Billed (Rs)': monthData.totalBilled.toFixed(2),
        'Total Paid (Rs)': monthData.totalPaid.toFixed(2),
        'Total Outstanding (Rs)': (monthData.totalBilled - monthData.totalPaid).toFixed(2),
      }));
    });

    const yearlyWs = XLSX.utils.json_to_sheet(yearlyReportData);
    yearlyWs['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, yearlyWs, "Yearly Summary");

    // Customer Outstanding
    const outstandingData = customers.map(customer => {
      const customerExpenses = expenses.filter(e => e.customerId === customer.id);
      const totalBilled = customerExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalPaid = customerExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
      const outstanding = totalBilled - totalPaid;
      
      return {
        'Customer Name': customer.name,
        'Phone': customer.phone || 'N/A',
        'Address': customer.address || 'N/A',
        'Total Billed (Rs)': totalBilled.toFixed(2),
        'Total Paid (Rs)': totalPaid.toFixed(2),
        'Outstanding (Rs)': outstanding.toFixed(2),
        'Status': outstanding > 0 ? 'HAS DUES' : 'CLEAR',
      };
    }).sort((a, b) => parseFloat(b['Outstanding (Rs)']) - parseFloat(a['Outstanding (Rs)']));

    const outstandingWs = XLSX.utils.json_to_sheet(outstandingData);
    outstandingWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, outstandingWs, "Customer Outstanding");

    // Generate filename with date
    const filename = `HisaabApp_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    toast({ 
      title: "Report Downloaded", 
      description: `Complete report saved as ${filename}` 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PageHeader title="Reports" description="View financial summaries and key metrics." />
        <ReportsSkeleton />
      </div>
    );
  }

  // Show empty state if no data
  const hasNoData = customers.length === 0 && expenses.length === 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast({ title: "Data Refreshed", description: "Latest data has been loaded." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to refresh data", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {hasNoData && (
        <Card className="p-6 text-center border-dashed border-2">
          <div className="flex flex-col items-center gap-3">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Start by adding customers and recording their monthly expenses. 
              Your financial reports will appear here once you have data.
            </p>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => window.location.href = '/customers'}>
                <Users className="h-4 w-4 mr-2" />
                Add Customers
              </Button>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Refresh Data
              </Button>
            </div>
          </div>
        </Card>
      )}
      <PageHeader title="Reports" description="View financial summaries and key metrics.">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleDownloadBeautifulReport} 
            className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {isDownloading ? 'Generating...' : 'Download Report'}
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards with Trends */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-6">
        <Card className="p-3 md:p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Billed</p>
              <p className="text-lg md:text-2xl font-bold truncate">₹{overallStats.totalBilled.toFixed(0)}</p>
              {trendData.billedTrend !== 0 && (
                <div className={`flex items-center text-xs mt-1 ${trendData.billedTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trendData.billedTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="truncate">{Math.abs(trendData.billedTrend).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Collected</p>
              <p className="text-lg md:text-2xl font-bold text-green-600 truncate">₹{overallStats.totalPaid.toFixed(0)}</p>
              {trendData.paidTrend !== 0 && (
                <div className={`flex items-center text-xs mt-1 ${trendData.paidTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trendData.paidTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="truncate">{Math.abs(trendData.paidTrend).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Outstanding</p>
              <p className="text-lg md:text-2xl font-bold text-orange-600 truncate">₹{overallStats.totalOutstanding.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{customerBalances.length} customers</p>
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Collection Rate</p>
              <p className="text-lg md:text-2xl font-bold text-purple-600">{overallStats.collectionRate.toFixed(1)}%</p>
              <Progress value={overallStats.collectionRate} className="h-2 mt-2 w-full max-w-24" />
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base md:text-lg">Yearly Summary</CardTitle>
              <div className="flex items-center gap-2">
                <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="hidden sm:block">
                  <TabsList className="h-8">
                    <TabsTrigger value="bar" className="h-6 px-2"><BarChart3 className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="line" className="h-6 px-2"><LineChartIcon className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="area" className="h-6 px-2"><PieChartIcon className="h-4 w-4" /></TabsTrigger>
                  </TabsList>
                </Tabs>
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] md:h-[350px]">
            {yearlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `Rs. ${value.toFixed(0)}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Bar dataKey="Billed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `Rs. ${value.toFixed(0)}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Billed" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Paid" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              ) : (
                <AreaChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `Rs. ${value.toFixed(0)}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Billed" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" />
                  <Area type="monotone" dataKey="Paid" fill="#10b981" fillOpacity={0.3} stroke="#10b981" />
                </AreaChart>
              )}
            </ResponsiveContainer>
            ) : ( <p className="text-muted-foreground text-center pt-10">No data available for {selectedYear}.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Payment Distribution</CardTitle>
            <CardDescription className="text-xs md:text-sm">Paid vs outstanding breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] md:h-[350px]">
            {paymentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rs. ${value.toFixed(0)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            ) : ( <p className="text-muted-foreground text-center pt-10">No payment data available.</p>)}
            
            {/* Summary below chart */}
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Paid</span>
                </div>
                <p className="font-bold text-sm md:text-lg">₹{overallStats.totalPaid.toFixed(0)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                </div>
                <p className="font-bold text-sm md:text-lg">₹{overallStats.totalOutstanding.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-base md:text-lg">Outstanding Balances</CardTitle>
              <CardDescription className="text-xs md:text-sm">Customers with unpaid bills</CardDescription>
            </div>
            {customerBalances.length > 0 && (
              <Button onClick={handleDownloadBalances} variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {customerBalances.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Customer</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerBalances.map(cb => (
                  <TableRow key={cb.id}>
                    <TableCell className="text-xs md:text-sm py-2 md:py-3">{cb.name}</TableCell>
                    <TableCell className="text-right font-medium text-xs md:text-sm py-2 md:py-3">₹{cb.outstanding.toFixed(0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10 text-sm">No customers with outstanding balances. Great job!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
