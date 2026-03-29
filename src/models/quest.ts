/**
 * models/quest.ts
 *
 * Quest and related types for ChoreQuest.
 */

export type QuestCategory =
  | "kitchen"
  | "cleaning"
  | "pets"
  | "school"
  | "garden"
  | "home"
  | "bonus";

export type QuestRecurrence = "daily" | "weekly" | "one-time" | "bonus";

export type QuestDifficulty = 1 | 2 | 3;

export type QuestClaimStatus = "pending" | "approved" | "denied";

export interface Quest {
  readonly id: string;
  readonly title: string;
  readonly icon: string;           // Emoji — kept for backward-compat / admin display
  readonly artKey: string;         // Key into ART_DEFINITIONS in questArtUtils.ts
  readonly description: string;
  readonly xpReward: number;
  readonly coinReward: number;
  readonly difficulty: QuestDifficulty;
  readonly category: QuestCategory;
  readonly recurrence: QuestRecurrence;
  readonly isActive: boolean;
  readonly createdBy: string;
  readonly createdAt: Date;
}

export interface QuestClaim {
  readonly id: string;
  readonly questId: string;
  readonly playerId: string;
  readonly status: QuestClaimStatus;
  readonly claimedAt: Date;
  readonly resolvedAt: Date | null;
  readonly resolvedBy: string | null;
  readonly xpAwarded: number;
  readonly coinsAwarded: number;
}
