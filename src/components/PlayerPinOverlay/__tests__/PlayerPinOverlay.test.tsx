import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { PlayerPinOverlay } from "../PlayerPinOverlay.js";
import { makePlayer } from "../../../test/fixtures.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Enter 4 wrong digits once (one attempt), then advance fake timers to reset. */
async function enterWrongPinOnce() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
    // Flush all microtasks/promises so verifyPin resolves
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  // Advance fake timers to clear the ERROR_RESET_MS timeout (600ms)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(700);
  });
}

/** Enter wrong PIN N times. Requires fake timers to be active. */
async function enterWrongPin(times: number) {
  for (let i = 0; i < times; i++) {
    await enterWrongPinOnce();
  }
}

describe("PlayerPinOverlay", () => {
  it("renders the player name", () => {
    const player = makePlayer({ name: "Alex" });
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("renders the cancel button", () => {
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );
    expect(screen.getByRole("button", { name: "Cancel PIN entry" })).toBeInTheDocument();
  });

  it("shows 'Enter your PIN' initially", () => {
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );
    expect(screen.getByText("Enter your PIN")).toBeInTheDocument();
  });

  it("cancel button calls onCancel", () => {
    const onCancel = vi.fn();
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={onCancel}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel PIN entry" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("entering 4 digits calls verifyPin", async () => {
    const verifyPin = vi.fn().mockResolvedValue(false);
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={verifyPin}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));

    await waitFor(() => {
      expect(verifyPin).toHaveBeenCalledWith("1234", player);
    });
  });

  it("correct PIN calls onSuccess after delay", async () => {
    vi.useFakeTimers();
    const onSuccess = vi.fn();
    const player = makePlayer({ id: "p1" });
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onSuccess).toHaveBeenCalledWith("p1");
  });

  it("wrong PIN shows 'Wrong PIN, try again'", async () => {
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 9" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Wrong PIN, try again")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Fix CRIT-01: Brute-force lockout
  // -------------------------------------------------------------------------

  it("after 5 wrong PINs, shows lockout message instead of numpad", async () => {
    vi.useFakeTimers();
    const player = makePlayer();
    const nowFn = vi.fn().mockReturnValue(Date.now());
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
        nowFn={nowFn}
      />
    );

    await enterWrongPin(5);

    expect(screen.queryByRole("dialog")).toHaveAttribute("aria-label", "PIN locked out");
  });

  it("lockout message includes a countdown (e.g. '5:00' or '4:59')", async () => {
    vi.useFakeTimers();
    const now = Date.now();
    const nowFn = vi.fn().mockReturnValue(now);
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
        nowFn={nowFn}
      />
    );

    await enterWrongPin(5);

    const countdown = screen.getByTestId("lockout-countdown");
    expect(countdown.textContent).toMatch(/^\d:\d{2}$|^\d{2}:\d{2}$/);
  });

  it("numpad is hidden (not rendered) during lockout", async () => {
    vi.useFakeTimers();
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
        nowFn={() => Date.now()}
      />
    );

    await enterWrongPin(5);

    expect(screen.queryByRole("button", { name: "Digit 1" })).not.toBeInTheDocument();
  });

  it("after lockout expires, numpad reappears and failedAttempts resets", async () => {
    vi.useFakeTimers();
    // Use a mutable time reference so the interval callback sees updated time
    const timeRef = { value: Date.now() };
    const nowFn = () => timeRef.value;

    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
        nowFn={nowFn}
      />
    );

    await enterWrongPin(5);

    // Verify we are locked out
    expect(screen.queryByRole("button", { name: "Digit 1" })).not.toBeInTheDocument();

    // Advance time by 5 minutes + 1 second so interval sees remaining <= 0
    timeRef.value += 5 * 60 * 1000 + 1000;
    await act(async () => {
      // Fire the interval ticks (1 tick is enough since remaining will be <= 0)
      await vi.advanceTimersByTimeAsync(1000);
    });

    // NumPad should be visible again
    expect(screen.getByRole("button", { name: "Digit 1" })).toBeInTheDocument();
  }, 15_000);

  it("failed attempt counter resets to 0 on correct PIN", async () => {
    vi.useFakeTimers();
    let callCount = 0;
    const verifyPin = vi.fn().mockImplementation(() => {
      callCount++;
      // First 4 calls wrong, 5th correct
      return Promise.resolve(callCount === 5);
    });
    const onSuccess = vi.fn();
    const player = makePlayer({ id: "p1" });
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
        verifyPin={verifyPin}
        nowFn={() => Date.now()}
      />
    );

    // Enter 4 wrong PINs
    await enterWrongPin(4);

    // Enter 1 correct PIN
    fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));

    await act(async () => { await vi.runAllTimersAsync(); });

    // Should have called onSuccess — no lockout occurred
    expect(onSuccess).toHaveBeenCalledWith("p1");
  });

  it("lockout does NOT trigger after 4 failed attempts (only at 5)", async () => {
    vi.useFakeTimers();
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(false)}
        nowFn={() => Date.now()}
      />
    );

    await enterWrongPin(4);

    // After 4 wrong PINs, NO lockout — numpad still visible
    expect(screen.getByRole("button", { name: "Digit 1" })).toBeInTheDocument();
    expect(screen.queryByTestId("lockout-countdown")).not.toBeInTheDocument();
  });

  it("numpad is disabled during verification", async () => {
    let resolveVerify!: (value: boolean) => void;
    const hangingVerify = vi.fn(
      () => new Promise<boolean>((res) => { resolveVerify = res; })
    );
    const player = makePlayer();
    render(
      <PlayerPinOverlay
        player={player}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={hangingVerify}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });

    // After 4 digits, verifyPin is called — numpad should be disabled
    await waitFor(() => {
      expect(hangingVerify).toHaveBeenCalled();
    });

    expect(screen.getByRole("button", { name: "Digit 1" })).toBeDisabled();

    // Resolve to clean up
    await act(async () => {
      resolveVerify(false);
    });
  });
});
