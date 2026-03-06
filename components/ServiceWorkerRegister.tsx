'use client';

import { useEffect } from 'react';

/**
 * Client component that registers the service worker.
 * Placed in root layout so it runs on every page.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for SW updates periodically
        registration.update();

        // Listen for new SW waiting to activate
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available — SW will activate on next reload
              console.info('[SW] New version available. Reload to update.');
            }
          });
        });
      })
      .catch((err) => {
        // Non-fatal — app works without SW
        console.warn('[SW] Registration failed:', err);
      });

    // Listen for sync trigger messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'TRIGGER_SYNC') {
        import('@/app/lib/inspection-sync').then(({ syncAllPending }) => {
          syncAllPending().catch(console.error);
        });
      }
    });
  }, []);

  return null;
}
