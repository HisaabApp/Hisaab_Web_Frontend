'use client';

import { useEffect } from 'react';

/**
 * Suppresses the Google OAuth warning about multiple initializations
 * This component should be placed early in the component tree
 */
export function SuppressGoogleWarning() {
  useEffect(() => {
    // Store original console.warn
    const originalWarn = console.warn;

    // Override console.warn to filter out the Google OAuth warning
    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      // Suppress only the specific Google OAuth initialization warning
      if (message.includes('google.accounts.id.initialize()') || 
          message.includes('GSI_LOGGER')) {
        return; // Silently suppress this specific warning
      }
      // Call original console.warn for all other warnings
      originalWarn.apply(console, args);
    };

    // Cleanup
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
