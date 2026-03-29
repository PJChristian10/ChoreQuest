export type RewardCategory =
  | "screen_time"
  | "food_treats"
  | "activities"
  | "privileges"
  | "physical_items";

export interface Reward {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly coinCost: number;
  /** Number of times this reward can be redeemed. -1 = unlimited. */
  readonly stock: number;
  /** Optional expiry date. If set and in the past, reward cannot be redeemed. */
  readonly expiresAt?: Date;
  /** When false, reward is hidden from the shop and cannot be redeemed. */
  readonly isActive: boolean;
  readonly category: RewardCategory;
}

export type RewardRedemptionStatus = "pending" | "fulfilled" | "cancelled";

export interface RewardRedemption {
  readonly id: string;
  readonly rewardId: string;
  readonly playerId: string;
  readonly status: RewardRedemptionStatus;
  /** When the child tapped Redeem. */
  readonly redeemedAt: Date;
  /** When the parent marked the reward as fulfilled. */
  readonly fulfilledAt?: Date;
}
