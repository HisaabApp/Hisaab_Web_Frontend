import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy - HisaabApp',
  description: 'HisaabApp refund policy. Learn about our money-back guarantee and refund process.',
  openGraph: {
    title: 'Refund Policy',
    description: 'HisaabApp refund policy and money-back guarantee',
    type: 'website',
    url: 'https://hisaabapp.in/refund',
  },
  robots: {
    index: false,
    follow: true,
  }
}

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
