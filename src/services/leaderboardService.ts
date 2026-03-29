import type { Player } from "../models/player.js";

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  readonly player: Player;
  readonly rank: number;
  readonly rankBadge: "crown" | "silver" | "bronze" | null;
  readonly weeklyCoins: number;
}

export interface RankPlayersResult {
  readonly entries: readonly LeaderboardEntry[];
}

export interface ResetWeeklyResult {
  readonly players: readonly Player[];
  readonly winners: readonly Player[];
  readonly bonusAwarded: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rankBadgeForRank(rank: number): "crown" | "silver" | "bronze" | null {
  if (rank === 1) return "crown";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return null;
}

/**
 * Assigns standard competition ranks (1, 2, 2, 4 — not dense 1, 2, 2, 3)
 * to a list of players sorted by weeklyCoins descending.
 *
 * Tied players receive the same rank. The next distinct rank is the position
 * after all tied players (i.e. skip ranks equal to the size of each tie group).
 */
function assignRanks(
  sorted: readonly Player[]
): readonly { player: Player; rank: number }[] {
  const result: { player: Player; rank: number }[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i]!;
    // On the first element of a new group, set currentRank to position (i + 1)
    if (i > 0 && sorted[i - 1]!.weeklyCoins !== player.weeklyCoins) {
      currentRank = i + 1;
    }
    result.push({ player, rank: currentRank });
  }

  return result;
}

// ---------------------------------------------------------------------------
// rankPlayers
// ---------------------------------------------------------------------------

export function rankPlayers(players: readonly Player[]): RankPlayersResult {
  const sorted = [...players].sort((a, b) => b.weeklyCoins - a.weeklyCoins);
  const ranked = assignRanks(sorted);

  const entries: LeaderboardEntry[] = ranked.map(({ player, rank }) => ({
    player,
    rank,
    rankBadge: rankBadgeForRank(rank),
    weeklyCoins: player.weeklyCoins,
  }));

  return { entries };
}

// ---------------------------------------------------------------------------
// resetWeekly
// ---------------------------------------------------------------------------

export function resetWeekly(
  players: readonly Player[],
  bonusAmount: number
): ResetWeeklyResult {
  if (players.length === 0) {
    return { players: [], winners: [], bonusAwarded: 0 };
  }

  const maxWeeklyCoins = Math.max(...players.map((p) => p.weeklyCoins));
  const hasActivity = maxWeeklyCoins > 0;

  // Identify winners (original references, before any mutation)
  const winners: Player[] = hasActivity
    ? players.filter((p) => p.weeklyCoins === maxWeeklyCoins)
    : [];

  const winnerIds = new Set(winners.map((w) => w.id));

  // Build updated players: award bonus to winners, reset weeklyCoins for all
  const updatedPlayers: Player[] = players.map((player) => {
    const isWinner = winnerIds.has(player.id);
    const bonusToApply = isWinner && hasActivity ? bonusAmount : 0;

    return {
      ...player,
      coins: player.coins + bonusToApply,
      lifetimeCoins: player.lifetimeCoins + bonusToApply,
      weeklyCoins: 0,
    };
  });

  const bonusAwarded = hasActivity ? bonusAmount : 0;

  return { players: updatedPlayers, winners, bonusAwarded };
}
