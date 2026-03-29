/**
 * mappers.ts
 *
 * Pure functions that convert between snake_case Supabase DB rows and the
 * camelCase TypeScript models used throughout the app.
 *
 * All functions are stateless and throw-free — invalid/missing fields fall
 * back to safe defaults so a partial row never crashes the app.
 */

import type { Player, Badge } from "../models/player.js";
import type { Quest, QuestClaim } from "../models/quest.js";
import type { Reward, RewardRedemption } from "../models/reward.js";
import type { ParentConfig } from "../models/auth.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return new Date(0);
}

function toDateOrNull(value: unknown): Date | null {
  if (value == null) return null;
  return toDate(value);
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface PlayerRow {
  id: string;
  family_id: string;
  name: string;
  avatar: string | null;
  xp: number;
  lifetime_xp: number;
  coins: number;
  lifetime_coins: number;
  weekly_coins: number;
  level: number;
  streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  player_pin: string | null;
  badges: unknown; // JSONB
}

export function rowToPlayer(row: PlayerRow): Player {
  const rawBadges: unknown[] = Array.isArray(row.badges) ? row.badges : [];
  const badges: Badge[] = rawBadges.map((b) => {
    const badge = b as Record<string, unknown>;
    return {
      id: String(badge["id"] ?? ""),
      name: String(badge["name"] ?? ""),
      awardedAt: toDate(badge["awardedAt"]),
    };
  });

  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar ?? undefined,
    xp: row.xp,
    lifetimeXP: row.lifetime_xp,
    coins: row.coins,
    lifetimeCoins: row.lifetime_coins,
    weeklyCoins: row.weekly_coins,
    level: row.level,
    streak: row.streak,
    longestStreak: row.longest_streak,
    lastActivityDate: row.last_activity_date ?? undefined,
    playerPin: row.player_pin ?? undefined,
    badges,
  };
}

