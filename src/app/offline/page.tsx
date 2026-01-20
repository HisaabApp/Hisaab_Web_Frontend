"use client";

import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
          
          <p className="text-muted-foreground mb-6">
            It looks like you've lost your internet connection. 
            Don't worry, you can still view cached data.
          </p>

          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">💡 Tips while offline:</h3>
            <ul className="text-sm text-muted-foreground text-left space-y-1">
              <li>• Previously visited pages are still available</li>
              <li>• New changes will sync when you're back online</li>
              <li>• Check your WiFi or mobile data connection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
