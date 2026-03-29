import type { Player } from "../models/player.js";
import type { AvatarKey } from "../utils/avatarUtils.js";
import type { Quest, QuestClaim } from "../models/quest.js";
import type { Reward, RewardRedemption } from "../models/reward.js";
import type { ParentConfig, ParentSession } from "../models/auth.js";
import type { GameState } from "../state/types.js";

// ── Players ──────────────────────────────────────────────────────────────────

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Alex",
    xp: 100,
    lifetimeXP: 100,
    coins: 50,
    lifetimeCoins: 50,
    weeklyCoins: 10,
    level: 2,
    streak: 1,
    longestStreak: 1,
    lastActivityDate: "2026-03-18",
    badges: [],
    ...overrides,
  };
}

export function makePlayerLevel10(overrides: Partial<Player> = {}): Player {
  return makePlayer({ level: 10, xp: 5000, lifetimeXP: 5000, streak: 5, ...overrides });
}

// ── Quests ───────────────────────────────────────────────────────────────────

export function makeQuest(overrides: Partial<Quest> = {}): Quest {
  // status is a runtime field used by questService but not declared in the Quest interface
  const base = {
    id: "quest-1",
    title: "Wash the Dishes",
    icon: "🍳",
    artKey: "dishes",
    description: "",
    status: "available",
    category: "kitchen",
    recurrence: "daily",
    difficulty: 1,
    xpReward: 15,
    coinReward: 10,
    isActive: true,
    createdBy: "seed",
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
  return { ...base, ...overrides } as Quest;
}

// ── Rewards ──────────────────────────────────────────────────────────────────

export function makeReward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: "reward-1",
    title: "Extra Screen Time",
    icon: "📺",
    description: "One extra hour",
    coinCost: 50,
    stock: -1,
    isActive: true,
    category: "screen_time",
    ...overrides,
  };
}

// ── Claims ───────────────────────────────────────────────────────────────────

export function makeClaim(overrides: Partial<QuestClaim> = {}): QuestClaim {
  const base = {
    id: "claim-1",
    questId: "quest-1",
    playerId: "player-1",
    status: "pending",
    claimedAt: new Date("2026-03-19T10:00:00Z"),
    resolvedAt: null,
    resolvedBy: null,
    xpAwarded: 0,
    coinsAwarded: 0,
  };
  return { ...base, ...overrides } as QuestClaim;
}

// ── Redemptions ───────────────────────────────────────────────────────────────

export function makeRedemption(overrides: Partial<RewardRedemption> = {}): RewardRedemption {
  return {
    id: "redemption-1",
    rewardId: "reward-1",
    playerId: "player-1",
    status: "pending",
    redeemedAt: new Date("2026-03-19T10:00:00Z"),
    ...overrides,
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function makeParentSession(overrides: Partial<ParentSession> = {}): ParentSession {
  return {
    isActive: true,
    createdAt: new Date("2026-03-19T10:00:00Z"),
    lastActivityAt: new Date("2026-03-19T10:00:00Z"),
    ...overrides,
  };
}

export function makeActiveSession(overrides: Partial<ParentSession> = {}): ParentSession {
  return {
    isActive: true,
    createdAt: new Date(),
    lastActivityAt: new Date(),
    ...overrides,
  };
}

export function makeExpiredSession(): ParentSession {
  const longAgo = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago
  return { isActive: true, createdAt: longAgo, lastActivityAt: longAgo };
}

export function makeParentConfig(overrides: Partial<ParentConfig> = {}): ParentConfig {
  return {
    hashedPin: "$2b$10$placeholder",
    failedAttempts: 0,
    ...overrides,
  };
}

// ── GameState ─────────────────────────────────────────────────────────────────

export function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [],
    quests: [],
    claims: [],
    rewards: [],
    redemptions: [],
    parentConfig: null,
    parentSession: null,
    ...overrides,
  };
}

/** Player with a pre-hashed PIN (bcrypt-like placeholder, not a real hash). */
export function makePlayerWithPin(
  pin: string = "mock-hash",
  overrides: Partial<Player> = {}
): Player {
  return makePlayer({ playerPin: pin, ...overrides });
}

/** Player with an avatar key set. */
export function makePlayerWithAvatar(
  avatar: AvatarKey = "cat",
  overrides: Partial<Player> = {}
): Player {
  return makePlayer({ avatar, ...overrides });
}
