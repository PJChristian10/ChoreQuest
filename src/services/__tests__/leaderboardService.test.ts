import { describe, it, expect } from "vitest";
import {
  rankPlayers,
  resetWeekly,
} from "../leaderboardService.js";
import type { Player } from "../../models/player.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Alice",
    xp: 0,
    lifetimeXP: 0,
    coins: 0,
    lifetimeCoins: 0,
    weeklyCoins: 0,
    level: 1,
    streak: 0,
    badges: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// rankPlayers
// ---------------------------------------------------------------------------

describe("rankPlayers", () => {
  // Test 1: Empty array → returns empty entries
  it("returns empty entries for an empty player array", () => {
    const result = rankPlayers([]);
    expect(result.entries).toHaveLength(0);
  });

  // Test 2: Single player → rank 1, rankBadge "crown"
  it("single player gets rank 1 and crown badge", () => {
    const player = makePlayer({ id: "p1", weeklyCoins: 10 });
    const result = rankPlayers([player]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.rank).toBe(1);
    expect(result.entries[0]!.rankBadge).toBe("crown");
  });

  // Test 3: Two players, higher weeklyCoins ranked first
  it("ranks player with more weekly coins first", () => {
    const alice = makePlayer({ id: "alice", name: "Alice", weeklyCoins: 30 });
    const bob = makePlayer({ id: "bob", name: "Bob", weeklyCoins: 10 });
    const result = rankPlayers([bob, alice]); // deliberately reversed
    expect(result.entries[0]!.player.id).toBe("alice");
    expect(result.entries[0]!.rank).toBe(1);
    expect(result.entries[1]!.player.id).toBe("bob");
    expect(result.entries[1]!.rank).toBe(2);
  });

  // Test 4: Three players → ranks 1, 2, 3 with badges crown/silver/bronze
  it("assigns crown/silver/bronze to ranks 1/2/3", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 50 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 30 });
    const p3 = makePlayer({ id: "p3", weeklyCoins: 10 });
    const result = rankPlayers([p1, p2, p3]);
    const entries = result.entries;
    expect(entries[0]!.rankBadge).toBe("crown");
    expect(entries[1]!.rankBadge).toBe("silver");
    expect(entries[2]!.rankBadge).toBe("bronze");
  });

  // Test 5: Four players → 4th player has rankBadge null
  it("4th-ranked player has null rankBadge", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 40 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 30 });
    const p3 = makePlayer({ id: "p3", weeklyCoins: 20 });
    const p4 = makePlayer({ id: "p4", weeklyCoins: 10 });
    const result = rankPlayers([p1, p2, p3, p4]);
    expect(result.entries[3]!.rank).toBe(4);
    expect(result.entries[3]!.rankBadge).toBeNull();
  });

  // Test 6: TIE for 1st: two players same weeklyCoins → both get rank 1 and "crown"
  it("two players tied for 1st both get rank 1 and crown badge", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 20 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 20 });
    const result = rankPlayers([p1, p2]);
    expect(result.entries[0]!.rank).toBe(1);
    expect(result.entries[0]!.rankBadge).toBe("crown");
    expect(result.entries[1]!.rank).toBe(1);
    expect(result.entries[1]!.rankBadge).toBe("crown");
  });

  // Test 7: TIE for 1st with 3 players: two tied at top, third gets rank 3 (not rank 2), bronze
  it("third player after a two-way tie for 1st gets rank 3 and bronze", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 50 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 50 });
    const p3 = makePlayer({ id: "p3", weeklyCoins: 10 });
    const result = rankPlayers([p1, p2, p3]);
    const thirdEntry = result.entries.find((e) => e.player.id === "p3")!;
    expect(thirdEntry.rank).toBe(3);
    expect(thirdEntry.rankBadge).toBe("bronze");
  });

  // Test 8: TIE for 2nd: ranks are 1, 2, 2, 4 (not 1, 2, 2, 3) — dense ranking NOT used
  it("fourth player after a two-way tie for 2nd gets rank 4, not rank 3", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 100 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 50 });
    const p3 = makePlayer({ id: "p3", weeklyCoins: 50 });
    const p4 = makePlayer({ id: "p4", weeklyCoins: 10 });
    const result = rankPlayers([p1, p2, p3, p4]);
    const fourthEntry = result.entries.find((e) => e.player.id === "p4")!;
    expect(fourthEntry.rank).toBe(4);
    expect(fourthEntry.rankBadge).toBeNull();
    // Verify the tied players
    const tiedEntries = result.entries.filter((e) => e.player.id === "p2" || e.player.id === "p3");
    expect(tiedEntries).toHaveLength(2);
    tiedEntries.forEach((e) => expect(e.rank).toBe(2));
  });

  // Test 9: All players weeklyCoins === 0 → all tied at rank 1 with "crown"
  it("all players with 0 weeklyCoins are all tied at rank 1 with crown", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 0 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 0 });
    const p3 = makePlayer({ id: "p3", weeklyCoins: 0 });
    const result = rankPlayers([p1, p2, p3]);
    result.entries.forEach((e) => {
      expect(e.rank).toBe(1);
      expect(e.rankBadge).toBe("crown");
    });
  });

  // Test 10: rankBadge is null for rank 4 even with no ties
  it("rank 4 entry has null rankBadge when there are no ties", () => {
    const players = [
      makePlayer({ id: "p1", weeklyCoins: 80 }),
      makePlayer({ id: "p2", weeklyCoins: 60 }),
      makePlayer({ id: "p3", weeklyCoins: 40 }),
      makePlayer({ id: "p4", weeklyCoins: 20 }),
    ];
    const result = rankPlayers(players);
    const rank4 = result.entries.find((e) => e.rank === 4)!;
    expect(rank4.rankBadge).toBeNull();
  });

  // Test 11: Players array is sorted by rank ascending in result
  it("result entries are sorted by rank ascending", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 5 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 20 });
    const p3 = makePlayer({ id: "p3", weeklyCoins: 15 });
    const result = rankPlayers([p1, p2, p3]);
    const ranks = result.entries.map((e) => e.rank);
    expect(ranks[0]!).toBeLessThanOrEqual(ranks[1]!);
    expect(ranks[1]!).toBeLessThanOrEqual(ranks[2]!);
    expect(result.entries[0]!.player.id).toBe("p2");
  });

  // Test 12: Original player objects are not mutated
  it("does not mutate input player objects", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 20 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 10 });
    const originalCoins1 = p1.weeklyCoins;
    const originalCoins2 = p2.weeklyCoins;
    rankPlayers([p1, p2]);
    expect(p1.weeklyCoins).toBe(originalCoins1);
    expect(p2.weeklyCoins).toBe(originalCoins2);
  });

  // Verify weeklyCoins is carried through to the entry
  it("entry weeklyCoins matches the player's weeklyCoins", () => {
    const player = makePlayer({ id: "p1", weeklyCoins: 42 });
    const result = rankPlayers([player]);
    expect(result.entries[0]!.weeklyCoins).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// resetWeekly
// ---------------------------------------------------------------------------

describe("resetWeekly", () => {
  // Test 13: All players' weeklyCoins reset to 0
  it("resets all players weeklyCoins to 0", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 50 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 30 });
    const result = resetWeekly([p1, p2], 0);
    result.players.forEach((p) => expect(p.weeklyCoins).toBe(0));
  });

  // Test 14: players' spendable coins NOT affected by reset (only winner gets bonus)
  it("non-winner spendable coins are not affected by the reset", () => {
    const winner = makePlayer({ id: "winner", weeklyCoins: 50, coins: 100 });
    const loser = makePlayer({ id: "loser", weeklyCoins: 10, coins: 200 });
    const result = resetWeekly([winner, loser], 25);
    const loserAfter = result.players.find((p) => p.id === "loser")!;
    expect(loserAfter.coins).toBe(200);
  });

  // Test 15: players' lifetimeCoins NOT affected by reset (only winner gets bonus)
  it("non-winner lifetimeCoins is not affected by the reset", () => {
    const winner = makePlayer({ id: "winner", weeklyCoins: 50, lifetimeCoins: 500 });
    const loser = makePlayer({ id: "loser", weeklyCoins: 10, lifetimeCoins: 300 });
    const result = resetWeekly([winner, loser], 25);
    const loserAfter = result.players.find((p) => p.id === "loser")!;
    expect(loserAfter.lifetimeCoins).toBe(300);
  });

  // Test 16: Single player: wins bonus, coins += bonusAmount, lifetimeCoins += bonusAmount
  it("single player wins the bonus and receives coins and lifetimeCoins", () => {
    const player = makePlayer({ id: "p1", weeklyCoins: 40, coins: 10, lifetimeCoins: 100 });
    const result = resetWeekly([player], 50);
    const updated = result.players.find((p) => p.id === "p1")!;
    expect(updated.coins).toBe(60);          // 10 + 50
    expect(updated.lifetimeCoins).toBe(150); // 100 + 50
    expect(updated.weeklyCoins).toBe(0);     // reset
  });

  // Test 17: Winner identified correctly (highest weeklyCoins before reset)
  it("correctly identifies the winner as the player with highest weeklyCoins", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 10 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 80 });
    const p3 = makePlayer({ id: "p3", weeklyCoins: 40 });
    const result = resetWeekly([p1, p2, p3], 20);
    expect(result.winners).toHaveLength(1);
    expect(result.winners[0]!.id).toBe("p2");
  });

  // Test 18: Bonus is 0: no coins change, reset still happens
  it("when bonusAmount is 0, no coins change but weeklyCoins still resets", () => {
    const player = makePlayer({ id: "p1", weeklyCoins: 30, coins: 50, lifetimeCoins: 200 });
    const result = resetWeekly([player], 0);
    const updated = result.players.find((p) => p.id === "p1")!;
    expect(updated.coins).toBe(50);
    expect(updated.lifetimeCoins).toBe(200);
    expect(updated.weeklyCoins).toBe(0);
  });

  // Test 19: TIE for first: ALL tied players receive the bonus coins
  it("all tied-for-first players receive the bonus coins", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 50, coins: 0, lifetimeCoins: 0 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 50, coins: 0, lifetimeCoins: 0 });
    const p3 = makePlayer({ id: "p3", weeklyCoins: 20, coins: 0, lifetimeCoins: 0 });
    const result = resetWeekly([p1, p2, p3], 30);
    const updated1 = result.players.find((p) => p.id === "p1")!;
    const updated2 = result.players.find((p) => p.id === "p2")!;
    expect(updated1.coins).toBe(30);
    expect(updated2.coins).toBe(30);
  });

  // Test 20: TIE for first: each tied winner's coins += bonusAmount independently
  it("each tied winner's coins increase by bonusAmount independently", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 50, coins: 100, lifetimeCoins: 500 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 50, coins: 200, lifetimeCoins: 800 });
    const result = resetWeekly([p1, p2], 40);
    const updated1 = result.players.find((p) => p.id === "p1")!;
    const updated2 = result.players.find((p) => p.id === "p2")!;
    expect(updated1.coins).toBe(140);          // 100 + 40
    expect(updated1.lifetimeCoins).toBe(540);  // 500 + 40
    expect(updated2.coins).toBe(240);          // 200 + 40
    expect(updated2.lifetimeCoins).toBe(840);  // 800 + 40
  });

  // Test 21: No activity (all weeklyCoins === 0): no bonus awarded, bonusAwarded === 0
  it("when all players have 0 weeklyCoins no bonus is awarded and bonusAwarded is 0", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 0, coins: 50 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 0, coins: 80 });
    const result = resetWeekly([p1, p2], 100);
    expect(result.bonusAwarded).toBe(0);
    result.players.forEach((p) => {
      expect(p.coins).toBe(p.id === "p1" ? 50 : 80);
    });
  });

  // Test 22: result.winners contains the correct winning player(s) (pre-bonus identity)
  it("result.winners contains the original player reference(s) before bonus/reset", () => {
    const winner = makePlayer({ id: "winner", weeklyCoins: 100 });
    const loser = makePlayer({ id: "loser", weeklyCoins: 20 });
    const result = resetWeekly([winner, loser], 10);
    expect(result.winners).toHaveLength(1);
    expect(result.winners[0]!.id).toBe("winner");
    // winners reflects pre-bonus state (original weeklyCoins)
    expect(result.winners[0]!.weeklyCoins).toBe(100);
  });

  // Test 23: result.bonusAwarded reflects actual bonus paid (0 when no activity)
  it("bonusAwarded equals bonusAmount when there is activity", () => {
    const player = makePlayer({ id: "p1", weeklyCoins: 20 });
    const result = resetWeekly([player], 75);
    expect(result.bonusAwarded).toBe(75);
  });

  it("bonusAwarded is 0 when all players have 0 weeklyCoins", () => {
    const player = makePlayer({ id: "p1", weeklyCoins: 0 });
    const result = resetWeekly([player], 75);
    expect(result.bonusAwarded).toBe(0);
  });

  // Test 24: All other player fields preserved after reset (streak, xp, level, etc.)
  it("preserves all non-coin player fields after reset", () => {
    const player = makePlayer({
      id: "p1",
      name: "Charlie",
      xp: 500,
      lifetimeXP: 1200,
      weeklyCoins: 30,
      coins: 50,
      lifetimeCoins: 300,
      level: 4,
      streak: 7,
      longestStreak: 14,
      lastActivityDate: "2026-03-15",
      badges: [{ id: "b1", name: "First Quest", awardedAt: new Date() }],
    });
    const result = resetWeekly([player], 0);
    const updated = result.players.find((p) => p.id === "p1")!;
    expect(updated.name).toBe("Charlie");
    expect(updated.xp).toBe(500);
    expect(updated.lifetimeXP).toBe(1200);
    expect(updated.level).toBe(4);
    expect(updated.streak).toBe(7);
    expect(updated.longestStreak).toBe(14);
    expect(updated.lastActivityDate).toBe("2026-03-15");
    expect(updated.badges).toHaveLength(1);
  });

  // Test 25: Original player array is not mutated
  it("does not mutate the original player array or player objects", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 50, coins: 10 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 20, coins: 5 });
    const originalPlayers = [p1, p2];
    resetWeekly(originalPlayers, 30);
    expect(p1.weeklyCoins).toBe(50);
    expect(p1.coins).toBe(10);
    expect(p2.weeklyCoins).toBe(20);
    expect(p2.coins).toBe(5);
    expect(originalPlayers).toHaveLength(2);
  });

  // Test 26: Three players, clear winner: non-winners coins unchanged
  it("non-winners coins are unchanged when there is a clear winner", () => {
    const winner = makePlayer({ id: "winner", weeklyCoins: 100, coins: 0, lifetimeCoins: 0 });
    const second = makePlayer({ id: "second", weeklyCoins: 60, coins: 40, lifetimeCoins: 200 });
    const third = makePlayer({ id: "third", weeklyCoins: 20, coins: 80, lifetimeCoins: 400 });
    const result = resetWeekly([winner, second, third], 50);
    const updatedSecond = result.players.find((p) => p.id === "second")!;
    const updatedThird = result.players.find((p) => p.id === "third")!;
    expect(updatedSecond.coins).toBe(40);
    expect(updatedThird.coins).toBe(80);
  });

  // Test 27: Winner receives bonus THEN weeklyCoins resets to 0 (not bonus amount)
  it("winner weeklyCoins resets to 0 after receiving bonus (not set to bonus amount)", () => {
    const player = makePlayer({ id: "p1", weeklyCoins: 60, coins: 10, lifetimeCoins: 50 });
    const result = resetWeekly([player], 25);
    const updated = result.players.find((p) => p.id === "p1")!;
    expect(updated.weeklyCoins).toBe(0);  // reset, not 25
    expect(updated.coins).toBe(35);       // 10 + 25 bonus
    expect(updated.lifetimeCoins).toBe(75); // 50 + 25 bonus
  });

  // Test 28: Non-winner weeklyCoins resets to 0, coins unchanged
  it("non-winner weeklyCoins resets to 0 and coins are unchanged", () => {
    const winner = makePlayer({ id: "winner", weeklyCoins: 80, coins: 0 });
    const loser = makePlayer({ id: "loser", weeklyCoins: 30, coins: 55 });
    const result = resetWeekly([winner, loser], 20);
    const updatedLoser = result.players.find((p) => p.id === "loser")!;
    expect(updatedLoser.weeklyCoins).toBe(0);
    expect(updatedLoser.coins).toBe(55);
  });

  // Edge case: empty player array
  it("handles empty player array gracefully", () => {
    const result = resetWeekly([], 100);
    expect(result.players).toHaveLength(0);
    expect(result.winners).toHaveLength(0);
    expect(result.bonusAwarded).toBe(0);
  });

  // Edge case: bonusAmount of 0 with a winner — winners still identified but no coins change
  it("identifies winners even when bonusAmount is 0", () => {
    const p1 = makePlayer({ id: "p1", weeklyCoins: 40 });
    const p2 = makePlayer({ id: "p2", weeklyCoins: 10 });
    const result = resetWeekly([p1, p2], 0);
    expect(result.winners).toHaveLength(1);
    expect(result.winners[0]!.id).toBe("p1");
    expect(result.bonusAwarded).toBe(0);
  });
});
