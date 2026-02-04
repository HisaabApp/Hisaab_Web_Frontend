"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Users, BarChart3, LineChart, CreditCard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show on dashboard and authenticated pages, not on landing/public pages
    const publicPages = ['/', '/login', '/register', '/terms', '/privacy', '/refund', '/about'];
    const isPublicPage = publicPages.includes(pathname);
    
    if (isPublicPage) {
      return;
    }

    // Check if user has seen the welcome message
    const hasSeenWelcome = localStorage.getItem('has_seen_welcome');
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }
  }, [pathname]);

  const handleDismiss = () => {
    localStorage.setItem('has_seen_welcome', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const features = [
    { icon: Users, label: 'Manage Customers', href: '/customers', description: 'Add & track customer records' },
    { icon: BarChart3, label: 'View Analytics', href: '/analytics', description: 'Business insights & trends' },
    { icon: LineChart, label: 'Generate Reports', href: '/reports', description: 'Download Excel reports' },
    { icon: CreditCard, label: 'Upgrade Plan', href: '/subscription', description: 'Unlock premium features' },
    { icon: Settings, label: 'Configure Settings', href: '/settings', description: 'Payment & notifications' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-emerald-500 animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleDismiss}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle className="text-3xl font-bold">Welcome to HisaabApp!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Your complete business management solution. We've created sample data to help you explore!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                onClick={handleDismiss}
                className="flex items-start gap-3 p-3 rounded-lg border hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <feature.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{feature.label}</div>
                  <div className="text-xs text-muted-foreground">{feature.description}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Getting Started Tips */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">✨ Quick Start Tips:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Check out the <strong>3 demo customers</strong> we've added</li>
              <li>• View <strong>sample transactions</strong> in Analytics</li>
              <li>• Try generating an <strong>Excel report</strong></li>
              <li>• Configure payment settings to send <strong>SMS notifications</strong></li>
            </ul>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleDismiss}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
          >
            Let's Get Started! 🚀
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
