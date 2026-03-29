import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { ParentReauthScreen } from "../ParentReauthScreen.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("ParentReauthScreen", () => {
  it("renders 'Parent authentication required' heading", () => {
    render(
      <ParentReauthScreen
        onSuccess={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );
    expect(screen.getByRole("heading", { name: /Parent authentication required/i })).toBeInTheDocument();
  });

  it("renders NumPad", () => {
    render(
      <ParentReauthScreen
        onSuccess={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );
    expect(screen.getByRole("button", { name: "Digit 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Digit 0" })).toBeInTheDocument();
  });

  it("renders PinDots", () => {
    render(
      <ParentReauthScreen
        onSuccess={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );
    const dots = document.querySelectorAll("[data-filled]");
    expect(dots.length).toBeGreaterThan(0);
  });

  it("correct PIN calls onSuccess", async () => {
    vi.useFakeTimers();
    const onSuccess = vi.fn();
    render(
      <ParentReauthScreen
        onSuccess={onSuccess}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("wrong PIN shows error state", async () => {
    render(
      <ParentReauthScreen
        onSuccess={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText(/Wrong PIN/i)).toBeInTheDocument();
    });
  });

  it("does not call onSuccess on wrong PIN", async () => {
    const onSuccess = vi.fn();
    render(
      <ParentReauthScreen
        onSuccess={onSuccess}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText(/Wrong PIN/i)).toBeInTheDocument();
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
