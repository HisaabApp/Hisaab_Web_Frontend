/**
 * Chunk Error Handler Component
 * Handles chunk loading errors that occur outside of React's error boundary
 * (e.g., during dynamic imports before component renders)
 */

"use client";

import { useEffect } from 'react';

// Check if error is a chunk loading error
const isChunkLoadError = (error: unknown): boolean => {
  if (!error) return false;
  
  const message = error instanceof Error 
    ? error.message.toLowerCase() 
    : String(error).toLowerCase();
    
  return (
    message.includes('failed to load chunk') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('failed to fetch dynamically') ||
    message.includes('network error') ||
    message.includes('load failed') ||
    message.includes('chunkloaderror')
  );
};

// Clear caches and force reload
const forceReload = (): void => {
  if (typeof window === 'undefined') return;
  
  const doReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };
  
  // Clear service worker cache
  if ('caches' in window) {
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name)));
    }).finally(doReload);
  } else {
    doReload();
  }
};

// Prevent reload loops
const shouldReload = (): boolean => {
  const reloadKey = 'chunk_reload_attempt';
  const reloadCountKey = 'chunk_reload_count';
  const lastReload = sessionStorage.getItem(reloadKey);
  const reloadCount = parseInt(sessionStorage.getItem(reloadCountKey) || '0', 10);
  const now = Date.now();
  
  // Reset count if last reload was more than 30 seconds ago
  if (!lastReload || now - parseInt(lastReload, 10) > 30000) {
    sessionStorage.setItem(reloadKey, now.toString());
    sessionStorage.setItem(reloadCountKey, '1');
    return true;
  }
  
  // Don't reload more than 3 times in 30 seconds
  if (reloadCount >= 3) {
    console.warn('Chunk load error: Max reload attempts reached');
    return false;
  }
  
  sessionStorage.setItem(reloadKey, now.toString());
  sessionStorage.setItem(reloadCountKey, (reloadCount + 1).toString());
  return true;
};

export function ChunkErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections (dynamic imports)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (isChunkLoadError(error)) {
        event.preventDefault();
        console.warn('Chunk load error detected:', error?.message || error);
        
        if (shouldReload()) {
          console.log('Attempting reload to recover from chunk error...');
          forceReload();
        }
      }
    };

    // Handle script loading errors
    const handleError = (event: ErrorEvent) => {
      const target = event.target as HTMLElement | null;
      
      // Check if it's a script loading error
      if (target?.tagName === 'SCRIPT' || target?.tagName === 'LINK') {
        console.warn('Resource load error detected:', event.message || 'Unknown error');
        
        // Check if error message indicates chunk loading failure
        if (event.message && isChunkLoadError(new Error(event.message))) {
          if (shouldReload()) {
            console.log('Attempting reload to recover from resource error...');
            forceReload();
          }
        }
      }
    };

    // Add listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError, true);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return null; // This component doesn't render anything
}

export default ChunkErrorHandler;
