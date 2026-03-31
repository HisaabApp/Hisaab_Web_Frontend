"use client";

import { useEffect, useState } from 'react';
import { analyticsService, MessageStats, DailyMessageCount, MessageLog, MessageBreakdown, TopCustomer } from '@/lib/api/services/analytics.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, CheckCircle2, XCircle, TrendingUp, Users, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import { Rupee } from '@/lib/currency';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [dailyCount, setDailyCount] = useState<DailyMessageCount[]>([]);
  const [recentMessages, setRecentMessages] = useState<MessageLog[]>([]);
  const [breakdown, setBreakdown] = useState<MessageBreakdown[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load data sequentially to avoid rate limiting (429 errors)
      // Instead of Promise.all which makes all requests at once
      const statsRes = await analyticsService.getMessageStats();
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      
      const dailyRes = await analyticsService.getDailyMessageCount(30);
      if (dailyRes.success && dailyRes.data) setDailyCount(dailyRes.data);
      
      const recentRes = await analyticsService.getRecentMessages(20);
      if (recentRes.success && recentRes.data) setRecentMessages(recentRes.data);
      
      const breakdownRes = await analyticsService.getMessageBreakdownByPurpose();
      if (breakdownRes.success && breakdownRes.data) setBreakdown(breakdownRes.data);
      
      const topRes = await analyticsService.getTopCustomers(10);
      if (topRes.success && topRes.data) setTopCustomers(topRes.data);
      
    } catch (error: any) {
      // Handle errors gracefully - show what we have
      console.error('Error loading analytics:', error);
      // Don't crash the page, just show partial data
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: -16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
      >
        <h1 className="text-xl md:text-3xl font-bold">Message Analytics</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Track and analyze your SMS and WhatsApp message usage
        </p>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
      >
        <Card className="p-3 md:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl md:text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground truncate">
              {stats?.smsCount || 0} SMS, {stats?.whatsappCount || 0} WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card className="p-3 md:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl md:text-2xl font-bold">
              {stats?.totalMessages
                ? Math.round((stats.successCount / stats.totalMessages) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.successCount || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card className="p-3 md:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600 hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl md:text-2xl font-bold">{stats?.failedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="p-3 md:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Est. Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl md:text-2xl font-bold"><Rupee amount={stats?.totalCost || 0} decimals={2} /></div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
      >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs md:text-sm">
            <PieChart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="text-xs md:text-sm">
            <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Recent Messages</span>
            <span className="sm:hidden">Recent</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs md:text-sm">
            <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Top Customers</span>
            <span className="sm:hidden">Top</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Message Breakdown by Purpose */}
            <Card>
              <CardHeader>
                <CardTitle>Message Breakdown</CardTitle>
                <CardDescription>Messages by purpose</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {breakdown.length > 0 ? (
                  breakdown.map((item) => (
                    <div key={item.purpose} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.purpose.replace(/_/g, ' ')}</p>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Daily Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Last 7 Days</CardTitle>
                <CardDescription>Daily message activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dailyCount.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-xs md:text-sm">{format(new Date(day.date), 'MMM dd')}</span>
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-xs text-muted-foreground">S:{day.sms}</span>
                        <span className="text-xs text-muted-foreground">W:{day.whatsapp}</span>
                        <Badge className="text-xs">{day.count}</Badge>
                      </div>
                    </div>
                  ))}
                  {dailyCount.length === 0 && (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Messages Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Last 20 messages sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMessages.length > 0 ? (
                  recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between border-b pb-3 last:border-0 gap-2"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate">{message.customerName}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{message.phoneNumber}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {message.messageType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {message.purpose.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                        <Badge variant={message.status === 'SUCCESS' ? 'default' : 'destructive'} className="text-xs">
                          {message.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                        </p>
                        {message.amount && (
                          <p className="text-xs md:text-sm font-medium"><Rupee amount={message.amount} /></p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No messages sent yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Customers by message count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCustomers.length > 0 ? (
                  topCustomers.map((customer, index) => (
                    <div
                      key={`${customer.customerName}-${customer.phoneNumber}`}
                      className="flex items-center justify-between border-b pb-3 last:border-0 gap-2"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs md:text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm md:text-base truncate">{customer.customerName}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{customer.phoneNumber}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">{customer.messageCount} msg</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>
    </motion.div>
  );
}
