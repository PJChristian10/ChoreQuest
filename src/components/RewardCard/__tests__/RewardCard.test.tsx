import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RewardCard } from "../RewardCard.js";
import { makeReward } from "../../../test/fixtures.js";

afterEach(() => cleanup());

describe("RewardCard", () => {
  it("renders reward title and description", () => {
    const reward = makeReward({ title: "Movie Night", description: "Pick the movie" });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />);
    expect(screen.getByText("Movie Night")).toBeDefined();
    expect(screen.getByText("Pick the movie")).toBeDefined();
  });

  it("renders coin cost with data-testid='coin-cost'", () => {
    const reward = makeReward({ coinCost: 75 });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />);
    const el = screen.getByTestId("coin-cost");
    expect(el.textContent).toBe("75");
  });

  it("renders category badge with data-testid='category-badge'", () => {
    const reward = makeReward({ category: "screen_time" });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />);
    expect(screen.getByTestId("category-badge")).toBeDefined();
  });

  it("renders stock count when stock is not -1 (unlimited)", () => {
    const reward = makeReward({ stock: 3 });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />);
    expect(screen.getByTestId("stock-count")).toBeDefined();
  });

  it("does not render stock count when stock is -1 (unlimited)", () => {
    const reward = makeReward({ stock: -1 });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />);
    expect(screen.queryByTestId("stock-count")).toBeNull();
  });

  it("renders 'Redeem' button when player can afford it", () => {
    const reward = makeReward({ coinCost: 50 });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Redeem/i })).toBeDefined();
  });

  it("calls onRedeem with reward id when Redeem clicked", () => {
    const onRedeem = vi.fn();
    const reward = makeReward({ id: "r-test", coinCost: 50 });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={onRedeem} />);
    fireEvent.click(screen.getByRole("button", { name: /Redeem/i }));
    expect(onRedeem).toHaveBeenCalledWith("r-test");
  });

  it("shows 'Can't Afford' label when player coins < cost", () => {
    const reward = makeReward({ coinCost: 200 });
    render(<RewardCard reward={reward} playerCoins={50} onRedeem={vi.fn()} />);
    expect(screen.getByTestId("cant-afford-label")).toBeDefined();
  });

  it("does not show Redeem button when can't afford", () => {
    const reward = makeReward({ coinCost: 200 });
    render(<RewardCard reward={reward} playerCoins={50} onRedeem={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Redeem/i })).toBeNull();
  });

  it("shows 'Out of Stock' when stock === 0", () => {
    const reward = makeReward({ stock: 0 });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />);
    expect(screen.getByTestId("out-of-stock-label")).toBeDefined();
  });

  it("shows 'Expired' when expiresAt is in the past", () => {
    const pastDate = new Date("2020-01-01T00:00:00Z");
    const reward = makeReward({ expiresAt: pastDate });
    const nowFn = () => new Date("2026-03-20T00:00:00Z");
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} nowFn={nowFn} />);
    expect(screen.getByTestId("expired-label")).toBeDefined();
  });

  it("does not show 'Expired' when expiresAt is in the future", () => {
    const futureDate = new Date("2030-01-01T00:00:00Z");
    const reward = makeReward({ expiresAt: futureDate });
    const nowFn = () => new Date("2026-03-20T00:00:00Z");
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} nowFn={nowFn} />);
    expect(screen.queryByTestId("expired-label")).toBeNull();
  });

  it("returns null when reward.isActive === false", () => {
    const reward = makeReward({ isActive: false });
    const { container } = render(
      <RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not show Redeem button when out of stock", () => {
    const reward = makeReward({ stock: 0 });
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Redeem/i })).toBeNull();
  });

  it("does not show Redeem button when expired", () => {
    const pastDate = new Date("2020-01-01T00:00:00Z");
    const reward = makeReward({ expiresAt: pastDate });
    const nowFn = () => new Date("2026-03-20T00:00:00Z");
    render(<RewardCard reward={reward} playerCoins={100} onRedeem={vi.fn()} nowFn={nowFn} />);
    expect(screen.queryByRole("button", { name: /Redeem/i })).toBeNull();
  });
});
