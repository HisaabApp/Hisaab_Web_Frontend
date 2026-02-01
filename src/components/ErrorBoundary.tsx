/**
 * Error Boundary Component
 * Catches and displays React errors gracefully
 * Handles chunk loading errors with automatic retry
 */

"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isRetrying: boolean;
  retryCount: number;
}

// Check if error is a chunk loading error
const isChunkLoadError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return (
    message.includes('failed to load chunk') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('load failed')
  );
};

// Clear Next.js cache and stale chunks
const clearCacheAndReload = (): void => {
  // Clear service worker cache
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  
  // Force reload without cache
  window.location.reload();
};

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      isRetrying: false,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught error:', error, errorInfo);
    
    // Auto-retry for chunk loading errors
    if (isChunkLoadError(error) && this.state.retryCount < this.maxRetries) {
      this.handleAutoRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleAutoRetry = () => {
    this.setState({ isRetrying: true });
    
    // Wait a moment then reload
    this.retryTimeout = setTimeout(() => {
      this.setState(
        (prevState) => ({ 
          retryCount: prevState.retryCount + 1 
        }),
        () => {
          // If we've exhausted retries, just show the error
          if (this.state.retryCount >= this.maxRetries) {
            this.setState({ isRetrying: false });
          } else {
            clearCacheAndReload();
          }
        }
      );
    }, 1500);
  };

  handleManualRetry = () => {
    this.setState({ isRetrying: true });
    clearCacheAndReload();
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      isRetrying: false,
      retryCount: 0 
    });
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error && isChunkLoadError(this.state.error);
      
      // Show loading state during retry
      if (this.state.isRetrying) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading fresh content...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle>
                  {isChunkError ? 'Loading Error' : 'Something went wrong'}
                </CardTitle>
              </div>
              <CardDescription>
                {isChunkError 
                  ? 'The page failed to load. This usually happens after an update. Please refresh to get the latest version.'
                  : 'An unexpected error occurred. Please try refreshing the page.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && !isChunkError && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm font-mono text-muted-foreground break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button
                onClick={this.handleManualRetry}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Global chunk error handler
 * Call this in your app layout to handle unhandled chunk loading errors
 */
export function setupChunkErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections (often from dynamic imports)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && isChunkLoadError(error)) {
      event.preventDefault();
      console.warn('Chunk load error detected, reloading...', error.message);
      
      // Store reload attempt to prevent infinite loops
      const reloadKey = 'chunk_reload_attempt';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
      }
    }
  });

  // Handle script loading errors
  window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'SCRIPT') {
      console.warn('Script load error, may need reload:', target);
    }
  }, true);
}
