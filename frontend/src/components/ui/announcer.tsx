/**
 * Screen reader announcer component
 * Provides ARIA live regions for dynamic content updates
 *
 * Usage: Place in App.tsx root
 */
export function Announcer() {
  return (
    <>
      {/* Polite announcements - for non-critical updates */}
      <div
        id="announcer-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Assertive announcements - for critical updates */}
      <div
        id="announcer-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
