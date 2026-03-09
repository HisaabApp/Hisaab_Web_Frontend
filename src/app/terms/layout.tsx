import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - HisaabApp',
  description: 'Read HisaabApp terms of service and conditions of use.',
  openGraph: {
    title: 'Terms of Service',
    description: 'HisaabApp terms of service',
    type: 'website',
    url: 'https://hisaabapp.vercel.app/terms',
  },
  robots: {
    index: false,
    follow: true,
  }
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
