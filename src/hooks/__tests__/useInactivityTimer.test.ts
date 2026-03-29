// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInactivityTimer } from "../useInactivityTimer.js";

describe("useInactivityTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onTimeout after the specified duration", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimer(1000, onTimeout));
    vi.advanceTimersByTime(1000);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it("does not call onTimeout before the duration elapses", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimer(1000, onTimeout));
    vi.advanceTimersByTime(999);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("resets the timer on window click", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimer(1000, onTimeout));
    // Advance 800ms — not yet timed out
    vi.advanceTimersByTime(800);
    expect(onTimeout).not.toHaveBeenCalled();
    // User clicks — resets timer
    window.dispatchEvent(new Event("click"));
    // Advance 800ms more — still within the new 1000ms window
    vi.advanceTimersByTime(800);
    expect(onTimeout).not.toHaveBeenCalled();
    // Advance remaining 200ms — now 1000ms since last click
    vi.advanceTimersByTime(200);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it("cleans up timeout and listeners on unmount", () => {
    const onTimeout = vi.fn();
    const { unmount } = renderHook(() => useInactivityTimer(1000, onTimeout));
    unmount();
    vi.advanceTimersByTime(1000);
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
