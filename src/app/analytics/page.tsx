"use client";

import { useEffect, useState } from 'react';
import { analyticsService, MessageStats, DailyMessageCount, MessageLog, MessageBreakdown, TopCustomer } from '@/lib/api/services/analytics.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, CheckCircle2, XCircle, TrendingUp, Users, PieChart } from 'lucide-react';
import { format } from 'date-fns';

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
      const [statsRes, dailyRes, recentRes, breakdownRes, topRes] = await Promise.all([
        analyticsService.getMessageStats(),
        analyticsService.getDailyMessageCount(30),
        analyticsService.getRecentMessages(20),
        analyticsService.getMessageBreakdownByPurpose(),
        analyticsService.getTopCustomers(10),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (dailyRes.success && dailyRes.data) setDailyCount(dailyRes.data);
      if (recentRes.success && recentRes.data) setRecentMessages(recentRes.data);
      if (breakdownRes.success && breakdownRes.data) setBreakdown(breakdownRes.data);
      if (topRes.success && topRes.data) setTopCustomers(topRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
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
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Message Analytics</h1>
        <p className="text-muted-foreground">
          Track and analyze your SMS and WhatsApp message usage
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.smsCount || 0} SMS, {stats?.whatsappCount || 0} WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalMessages
                ? Math.round((stats.successCount / stats.totalMessages) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.successCount || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs.{stats?.totalCost.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <PieChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="recent">
            <MessageSquare className="h-4 w-4 mr-2" />
            Recent Messages
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Top Customers
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
                      <span className="text-sm">{format(new Date(day.date), 'MMM dd')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">SMS: {day.sms}</span>
                        <span className="text-xs text-muted-foreground">WA: {day.whatsapp}</span>
                        <Badge>{day.count}</Badge>
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
                      className="flex items-start justify-between border-b pb-3 last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{message.customerName}</p>
                        <p className="text-sm text-muted-foreground">{message.phoneNumber}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {message.messageType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {message.purpose.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={message.status === 'SUCCESS' ? 'default' : 'destructive'}>
                          {message.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                        </p>
                        {message.amount && (
                          <p className="text-sm font-medium">Rs.{message.amount.toFixed(2)}</p>
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
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.customerName}</p>
                          <p className="text-sm text-muted-foreground">{customer.phoneNumber}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{customer.messageCount} messages</Badge>
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
    </div>
  );
}
