import { useCallback } from 'react';

/**
 * Hook for announcing messages to screen readers
 * Uses ARIA live regions to communicate state changes
 *
 * @returns announce function
 */
export function useAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Find or create announcer element
    let announcer = document.getElementById(`announcer-${priority}`);

    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = `announcer-${priority}`;
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }

    // Clear and set new message
    announcer.textContent = '';
    setTimeout(() => {
      announcer!.textContent = message;
    }, 100);

    // Clear after 5 seconds
    setTimeout(() => {
      announcer!.textContent = '';
    }, 5000);
  }, []);

  return { announce };
}
