import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import { RedeemConfirmModal } from "../RedeemConfirmModal.js";
import { makePlayer, makeReward } from "../../../test/fixtures.js";

afterEach(() => cleanup());

describe("RedeemConfirmModal", () => {
  const reward = makeReward({ id: "r1", title: "Extra Screen Time", coinCost: 50 });
  const player = makePlayer({ id: "p1", name: "Alex", coins: 100 });

  it("renders reward title", () => {
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );
    expect(screen.getByText("Extra Screen Time")).toBeDefined();
  });

  it("renders coin cost", () => {
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );
    expect(screen.getByText("50")).toBeDefined();
  });

  it("renders player name", () => {
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );
    expect(screen.getByText("Alex")).toBeDefined();
  });

  it("renders 'Confirm redemption' as aria-label on dialog", () => {
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );
    const dialog = screen.getByRole("dialog", { name: "Confirm redemption" });
    expect(dialog).toBeDefined();
  });

  it("cancel button calls onCancel", () => {
    const onCancel = vi.fn();
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel redemption" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("entering correct PIN calls onConfirm", async () => {
    const onConfirm = vi.fn();
    const verifyPin = vi.fn().mockResolvedValue(true);
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        verifyPin={verifyPin}
      />
    );
    // Enter 4 digits
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });

  it("entering wrong PIN shows 'Wrong PIN, try again'", async () => {
    const verifyPin = vi.fn().mockResolvedValue(false);
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={verifyPin}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });
    await waitFor(() => {
      expect(screen.getByText("Wrong PIN, try again")).toBeDefined();
    });
  });

  it("entering wrong PIN does NOT call onConfirm", async () => {
    const onConfirm = vi.fn();
    const verifyPin = vi.fn().mockResolvedValue(false);
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        verifyPin={verifyPin}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });
    await waitFor(() => {
      expect(screen.getByText("Wrong PIN, try again")).toBeDefined();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("numpad is rendered", () => {
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );
    expect(screen.getByLabelText("Number pad")).toBeDefined();
  });

  it("pin dots are rendered", () => {
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );
    expect(screen.getByTestId("pin-dots")).toBeDefined();
  });

  it("aria-live region shows 'Enter your PIN to confirm' initially", () => {
    render(
      <RedeemConfirmModal
        reward={reward}
        player={player}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        verifyPin={vi.fn().mockResolvedValue(true)}
      />
    );
    expect(screen.getByText("Enter your PIN to confirm")).toBeDefined();
  });
});
