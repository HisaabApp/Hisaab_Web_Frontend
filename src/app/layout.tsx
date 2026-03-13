import type { Metadata, Viewport } from 'next';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
  title: 'HisaabApp - Business Billing & Customer Management',
  description: 'Smart billing solution for dairy vendors, tuition centers & subscription services. Manage customers, send SMS & WhatsApp reminders.',

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
  keywords: ['business', 'expense', 'tracking', 'billing', 'payment', 'dairy', 'invoicing', 'customer management', 'SMS reminders', 'WhatsApp'],
  authors: [{ name: 'HisaabApp Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://hisaabapp.in',
    title: 'HisaabApp - Business Billing & Customer Management',
    description: 'Complete billing and customer management solution. Track payments, send automated reminders via SMS & WhatsApp.',
    siteName: 'HisaabApp',
    images: [
      {
        url: 'https://hisaabapp.in/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'HisaabApp Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HisaabApp - Business Billing & Customer Management',
    description: 'Complete billing and customer management solution',
    images: ['https://hisaabapp.in/icons/icon-512x512.png'],
  },
  alternates: {
    canonical: 'https://hisaabapp.in',
  },
};

export const viewport: Viewport = {
  themeColor: '#A7D1AB',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 10,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Log warning if Google Client ID is not configured
  if (!googleClientId && typeof window !== 'undefined') {
    console.warn('⚠️ Google OAuth not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local for Google Sign-in/Sign-up.');
  }

  const appContent = (
    <ServiceWorkerRegistration />
  );

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
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
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
          </GoogleOAuthProvider>
        ) : (
          <>
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
          </>
        )}
      </body>
    </html>
  );
}
