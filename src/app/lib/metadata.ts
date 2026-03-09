import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HisaabApp - Business Billing & Customer Management',
  description: 'Complete billing and customer management solution for dairy vendors, tuition centers & subscription services. Track payments, send reminders via SMS & WhatsApp. 14-day free trial.',
  keywords: [
    'business management',
    'billing software',
    'customer management',
    'invoice generator',
    'payment tracking',
    'SMS reminders',
    'WhatsApp notifications',
    'dairy management',
    'expense tracking',
    'business analytics'
  ],
  openGraph: {
    title: 'HisaabApp - Complete Business Billing Solution',
    description: 'Easy billing & customer management for any business. 14-day free trial, no credit card required.',
    type: 'website',
    url: 'https://hisaabapp.in',
    images: [
      {
        url: 'https://hisaabapp.in/icons/icon-512x512.png',
        width: 512,
        height: 512,
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HisaabApp - Business Billing & Customer Management',
    description: 'Easy billing & customer management for any business. 14-day free trial.',
  },
  alternates: {
    canonical: 'https://hisaabapp.in'
  }
}
