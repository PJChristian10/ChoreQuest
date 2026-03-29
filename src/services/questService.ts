import type { Quest, QuestClaim } from "../models/quest.js";
import type { Player } from "../models/player.js";

// ---------------------------------------------------------------------------
// Level thresholds — index N corresponds to level N+1
// ---------------------------------------------------------------------------

const LEVEL_XP_THRESHOLDS: readonly number[] = [
  0,    // Level 1  — Apprentice
  100,  // Level 2  — Squire
  250,  // Level 3  — Scout
  500,  // Level 4  — Ranger
  900,  // Level 5  — Knight
  1400, // Level 6  — Champion
  2000, // Level 7  — Guardian
  2800, // Level 8  — Warlord
  3800, // Level 9  — Legend
  5000, // Level 10 — Grand Master
] as const;

const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length;

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface ClaimQuestResult {
  readonly quest: Quest;
  readonly claim: QuestClaim;
}

export interface ApproveQuestResult {
  readonly player: Player;
  readonly quest: Quest;
  /** Updated claim with xpAwarded, coinsAwarded, and resolvedAt snapshots. (PRD §7.1) */
  readonly claim: QuestClaim;
}

export interface DenyQuestResult {
  readonly quest: Quest;
  readonly claim: QuestClaim;
}

// ---------------------------------------------------------------------------
// calculateLevel — pure function, no side effects
// ---------------------------------------------------------------------------

export function calculateLevel(xp: number): number {
  if (xp < 0) return 1;

  let level = 1;
  for (let i = 1; i < LEVEL_XP_THRESHOLDS.length; i++) {
    const threshold = LEVEL_XP_THRESHOLDS[i];
    if (threshold !== undefined && xp >= threshold) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, MAX_LEVEL);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// claimQuest
// ---------------------------------------------------------------------------

export function claimQuest(quest: Quest, player: Player): ClaimQuestResult {
  if (quest.isActive === false) {
    throw new Error(
      `Quest "${quest.id}" cannot be claimed: quest is not active.`
    );
  }

  if (quest.status !== "available") {
    throw new Error(
      `Quest "${quest.id}" cannot be claimed: current status is "${quest.status}". Only "available" quests can be claimed.`
    );
  }

  const updatedQuest: Quest = { ...quest, status: "awaiting_approval" };

  const claim: QuestClaim = {
    id: generateId(),
    questId: quest.id,
    playerId: player.id,
    status: "pending",
    claimedAt: new Date(),
    voided: false,
  };

  return { quest: updatedQuest, claim };
}

// ---------------------------------------------------------------------------
// approveQuest
// ---------------------------------------------------------------------------

export function approveQuest(
  claim: QuestClaim,
  quest: Quest,
  player: Player
): ApproveQuestResult {
  if (claim.voided) {
    throw new Error(
      `Claim "${claim.id}" is voided and cannot be approved.`
    );
  }

  if (quest.status !== "awaiting_approval") {
    throw new Error(
      `Quest "${quest.id}" cannot be approved: current status is "${quest.status}". Only "awaiting_approval" quests can be approved.`
    );
  }

  if (claim.questId !== quest.id) {
    throw new Error(
      `Claim "${claim.id}" references quest "${claim.questId}" but the provided quest id is "${quest.id}".`
    );
  }

  if (claim.playerId !== player.id) {
    throw new Error(
      `Claim "${claim.id}" belongs to player "${claim.playerId}" but the provided player id is "${player.id}". Rewards must go to the claiming player.`
    );
  }

  const newXp = player.xp + quest.xpReward;
  const newCoins = player.coins + quest.coinReward;
  const newLifetimeCoins = player.lifetimeCoins + quest.coinReward;
  const newLifetimeXP = player.lifetimeXP + quest.xpReward;
  const newLevel = calculateLevel(newXp);

  const updatedPlayer: Player = {
    ...player,
    xp: newXp,
    lifetimeXP: newLifetimeXP,
    coins: newCoins,
    lifetimeCoins: newLifetimeCoins,
    level: newLevel,
  };

  const updatedQuest: Quest = { ...quest, status: "approved" };

  const resolvedAt = new Date();
  const updatedClaim: QuestClaim = {
    ...claim,
    status: "approved",
    xpAwarded: quest.xpReward,
    coinsAwarded: quest.coinReward,
    resolvedAt,
  };

  return { player: updatedPlayer, quest: updatedQuest, claim: updatedClaim };
}

// ---------------------------------------------------------------------------
// denyQuest
// ---------------------------------------------------------------------------

export function denyQuest(claim: QuestClaim, quest: Quest): DenyQuestResult {
  if (claim.voided) {
    throw new Error(
      `Claim "${claim.id}" is already voided and cannot be denied again.`
    );
  }

  if (quest.status !== "awaiting_approval") {
    throw new Error(
      `Quest "${quest.id}" cannot be denied: current status is "${quest.status}". Only "awaiting_approval" quests can be denied.`
    );
  }

  if (claim.questId !== quest.id) {
    throw new Error(
      `Claim "${claim.id}" references quest "${claim.questId}" but the provided quest id is "${quest.id}".`
    );
  }

  const updatedQuest: Quest = { ...quest, status: "available" };
  const updatedClaim: QuestClaim = { ...claim, status: "denied", voided: true, resolvedAt: new Date() };

  return { quest: updatedQuest, claim: updatedClaim };
}
