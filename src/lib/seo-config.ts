/**
 * SEO Configuration for HisaabApp
 */

export const seoConfig = {
  baseUrl: 'https://hisaabapp.vercel.app',
  siteName: 'HisaabApp',
  brandName: 'HisaabApp',
  
  defaults: {
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
  },
  
  socialLinks: {
    twitter: 'https://twitter.com/hisaabapp',
    facebook: 'https://facebook.com/hisaabapp',
    linkedin: 'https://linkedin.com/company/hisaabapp',
    instagram: 'https://instagram.com/hisaabapp',
  },
  
  pages: {
    home: {
      title: 'HisaabApp - Business Billing & Customer Management',
      description: 'Complete billing and customer management solution for any business. 14-day free trial, no credit card required.',
      path: '/',
    },
    about: {
      title: 'About HisaabApp - Our Story & Mission',
      description: 'Learn about HisaabApp - helping small and medium businesses manage their billing, customers, and payments effortlessly.',
      path: '/about',
    },
    terms: {
      title: 'Terms of Service - HisaabApp',
      description: 'Read HisaabApp terms of service and conditions of use.',
      path: '/terms',
      noindex: true,
    },
    privacy: {
      title: 'Privacy Policy - HisaabApp',
      description: 'HisaabApp privacy policy. Learn how we protect your data and privacy.',
      path: '/privacy',
      noindex: true,
    },
    refund: {
      title: 'Refund Policy - HisaabApp',
      description: 'HisaabApp refund policy. Learn about our money-back guarantee and refund process.',
      path: '/refund',
      noindex: true,
    },
  },
};

/**
 * Generate Open Graph meta tags
 */
export function getOpenGraphTags(page: keyof typeof seoConfig.pages) {
  const pageConfig = seoConfig.pages[page];
  return {
    'og:title': pageConfig.title,
    'og:description': pageConfig.description,
    'og:type': 'website',
    'og:url': `${seoConfig.baseUrl}${pageConfig.path}`,
    'og:site_name': seoConfig.siteName,
    'og:image': `${seoConfig.baseUrl}/icons/icon-512x512.png`,
    'og:image:width': '512',
    'og:image:height': '512',
  };
}

/**
 * Generate Twitter meta tags
 */
export function getTwitterTags(page: keyof typeof seoConfig.pages) {
  const pageConfig = seoConfig.pages[page];
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': pageConfig.title,
    'twitter:description': pageConfig.description,
    'twitter:image': `${seoConfig.baseUrl}/icons/icon-512x512.png`,
  };
}
