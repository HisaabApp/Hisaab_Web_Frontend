import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/terms', '/privacy', '/refund', '/login', '/register'],
        disallow: [
          '/dashboard',
          '/customers',
          '/expenses',
          '/payments',
          '/settings',
          '/reports',
          '/analytics',
          '/subscription',
          '/verify-email',
          '/offline',
          '/api',
          '/.next'
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
    ],
    sitemap: 'https://hisaabapp.in/sitemap.xml',
  }
}
