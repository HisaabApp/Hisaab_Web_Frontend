"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Bell, Check, X, MessageSquare, IndianRupee, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface AppNotification {
  id: string;
  type: 'payment' | 'reminder' | 'customer' | 'alert' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('app-notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('app-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

const getNotificationIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'payment': return <IndianRupee className="h-4 w-4 text-green-600" />;
    case 'reminder': return <Bell className="h-4 w-4 text-orange-600" />;
    case 'customer': return <UserPlus className="h-4 w-4 text-blue-600" />;
    case 'alert': return <AlertCircle className="h-4 w-4 text-red-600" />;
    default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
  }
};

const getNotificationColor = (type: AppNotification['type']) => {
  switch (type) {
    case 'payment': return 'bg-green-100 dark:bg-green-900';
    case 'reminder': return 'bg-orange-100 dark:bg-orange-900';
    case 'customer': return 'bg-blue-100 dark:bg-blue-900';
    case 'alert': return 'bg-red-100 dark:bg-red-900';
    default: return 'bg-gray-100 dark:bg-gray-800';
  }
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-in zoom-in"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllAsRead}>
                Mark all read
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={clearAll}>
                Clear
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                  !notification.read && "bg-muted/30"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", getNotificationColor(notification.type))}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-medium truncate", !notification.read && "font-semibold")}>
                        {notification.title}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 shrink-0 opacity-0 hover:opacity-100 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); clearNotification(notification.id); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
