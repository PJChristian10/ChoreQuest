import { describe, it, expect, beforeEach } from "vitest";
import { redeemReward, fulfillRedemption } from "../rewardService.js";
import type { Reward, RewardRedemption } from "../../models/reward.js";
import type { Player } from "../../models/player.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeReward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: "reward-1",
    title: "Extra Screen Time",
    icon: "📺",
    description: "30 extra minutes of screen time",
    coinCost: 50,
    stock: 10,
    isActive: true,
    category: "screen_time",
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Alice",
    xp: 100,
    lifetimeXP: 100,
    coins: 200,
    lifetimeCoins: 500,
    level: 2,
    streak: 3,
    badges: [],
    ...overrides,
  };
}

function makeRedemption(overrides: Partial<RewardRedemption> = {}): RewardRedemption {
  return {
    id: "redemption-1",
    rewardId: "reward-1",
    playerId: "player-1",
    status: "pending",
    redeemedAt: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// redeemReward — happy path
// ---------------------------------------------------------------------------

describe("redeemReward — happy path", () => {
  let reward: Reward;
  let player: Player;

  beforeEach(() => {
    reward = makeReward({ coinCost: 50, stock: 10 });
    player = makePlayer({ coins: 200, lifetimeCoins: 500 });
  });

  it("1. returns redemption with status 'pending'", () => {
    const { redemption } = redeemReward(reward, player);
    expect(redemption.status).toBe("pending");
  });

  it("2. deducts coinCost from player.coins", () => {
    const { player: updated } = redeemReward(reward, player);
    expect(updated.coins).toBe(150); // 200 - 50
  });

  it("3. player.lifetimeCoins does NOT change", () => {
    const { player: updated } = redeemReward(reward, player);
    expect(updated.lifetimeCoins).toBe(500);
  });

  it("4. stock decrements by 1 when stock > 0", () => {
    const { reward: updated } = redeemReward(reward, player);
    expect(updated.stock).toBe(9); // 10 - 1
  });

  it("5. stock stays -1 when stock is -1 (unlimited)", () => {
    const unlimitedReward = makeReward({ stock: -1 });
    const { reward: updated } = redeemReward(unlimitedReward, player);
    expect(updated.stock).toBe(-1);
  });

  it("6. redemption has a redeemedAt Date", () => {
    const { redemption } = redeemReward(reward, player);
    expect(redemption.redeemedAt).toBeInstanceOf(Date);
  });

  it("7. redemption links rewardId and playerId", () => {
    const { redemption } = redeemReward(reward, player);
    expect(redemption.rewardId).toBe(reward.id);
    expect(redemption.playerId).toBe(player.id);
  });

  it("8. original player object is NOT mutated", () => {
    redeemReward(reward, player);
    expect(player.coins).toBe(200);
    expect(player.lifetimeCoins).toBe(500);
  });

  it("9. original reward object is NOT mutated", () => {
    redeemReward(reward, player);
    expect(reward.stock).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// redeemReward — error paths
// ---------------------------------------------------------------------------

describe("redeemReward — error paths", () => {
  it("10. throws when player.coins < reward.coinCost (insufficient balance)", () => {
    const expensiveReward = makeReward({ coinCost: 300 });
    const poorPlayer = makePlayer({ coins: 100 });
    expect(() => redeemReward(expensiveReward, poorPlayer)).toThrow();
  });

  it("11. throws when reward.isActive is false", () => {
    const inactiveReward = makeReward({ isActive: false });
    const player = makePlayer({ coins: 200 });
    expect(() => redeemReward(inactiveReward, player)).toThrow();
  });

  it("12. throws when reward.stock === 0 (out of stock)", () => {
    const outOfStockReward = makeReward({ stock: 0 });
    const player = makePlayer({ coins: 200 });
    expect(() => redeemReward(outOfStockReward, player)).toThrow();
  });

  it("13. throws when reward.expiresAt is in the past", () => {
    const expiredReward = makeReward({
      expiresAt: new Date("2020-01-01T00:00:00Z"),
    });
    const player = makePlayer({ coins: 200 });
    expect(() => redeemReward(expiredReward, player)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// redeemReward — edge cases
// ---------------------------------------------------------------------------

describe("redeemReward — edge cases", () => {
  it("14. reward.expiresAt in the future — succeeds", () => {
    const futureReward = makeReward({
      expiresAt: new Date("2099-01-01T00:00:00Z"),
    });
    const player = makePlayer({ coins: 200 });
    const { redemption } = redeemReward(futureReward, player);
    expect(redemption.status).toBe("pending");
  });

  it("15. exact coin balance (player.coins === reward.coinCost) — succeeds, balance becomes 0", () => {
    const reward = makeReward({ coinCost: 200 });
    const player = makePlayer({ coins: 200 });
    const { player: updated } = redeemReward(reward, player);
    expect(updated.coins).toBe(0);
  });

  it("16. stock becomes 0 after last redemption (stock was 1)", () => {
    const lastOneReward = makeReward({ stock: 1 });
    const player = makePlayer({ coins: 200 });
    const { reward: updated } = redeemReward(lastOneReward, player);
    expect(updated.stock).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// fulfillRedemption — happy path
// ---------------------------------------------------------------------------

describe("fulfillRedemption — happy path", () => {
  let pending: RewardRedemption;

  beforeEach(() => {
    pending = makeRedemption({ status: "pending" });
  });

  it("17. returns redemption with status 'fulfilled'", () => {
    const { redemption } = fulfillRedemption(pending);
    expect(redemption.status).toBe("fulfilled");
  });

  it("18. returned redemption has a fulfilledAt Date", () => {
    const { redemption } = fulfillRedemption(pending);
    expect(redemption.fulfilledAt).toBeInstanceOf(Date);
  });

  it("19. original redemption is NOT mutated", () => {
    fulfillRedemption(pending);
    expect(pending.status).toBe("pending");
    expect(pending.fulfilledAt).toBeUndefined();
  });

  it("22. preserves all other redemption fields (id, rewardId, playerId, redeemedAt)", () => {
    const redeemedAt = new Date("2026-01-01T10:00:00Z");
    const specific = makeRedemption({
      id: "redemption-xyz",
      rewardId: "reward-abc",
      playerId: "player-xyz",
      redeemedAt,
      status: "pending",
    });
    const { redemption } = fulfillRedemption(specific);
    expect(redemption.id).toBe("redemption-xyz");
    expect(redemption.rewardId).toBe("reward-abc");
    expect(redemption.playerId).toBe("player-xyz");
    expect(redemption.redeemedAt).toBe(redeemedAt);
  });
});

// ---------------------------------------------------------------------------
// fulfillRedemption — error paths
// ---------------------------------------------------------------------------

describe("fulfillRedemption — error paths", () => {
  it("20. throws when redemption status is already 'fulfilled'", () => {
    const alreadyFulfilled = makeRedemption({
      status: "fulfilled",
      fulfilledAt: new Date(),
    });
    expect(() => fulfillRedemption(alreadyFulfilled)).toThrow();
  });

  it("21. throws when redemption status is 'cancelled'", () => {
    const cancelled = makeRedemption({ status: "cancelled" });
    expect(() => fulfillRedemption(cancelled)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// fulfillRedemption — timestamp precision
// ---------------------------------------------------------------------------

describe("fulfillRedemption — timestamp precision", () => {
  it("fulfilledAt is set to a time >= the time before calling", () => {
    const before = new Date();
    const pending = makeRedemption({ status: "pending" });
    const { redemption } = fulfillRedemption(pending);
    expect(redemption.fulfilledAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    );
  });
});
