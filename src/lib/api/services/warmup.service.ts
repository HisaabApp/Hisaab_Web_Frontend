/**
 * Warmup Service
 * Keeps the Render backend active by pinging it
 * Prevents free-tier backend from sleeping
 */

import apiClient from '../client';

export const warmupService = {
  /**
   * Wake up the backend by making a simple health check request
   * Call this on public pages (landing, login, register) to keep backend warm
   */
  async keepBackendWarm(): Promise<boolean> {
    try {
      // Make a simple request to the health endpoint (lightweight)
      // If no specific health endpoint exists, use auth/status
      const response = await apiClient.get('/auth/status', {
        timeout: 5000 // Short timeout so it doesn't block page load
      }).catch(() => {
        // If auth endpoint fails, try a simpler ping
        return apiClient.get('/').catch(() => ({ data: {} }));
      });
      
      return !!response;
    } catch (error) {
      // Silently fail - don't block user experience if backend is truly down
      console.debug('Backend warmup attempt made');
      return false;
    }
  },

  /**
   * Periodically ping backend to keep it warm (for active sessions)
   * Start on login page/landing page and continue after auth
   */
  startBackendKeepalive(intervalMs: number = 5 * 60 * 1000) { // Default: every 5 minutes
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Initial warmup on page load
    this.keepBackendWarm();

    // Set interval for periodic pings
    const intervalId = setInterval(() => {
      this.keepBackendWarm();
    }, intervalMs);

    return intervalId;
  },

  /**
   * Stop the keepalive interval
   */
  stopBackendKeepalive(intervalId: number) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
};
