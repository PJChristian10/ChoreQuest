import type { Player } from "../models/player.js";

// Level titles matching the PRD (index 0 = level 1)
const LEVEL_TITLES = [
  "Apprentice", // 1
  "Squire",     // 2
  "Scout",      // 3
  "Ranger",     // 4
  "Knight",     // 5
  "Champion",   // 6
  "Guardian",   // 7
  "Warlord",    // 8
  "Legend",     // 9
  "Grand Master", // 10
] as const;

// XP thresholds — must match questService.ts LEVEL_XP_THRESHOLDS exactly
const LEVEL_XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000] as const;

/**
 * Returns the title for the given level. Clamps to [1, 10].
 */
export function getLevelTitle(level: number): string {
  const clamped = Math.max(1, Math.min(10, level));
  const title = LEVEL_TITLES[clamped - 1];
  // title is always defined because clamped is in [1,10] and array has 10 elements
  return title ?? "Apprentice";
}

export interface XpProgress {
  readonly levelStart: number;   // XP threshold for current level
  readonly levelEnd: number;     // XP threshold for next level (same as levelStart at max)
  readonly current: number;      // player.xp
  readonly percent: number;      // 0–100 (clamped), progress through current level
  readonly isMaxLevel: boolean;  // true when level === 10
}

/**
 * Computes the XP progress for a player within their current level.
 */
export function getXpProgress(player: Player): XpProgress {
  const { xp, level } = player;
  const isMaxLevel = level >= 10;

  const levelStart = LEVEL_XP_THRESHOLDS[level - 1] ?? 0;

  if (isMaxLevel) {
    return {
      levelStart,
      levelEnd: levelStart,
      current: xp,
      percent: 100,
      isMaxLevel: true,
    };
  }

  const levelEnd = LEVEL_XP_THRESHOLDS[level] ?? levelStart;
  const range = levelEnd - levelStart;

  const rawPercent = range > 0 ? ((xp - levelStart) / range) * 100 : 0;
  const percent = Math.max(0, Math.min(100, rawPercent));

  return {
    levelStart,
    levelEnd,
    current: xp,
    percent,
    isMaxLevel: false,
  };
}
