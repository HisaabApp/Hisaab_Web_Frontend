import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About HisaabApp - Our Story & Mission',
  description: 'Learn about HisaabApp - helping small and medium businesses manage their billing, customers, and payments effortlessly.',
  openGraph: {
    title: 'About HisaabApp',
    description: 'Learn about our mission to simplify business management for SMBs',
    type: 'website',
    url: 'https://hisaabapp.in/about',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
