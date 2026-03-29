import type { Player } from "../models/player.js";

// ---------------------------------------------------------------------------
// Public result type
// ---------------------------------------------------------------------------

export interface UpdateStreakResult {
  readonly player: Player;
  readonly streakChanged: boolean;
  readonly isOnARoll: boolean;
}

// ---------------------------------------------------------------------------
// isOnARoll — pure helper (PRD §5.4: "On a Roll" flag for streak >= 3)
// ---------------------------------------------------------------------------

export function isOnARoll(streak: number): boolean {
  return streak >= 3;
}

// ---------------------------------------------------------------------------
// daysBetween — pure date-arithmetic helper
// Parses two "YYYY-MM-DD" strings as UTC midnight and returns the difference
// in whole calendar days (b - a). Uses UTC to avoid DST discontinuities.
// ---------------------------------------------------------------------------

export function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  const dateA = new Date(`${a}T00:00:00Z`).getTime();
  const dateB = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((dateB - dateA) / msPerDay);
}

// ---------------------------------------------------------------------------
// updateStreak
//
// activityDate: "YYYY-MM-DD" — the calendar date of the completed quest.
//
// Streak rules (PRD §5.2.1):
//   - No prior date        → streak resets to 1 (first ever activity)
//   - Same day             → no change (already counted today)
//   - Exactly +1 day       → streak increments
//   - Gap of 2+ days       → streak resets to 1
//   - longestStreak        → updated whenever streak exceeds it; never decreases
// ---------------------------------------------------------------------------

export function updateStreak(
  player: Player,
  activityDate: string
): UpdateStreakResult {
  const { lastActivityDate, streak, longestStreak = 0 } = player;

  // --- same-day duplicate: nothing changes ---
  if (lastActivityDate === activityDate) {
    return {
      player,
      streakChanged: false,
      isOnARoll: isOnARoll(streak),
    };
  }

  // --- determine new streak value ---
  const gap = lastActivityDate !== undefined
    ? daysBetween(lastActivityDate, activityDate)
    : null;

  const newStreak: number =
    gap === null || gap > 1
      ? 1                   // first activity ever, or missed at least one day
      : streak + 1;         // consecutive next day (gap === 1)

  const newLongestStreak = newStreak > longestStreak ? newStreak : longestStreak;

  const updatedPlayer: Player = {
    ...player,
    streak: newStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: activityDate,
  };

  return {
    player: updatedPlayer,
    streakChanged: true,
    isOnARoll: isOnARoll(newStreak),
  };
}
