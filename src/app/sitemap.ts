import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hisaabapp.vercel.app'
  const now = new Date().toISOString()

  return [
    // Public pages - high priority
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    // Auth pages - low priority
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'never',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'never',
      priority: 0.3,
    },
    // Protected app pages - not for indexing but included for completeness
    {
      url: `${baseUrl}/dashboard`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0,  // robots.txt disallows these anyway
    },
  ]
}
