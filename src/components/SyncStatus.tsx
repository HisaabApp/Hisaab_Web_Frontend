"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncIndicatorProps {
  status?: SyncStatus;
  lastSynced?: Date;
  onRetry?: () => void;
  className?: string;
}

export function SyncIndicator({ status = 'synced', lastSynced, onRetry, className }: SyncIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'offline':
        return <CloudOff className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'synced':
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Sync failed';
      case 'synced':
      default:
        return lastSynced ? `Synced ${formatTimeAgo(lastSynced)}` : 'Synced';
    }
  };

  const getColor = () => {
    switch (status) {
      case 'syncing':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'offline':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900';
      case 'synced':
      default:
        return 'text-green-600 bg-green-100 dark:bg-green-900';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={status === 'error' ? onRetry : undefined}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
              getColor(),
              status === 'error' && 'cursor-pointer hover:opacity-80',
              className
            )}
          >
            {getIcon()}
            <span className="hidden sm:inline">{getLabel()}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getLabel()}</p>
          {status === 'error' && <p className="text-xs">Click to retry</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Online/Offline status hook
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Online status indicator component
export function OnlineStatusIndicator() {
  const isOnline = useOnlineStatus();
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineWarning(true);
    } else {
      // Delay hiding to show "back online" message
      const timer = setTimeout(() => setShowOfflineWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOfflineWarning && isOnline) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4",
        isOnline 
          ? "bg-green-500 text-white" 
          : "bg-gray-800 text-white"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline</span>
        </>
      )}
    </div>
  );
}

// Session timeout warning component
interface SessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
  onExtend?: () => void;
}

export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout,
  onExtend,
}: SessionTimeoutProps = {}) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const resetTimer = useCallback(() => {
    setShowWarning(false);
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  useEffect(() => {
    const checkTimeout = () => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || Date.now().toString());
      const elapsed = (Date.now() - lastActivity) / 1000 / 60; // minutes
      
      if (elapsed >= timeoutMinutes) {
        onTimeout?.();
      } else if (elapsed >= timeoutMinutes - warningMinutes) {
        setShowWarning(true);
        setRemainingSeconds(Math.floor((timeoutMinutes - elapsed) * 60));
      } else {
        setShowWarning(false);
      }
    };

    // Set initial activity
    if (!localStorage.getItem('lastActivity')) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }

    const interval = setInterval(checkTimeout, 10000); // Check every 10 seconds
    checkTimeout();

    // Reset on user activity
    const handleActivity = () => resetTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [timeoutMinutes, warningMinutes, onTimeout, resetTimer]);

  const extendSession = useCallback(() => {
    resetTimer();
    onExtend?.();
  }, [resetTimer, onExtend]);

  return { showWarning, remainingSeconds, extendSession };
}

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default SyncIndicator;
