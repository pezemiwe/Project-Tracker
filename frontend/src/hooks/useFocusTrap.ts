import { useEffect, useRef } from 'react';

/**
 * Focus trap hook for modals and dialogs
 * Traps keyboard focus within a container element for accessibility
 *
 * @param isActive - Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(
        container.querySelectorAll<HTMLElement>(selector)
      ).filter((el) => {
        // Filter out elements with negative tabindex or hidden
        return (
          el.tabIndex !== -1 &&
          !el.hasAttribute('disabled') &&
          !el.getAttribute('aria-hidden')
        );
      });
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}
