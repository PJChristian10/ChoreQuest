import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RewardShopHeader } from "../RewardShopHeader.js";
import { makePlayer } from "../../../test/fixtures.js";

afterEach(() => cleanup());

describe("RewardShopHeader", () => {
  it("renders player name", () => {
    const player = makePlayer({ name: "Jordan" });
    render(<RewardShopHeader player={player} onBack={vi.fn()} />);
    expect(screen.getByText("Jordan")).toBeDefined();
  });

  it("renders coin balance with aria-label containing the coin count", () => {
    const player = makePlayer({ coins: 75 });
    render(<RewardShopHeader player={player} onBack={vi.fn()} />);
    const coinEl = screen.getByLabelText("75 coins");
    expect(coinEl).toBeDefined();
  });

  it("renders back button with aria-label 'Back to Quest Board'", () => {
    const player = makePlayer();
    render(<RewardShopHeader player={player} onBack={vi.fn()} />);
    const btn = screen.getByRole("button", { name: "Back to Quest Board" });
    expect(btn).toBeDefined();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    const player = makePlayer();
    render(<RewardShopHeader player={player} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Quest Board" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("coin balance display uses data-testid='coin-balance'", () => {
    const player = makePlayer({ coins: 120 });
    render(<RewardShopHeader player={player} onBack={vi.fn()} />);
    const el = screen.getByTestId("coin-balance");
    expect(el.textContent).toBe("120");
  });
});
