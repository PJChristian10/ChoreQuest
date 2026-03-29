import { useEffect, useRef } from "react";

/**
 * Calls onTimeout after timeoutMs of inactivity.
 * Resets the countdown on click, touchstart, keydown, and mousemove.
 * Cleans up all listeners and the timeout on unmount.
 */
export function useInactivityTimer(timeoutMs: number, onTimeout: () => void): void {
  // Use a ref to hold the current timeout ID so event handlers always see
  // the latest value without needing to be in the dependency array.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a stable ref to onTimeout so we don't need it in effect deps
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    function reset(): void {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onTimeoutRef.current();
      }, timeoutMs);
    }

    const events = ["click", "touchstart", "keydown", "mousemove"] as const;

    // Start the initial timer
    reset();

    // Reset on user activity
    for (const event of events) {
      window.addEventListener(event, reset);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      for (const event of events) {
        window.removeEventListener(event, reset);
      }
    };
  }, [timeoutMs]);
}
