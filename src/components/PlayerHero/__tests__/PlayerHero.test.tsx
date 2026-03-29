import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { PlayerHero } from "../PlayerHero.js";

afterEach(() => {
  cleanup();
});
import type { Player } from "../../../models/player.js";

const ALEX: Player = {
  id: "player-alex",
  name: "Alex",
  xp: 350,
  lifetimeXP: 350,
  coins: 75,
  lifetimeCoins: 90,
  weeklyCoins: 45,
  level: 3,
  streak: 5,
  longestStreak: 12,
  lastActivityDate: "2026-03-18",
  badges: [],
};

describe("PlayerHero", () => {
  it("renders player name in a heading", () => {
    render(<PlayerHero player={ALEX} />);
    expect(screen.getByRole("heading", { name: "Alex" })).toBeDefined();
  });

  it("renders the level title", () => {
    render(<PlayerHero player={ALEX} />);
    // Level 3 = "Scout"
    expect(screen.getByText("Scout")).toBeDefined();
  });

  it("renders the XP text label showing current and next threshold", () => {
    render(<PlayerHero player={ALEX} />);
    expect(screen.getByText("350 / 500 XP")).toBeDefined();
  });

  it("renders an XP progressbar with correct aria attributes", () => {
    render(<PlayerHero player={ALEX} />);
    const progressbar = screen.getByRole("progressbar", { name: /xp progress/i });
    expect(progressbar).toBeDefined();
    // Level 3: 250–500, xp=350 → (100/250)*100 = 40
    expect(progressbar.getAttribute("aria-valuenow")).toBe("40");
    expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("renders coin balance", () => {
    render(<PlayerHero player={ALEX} />);
    expect(screen.getByLabelText(/75 coins/i)).toBeDefined();
  });

  it("renders streak count", () => {
    render(<PlayerHero player={ALEX} />);
    expect(screen.getByLabelText(/5 day streak/i)).toBeDefined();
  });

  it("shows On a Roll! when streak is 5", () => {
    render(<PlayerHero player={ALEX} />);
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("On a Roll!")).toBeDefined();
  });

  it("does NOT show On a Roll! when streak is 2", () => {
    const player: Player = { ...ALEX, streak: 2 };
    render(<PlayerHero player={player} />);
    expect(screen.queryByText("On a Roll!")).toBeNull();
  });

  it("renders an Exit button when onExit is provided", () => {
    render(<PlayerHero player={ALEX} onExit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /exit to home/i })).toBeDefined();
  });

  it("does not render an Exit button when onExit is not provided", () => {
    render(<PlayerHero player={ALEX} />);
    expect(screen.queryByRole("button", { name: /exit to home/i })).toBeNull();
  });

  it("calls onExit when Exit button is clicked", () => {
    const onExit = vi.fn();
    render(<PlayerHero player={ALEX} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: /exit to home/i }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
