import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import { RewardShop } from "../RewardShop.js";
import { GameProvider } from "../../../state/GameContext.js";
import { makePlayer, makeReward } from "../../../test/fixtures.js";
import { SEED_STATE } from "../../../state/seed.js";
import type { GameState } from "../../../state/types.js";

afterEach(() => cleanup());

function buildState(overrides: Partial<GameState> = {}): GameState {
  return { ...SEED_STATE, ...overrides };
}

describe("RewardShop", () => {
  const player = makePlayer({ id: "p1", name: "Alex", coins: 100 });
  const affordableReward = makeReward({ id: "r1", title: "Screen Time", coinCost: 50, isActive: true });
  const expensiveReward = makeReward({ id: "r2", title: "Expensive Treat", coinCost: 200, isActive: true });
  const initialState = buildState({ players: [player], rewards: [affordableReward, expensiveReward] });

  it("renders RewardShopHeader", () => {
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="p1" onBack={vi.fn()} />
      </GameProvider>
    );
    // RewardShopHeader renders the back button
    expect(screen.getByRole("button", { name: "Back to Quest Board" })).toBeDefined();
  });

  it("renders a RewardCard for each active reward", () => {
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="p1" onBack={vi.fn()} />
      </GameProvider>
    );
    expect(screen.getByText("Screen Time")).toBeDefined();
    expect(screen.getByText("Expensive Treat")).toBeDefined();
  });

  it("shows 'Can't Afford' state for rewards player can't afford", () => {
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="p1" onBack={vi.fn()} />
      </GameProvider>
    );
    expect(screen.getByTestId("cant-afford-label")).toBeDefined();
  });

  it("tapping an affordable reward opens RedeemConfirmModal", () => {
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="p1" onBack={vi.fn()} />
      </GameProvider>
    );
    // Click the redeem button on the affordable reward
    fireEvent.click(screen.getByRole("button", { name: /Redeem Screen Time/i }));
    expect(screen.getByRole("dialog", { name: "Confirm redemption" })).toBeDefined();
  });

  it("RedeemConfirmModal is not shown initially", () => {
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="p1" onBack={vi.fn()} />
      </GameProvider>
    );
    expect(screen.queryByRole("dialog", { name: "Confirm redemption" })).toBeNull();
  });

  it("cancelling the modal closes it", () => {
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="p1" onBack={vi.fn()} />
      </GameProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /Redeem Screen Time/i }));
    expect(screen.getByRole("dialog", { name: "Confirm redemption" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Cancel redemption" }));
    expect(screen.queryByRole("dialog", { name: "Confirm redemption" })).toBeNull();
  });

  it("confirming the modal with correct PIN dispatches REDEEM_REWARD", async () => {
    const verifyPin = vi.fn().mockResolvedValue(true);
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="p1" onBack={vi.fn()} verifyPin={verifyPin} />
      </GameProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /Redeem Screen Time/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });
    // After successful redemption, modal should be gone
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Confirm redemption" })).toBeNull();
    });
  });

  it("after successful redemption shows success message", async () => {
    const verifyPin = vi.fn().mockResolvedValue(true);
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="p1" onBack={vi.fn()} verifyPin={verifyPin} />
      </GameProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /Redeem Screen Time/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });
    await waitFor(() => {
      expect(screen.getByTestId("success-message")).toBeDefined();
    });
    expect(screen.getByTestId("success-message").textContent).toBe("Reward redeemed!");
  });

  it("returns null when activePlayerId not found", () => {
    render(
      <GameProvider initialState={initialState}>
        <RewardShop activePlayerId="nonexistent" onBack={vi.fn()} />
      </GameProvider>
    );
    // No header, no content
    expect(screen.queryByRole("button", { name: "Back to Quest Board" })).toBeNull();
  });
});
