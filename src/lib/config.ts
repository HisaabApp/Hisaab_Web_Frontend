/**
 * Application Configuration
 * Centralized configuration for environment variables and app settings
 */

const isDev = process.env.NODE_ENV === 'development';

export const config = {
  api: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'), // 10 seconds (was 30)
    debug: false, // Disabled - set to true only when debugging API issues
  },
  auth: {
    tokenKey: 'hisaabapp_auth_token',
    userKey: 'hisaabapp_user',
    tokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
  app: {
    name: 'HisaabApp',
    version: '2.0.0',
  },
} as const;

export default config;
