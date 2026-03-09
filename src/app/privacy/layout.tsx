import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - HisaabApp',
  description: 'HisaabApp privacy policy. Learn how we protect your data and privacy.',
  openGraph: {
    title: 'Privacy Policy',
    description: 'HisaabApp privacy policy and data protection',
    type: 'website',
    url: 'https://hisaabapp.in/privacy',
  },
  robots: {
    index: false,
    follow: true,
  }
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