export function playerToRow(player: Player, familyId: string): PlayerRow {
  return {
    id: player.id,
    family_id: familyId,
    name: player.name,
    avatar: player.avatar ?? null,
    xp: player.xp,
    lifetime_xp: player.lifetimeXP,
    coins: player.coins,
    lifetime_coins: player.lifetimeCoins,
    weekly_coins: player.weeklyCoins,
    level: player.level,
    streak: player.streak,
    longest_streak: player.longestStreak ?? 0,
    last_activity_date: player.lastActivityDate ?? null,
    player_pin: player.playerPin ?? null,
    badges: player.badges.map((b) => ({
      id: b.id,
      name: b.name,
      awardedAt: b.awardedAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Quest
// ---------------------------------------------------------------------------

export interface QuestRow {
  id: string;
  family_id: string;
  title: string;
  icon: string;
  art_key: string;
  description: string;
  xp_reward: number;
  coin_reward: number;
  difficulty: number;
  category: string;
  recurrence: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export function rowToQuest(row: QuestRow): Quest {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon,
    artKey: row.art_key,
    description: row.description,
    xpReward: row.xp_reward,
    coinReward: row.coin_reward,
    difficulty: row.difficulty as Quest["difficulty"],
    category: row.category as Quest["category"],
    recurrence: row.recurrence as Quest["recurrence"],
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: toDate(row.created_at),
  };
}

export function questToRow(quest: Quest, familyId: string): QuestRow {
  return {
    id: quest.id,
    family_id: familyId,
    title: quest.title,
    icon: quest.icon,
    art_key: quest.artKey,
    description: quest.description,
    xp_reward: quest.xpReward,
    coin_reward: quest.coinReward,
    difficulty: quest.difficulty,
    category: quest.category,
    recurrence: quest.recurrence,
    is_active: quest.isActive,
    created_by: quest.createdBy,
    created_at: quest.createdAt instanceof Date
      ? quest.createdAt.toISOString()
      : String(quest.createdAt),
  };
}

// ---------------------------------------------------------------------------
// QuestClaim
// ---------------------------------------------------------------------------

export interface QuestClaimRow {
  id: string;
  family_id: string;
  quest_id: string;
  player_id: string;
  status: string;
  claimed_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  xp_awarded: number;
  coins_awarded: number;
}

export function rowToClaim(row: QuestClaimRow): QuestClaim {
  return {
    id: row.id,
    questId: row.quest_id,
    playerId: row.player_id,
    status: row.status as QuestClaim["status"],
    claimedAt: toDate(row.claimed_at),
    resolvedAt: toDateOrNull(row.resolved_at),
    resolvedBy: row.resolved_by,
    xpAwarded: row.xp_awarded,
    coinsAwarded: row.coins_awarded,
  };
}

export function claimToRow(claim: QuestClaim, familyId: string): QuestClaimRow {
  return {
    id: claim.id,
    family_id: familyId,
    quest_id: claim.questId,
    player_id: claim.playerId,
    status: claim.status,
    claimed_at: claim.claimedAt instanceof Date
      ? claim.claimedAt.toISOString()
      : String(claim.claimedAt),
    resolved_at: claim.resolvedAt instanceof Date
      ? claim.resolvedAt.toISOString()
      : claim.resolvedAt,
    resolved_by: claim.resolvedBy,
    xp_awarded: claim.xpAwarded,
    coins_awarded: claim.coinsAwarded,
  };
}

// ---------------------------------------------------------------------------
// Reward
// ---------------------------------------------------------------------------

export interface RewardRow {
  id: string;
  family_id: string;
  title: string;
  icon: string;
  description: string;
  coin_cost: number;
  stock: number;
  is_active: boolean;
  category: string;
  expires_at: string | null;
}

export function rowToReward(row: RewardRow): Reward {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon,
    description: row.description,
    coinCost: row.coin_cost,
    stock: row.stock,
    isActive: row.is_active,
    category: row.category as Reward["category"],
    expiresAt: row.expires_at ? toDate(row.expires_at) : undefined,
  };
}

export function rewardToRow(reward: Reward, familyId: string): RewardRow {
  return {
    id: reward.id,
    family_id: familyId,
    title: reward.title,
    icon: reward.icon,
    description: reward.description,
    coin_cost: reward.coinCost,
    stock: reward.stock,
    is_active: reward.isActive,
    category: reward.category,
    expires_at: reward.expiresAt instanceof Date
      ? reward.expiresAt.toISOString()
      : null,
  };
}

// ---------------------------------------------------------------------------
// RewardRedemption
// ---------------------------------------------------------------------------

export interface RewardRedemptionRow {
  id: string;
  family_id: string;
  reward_id: string;
  player_id: string;
  status: string;
  redeemed_at: string;
  fulfilled_at: string | null;
}

export function rowToRedemption(row: RewardRedemptionRow): RewardRedemption {
  return {
    id: row.id,
    rewardId: row.reward_id,
    playerId: row.player_id,
    status: row.status as RewardRedemption["status"],
    redeemedAt: toDate(row.redeemed_at),
    fulfilledAt: row.fulfilled_at ? toDate(row.fulfilled_at) : undefined,
  };
}

export function redemptionToRow(
  redemption: RewardRedemption,
  familyId: string
): RewardRedemptionRow {
  return {
    id: redemption.id,
    family_id: familyId,
    reward_id: redemption.rewardId,
    player_id: redemption.playerId,
    status: redemption.status,
    redeemed_at: redemption.redeemedAt instanceof Date
      ? redemption.redeemedAt.toISOString()
      : String(redemption.redeemedAt),
    fulfilled_at: redemption.fulfilledAt instanceof Date
      ? redemption.fulfilledAt.toISOString()
      : null,
  };
}

// ---------------------------------------------------------------------------
// ParentConfig
// ---------------------------------------------------------------------------

export interface ParentConfigRow {
  family_id: string;
  hashed_pin: string;
  failed_attempts: number;
}

export function rowToParentConfig(row: ParentConfigRow): ParentConfig {
  return {
    hashedPin: row.hashed_pin,
    failedAttempts: row.failed_attempts,
  };
}

export function parentConfigToRow(
  config: ParentConfig,
  familyId: string
): ParentConfigRow {
  return {
    family_id: familyId,
    hashed_pin: config.hashedPin,
    failed_attempts: config.failedAttempts,
  };
}
