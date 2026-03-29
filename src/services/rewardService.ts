import type { Reward, RewardRedemption } from "../models/reward.js";
import type { Player } from "../models/player.js";

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface RedeemRewardResult {
  /** Updated player with deducted spendable coins (lifetimeCoins unchanged). */
  readonly player: Player;
  /** Updated reward with decremented stock (or unchanged if stock is -1). */
  readonly reward: Reward;
  /** Newly created redemption record with status "pending". */
  readonly redemption: RewardRedemption;
}

export interface FulfillRedemptionResult {
  /** Updated redemption with status "fulfilled" and fulfilledAt timestamp. */
  readonly redemption: RewardRedemption;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function assertRewardIsActive(reward: Reward): void {
  if (!reward.isActive) {
    throw new Error(
      `Reward "${reward.id}" cannot be redeemed: reward is not active.`
    );
  }
}

function assertRewardInStock(reward: Reward): void {
  if (reward.stock === 0) {
    throw new Error(
      `Reward "${reward.id}" cannot be redeemed: out of stock.`
    );
  }
}

function assertRewardNotExpired(reward: Reward): void {
  if (reward.expiresAt !== undefined && reward.expiresAt < new Date()) {
    throw new Error(
      `Reward "${reward.id}" cannot be redeemed: reward has expired.`
    );
  }
}

function assertSufficientCoins(reward: Reward, player: Player): void {
  if (player.coins < reward.coinCost) {
    throw new Error(
      `Player "${player.id}" cannot redeem reward "${reward.id}": insufficient coins (has ${player.coins}, needs ${reward.coinCost}).`
    );
  }
}

// ---------------------------------------------------------------------------
// redeemReward
// ---------------------------------------------------------------------------

export function redeemReward(reward: Reward, player: Player): RedeemRewardResult {
  assertRewardIsActive(reward);
  assertRewardInStock(reward);
  assertRewardNotExpired(reward);
  assertSufficientCoins(reward, player);

  const updatedPlayer: Player = {
    ...player,
    coins: player.coins - reward.coinCost,
    // lifetimeCoins intentionally unchanged — it is a lifetime total
  };

  const updatedReward: Reward = {
    ...reward,
    stock: reward.stock === -1 ? -1 : reward.stock - 1,
  };

  const redemption: RewardRedemption = {
    id: generateId(),
    rewardId: reward.id,
    playerId: player.id,
    status: "pending",
    redeemedAt: new Date(),
  };

  return { player: updatedPlayer, reward: updatedReward, redemption };
}

// ---------------------------------------------------------------------------
// fulfillRedemption
// ---------------------------------------------------------------------------

export function fulfillRedemption(redemption: RewardRedemption): FulfillRedemptionResult {
  if (redemption.status === "fulfilled") {
    throw new Error(
      `Redemption "${redemption.id}" is already fulfilled.`
    );
  }

  if (redemption.status === "cancelled") {
    throw new Error(
      `Redemption "${redemption.id}" is cancelled and cannot be fulfilled.`
    );
  }

  const updatedRedemption: RewardRedemption = {
    ...redemption,
    status: "fulfilled",
    fulfilledAt: new Date(),
  };

  return { redemption: updatedRedemption };
}
