import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { BranchProvider } from '@/contexts/BranchContext';
import { PlanLimitProvider } from '@/contexts/PlanLimitContext';
import { NotificationProvider } from '@/components/NotificationCenter';
import { OnlineStatusIndicator } from '@/components/SyncStatus';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChunkErrorHandler } from '@/components/ChunkErrorHandler';
import RouteChangeListener from '@/components/RouteChangeListener';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { InstallPrompt, IOSInstallInstructions } from '@/components/InstallPrompt';

export const metadata: Metadata = {
  title: 'HisaabApp',
  description: 'Manage your customers and their monthly expenses effortlessly. Simple billing & payment tracking for any business.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HisaabApp',
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: 'HisaabApp',
  keywords: ['business', 'expense', 'tracking', 'billing', 'payment', 'dairy'],
  authors: [{ name: 'HisaabApp Team' }],
};

export const viewport: Viewport = {
  themeColor: '#A7D1AB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        
        {/* PWA Meta Tags */}
        <link rel="icon" type="image/svg+xml" href="/icons/HisaabAApplogo.svg" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HisaabApp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#A7D1AB" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="font-body antialiased">
        <ServiceWorkerRegistration />
        <ChunkErrorHandler />
        <ErrorBoundary>
          <AuthProvider>
            <PlanLimitProvider>
              <AppProvider>
                <BranchProvider>
                  <NotificationProvider>
                    <RouteChangeListener />
                    <AppLayout>
                      {children}
                    </AppLayout>
                    <OnlineStatusIndicator />
                    <InstallPrompt />
                    <IOSInstallInstructions />
                    <Toaster />
                  </NotificationProvider>
                </BranchProvider>
              </AppProvider>
            </PlanLimitProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
