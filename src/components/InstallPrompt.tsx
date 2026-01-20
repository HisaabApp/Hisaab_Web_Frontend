"use client";

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Don't show for 7 days after dismissal
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Install HisaabApp</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add to your home screen for quick access & offline support
              </p>
              
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall} className="flex-1">
                  <Download className="mr-1 h-3 w-3" />
                  Install
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Later
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Separate component for iOS instructions
export function IOSInstallInstructions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('ios-install-dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShow(true), 5000);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('ios-install-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Install HisaabApp</h3>
              <p className="text-xs text-muted-foreground mb-2">
                To install on your iPhone:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 mb-3">
                <li>1. Tap the <span className="font-medium">Share</span> button</li>
                <li>2. Select <span className="font-medium">"Add to Home Screen"</span></li>
              </ol>
              
              <Button size="sm" variant="outline" onClick={handleDismiss} className="w-full">
                Got it
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
