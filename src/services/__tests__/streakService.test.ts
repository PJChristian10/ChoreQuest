import { describe, it, expect } from "vitest";
import { updateStreak, isOnARoll } from "../streakService.js";
import type { Player } from "../../models/player.js";

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Alice",
    xp: 0,
    lifetimeXP: 0,
    coins: 0,
    lifetimeCoins: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    lastActivityDate: undefined,
    badges: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isOnARoll — pure helper
// ---------------------------------------------------------------------------

describe("isOnARoll", () => {
  // Test 1
  it("returns false for streak 0", () => {
    expect(isOnARoll(0)).toBe(false);
  });

  // Test 2
  it("returns false for streak 1", () => {
    expect(isOnARoll(1)).toBe(false);
  });

  // Test 3
  it("returns false for streak 2", () => {
    expect(isOnARoll(2)).toBe(false);
  });

  // Test 4
  it("returns true for streak 3", () => {
    expect(isOnARoll(3)).toBe(true);
  });

  // Test 5
  it("returns true for streak 10", () => {
    expect(isOnARoll(10)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateStreak — first activity (no prior date)
// ---------------------------------------------------------------------------

describe("updateStreak — first activity (no prior lastActivityDate)", () => {
  const player = makePlayer({ streak: 0, longestStreak: 0, lastActivityDate: undefined });

  // Test 6
  it("streak becomes 1 when player has no lastActivityDate", () => {
    const result = updateStreak(player, "2026-03-01");
    expect(result.player.streak).toBe(1);
  });

  // Test 7
  it("lastActivityDate is set to activityDate when no prior date exists", () => {
    const result = updateStreak(player, "2026-03-01");
    expect(result.player.lastActivityDate).toBe("2026-03-01");
  });

  // Test 8
  it("streakChanged is true when no prior lastActivityDate", () => {
    const result = updateStreak(player, "2026-03-01");
    expect(result.streakChanged).toBe(true);
  });

  // Test 9
  it("longestStreak becomes 1 on first activity (was 0)", () => {
    const result = updateStreak(player, "2026-03-01");
    expect(result.player.longestStreak).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// updateStreak — same-day activity (duplicate)
// ---------------------------------------------------------------------------

describe("updateStreak — same-day activity (duplicate)", () => {
  const player = makePlayer({
    streak: 3,
    longestStreak: 5,
    lastActivityDate: "2026-03-10",
  });

  // Test 10
  it("streak is unchanged when activityDate equals lastActivityDate", () => {
    const result = updateStreak(player, "2026-03-10");
    expect(result.player.streak).toBe(3);
  });

  // Test 11
  it("streakChanged is false on same-day duplicate", () => {
    const result = updateStreak(player, "2026-03-10");
    expect(result.streakChanged).toBe(false);
  });

  // Test 12
  it("returned player has same streak, longestStreak, and lastActivityDate on same-day duplicate", () => {
    const result = updateStreak(player, "2026-03-10");
    expect(result.player.streak).toBe(player.streak);
    expect(result.player.longestStreak).toBe(player.longestStreak);
    expect(result.player.lastActivityDate).toBe(player.lastActivityDate);
  });
});

// ---------------------------------------------------------------------------
// updateStreak — next consecutive day
// ---------------------------------------------------------------------------

describe("updateStreak — next consecutive calendar day", () => {
  // Test 13
  it("streak increments by 1 on next calendar day", () => {
    const player = makePlayer({ streak: 2, longestStreak: 3, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.streak).toBe(3);
  });

  // Test 14
  it("lastActivityDate is updated to the new date", () => {
    const player = makePlayer({ streak: 2, longestStreak: 3, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.lastActivityDate).toBe("2026-03-11");
  });

  // Test 15
  it("streakChanged is true on next consecutive day", () => {
    const player = makePlayer({ streak: 2, longestStreak: 3, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.streakChanged).toBe(true);
  });

  // Test 16
  it("streak 2 → next day → streak becomes 3 and isOnARoll is true in result", () => {
    const player = makePlayer({ streak: 2, longestStreak: 2, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.streak).toBe(3);
    expect(result.isOnARoll).toBe(true);
  });

  // Test 17
  it("longestStreak is updated when new streak exceeds it", () => {
    const player = makePlayer({ streak: 2, longestStreak: 2, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.longestStreak).toBe(3);
  });

  // Test 18
  it("when streak already equals longestStreak, next day increments both streak AND longestStreak", () => {
    const player = makePlayer({ streak: 5, longestStreak: 5, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.streak).toBe(6);
    expect(result.player.longestStreak).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// updateStreak — missed day (gap of 2+ days)
// ---------------------------------------------------------------------------

describe("updateStreak — missed day (gap of 2+ days resets streak)", () => {
  // Test 19
  it("gap of 2 days resets streak to 1", () => {
    const player = makePlayer({ streak: 5, longestStreak: 7, lastActivityDate: "2026-03-08" });
    const result = updateStreak(player, "2026-03-10");
    expect(result.player.streak).toBe(1);
  });

  // Test 20
  it("gap of 3 days resets streak to 1", () => {
    const player = makePlayer({ streak: 5, longestStreak: 7, lastActivityDate: "2026-03-07" });
    const result = updateStreak(player, "2026-03-10");
    expect(result.player.streak).toBe(1);
  });

  // Test 21
  it("lastActivityDate is updated to the new date after a gap reset", () => {
    const player = makePlayer({ streak: 5, longestStreak: 7, lastActivityDate: "2026-03-07" });
    const result = updateStreak(player, "2026-03-10");
    expect(result.player.lastActivityDate).toBe("2026-03-10");
  });

  // Test 22
  it("streakChanged is true when streak resets due to a gap", () => {
    const player = makePlayer({ streak: 5, longestStreak: 7, lastActivityDate: "2026-03-07" });
    const result = updateStreak(player, "2026-03-10");
    expect(result.streakChanged).toBe(true);
  });

  // Test 23
  it("longestStreak is NOT decreased when streak resets due to a gap", () => {
    const player = makePlayer({ streak: 5, longestStreak: 7, lastActivityDate: "2026-03-07" });
    const result = updateStreak(player, "2026-03-10");
    expect(result.player.longestStreak).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// updateStreak — longestStreak tracking
// ---------------------------------------------------------------------------

describe("updateStreak — longestStreak tracking", () => {
  // Test 24
  it("longestStreak unchanged when new streak equals existing longestStreak (no double-increment)", () => {
    // streak is 2, longestStreak is 3; after next day streak becomes 3 = longestStreak, not 4
    const player = makePlayer({ streak: 2, longestStreak: 3, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.streak).toBe(3);
    expect(result.player.longestStreak).toBe(3);
  });

  // Test 25
  it("longestStreak is updated to match new streak when new streak exceeds it", () => {
    const player = makePlayer({ streak: 4, longestStreak: 4, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.streak).toBe(5);
    expect(result.player.longestStreak).toBe(5);
  });

  // Test 26 — reset does not decrease longestStreak (mirrors test 23, explicit label)
  it("longestStreak is preserved (not decreased) when streak resets to 1", () => {
    const player = makePlayer({ streak: 10, longestStreak: 10, lastActivityDate: "2026-03-01" });
    const result = updateStreak(player, "2026-03-10"); // 9-day gap
    expect(result.player.streak).toBe(1);
    expect(result.player.longestStreak).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// updateStreak — immutability
// ---------------------------------------------------------------------------

describe("updateStreak — immutability", () => {
  // Test 27
  it("original player object is never mutated", () => {
    const player = makePlayer({ streak: 3, lastActivityDate: "2026-03-10" });
    const streakBefore = player.streak;
    const dateBefore = player.lastActivityDate;
    updateStreak(player, "2026-03-11");
    expect(player.streak).toBe(streakBefore);
    expect(player.lastActivityDate).toBe(dateBefore);
  });

  // Test 28
  it("returned player in result is a new object distinct from the input player", () => {
    const player = makePlayer({ streak: 3, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player).not.toBe(player);
  });
});

// ---------------------------------------------------------------------------
// updateStreak — isOnARoll in result
// ---------------------------------------------------------------------------

describe("updateStreak — isOnARoll in result", () => {
  // Test 29
  it("result.isOnARoll is false when resulting streak is less than 3", () => {
    const player = makePlayer({ streak: 1, longestStreak: 1, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.streak).toBe(2);
    expect(result.isOnARoll).toBe(false);
  });

  // Test 30
  it("result.isOnARoll is true when consecutive increment brings streak to exactly 3", () => {
    const player = makePlayer({ streak: 2, longestStreak: 2, lastActivityDate: "2026-03-10" });
    const result = updateStreak(player, "2026-03-11");
    expect(result.player.streak).toBe(3);
    expect(result.isOnARoll).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateStreak — month/year boundary date arithmetic
// ---------------------------------------------------------------------------

describe("updateStreak — date boundary edge cases", () => {
  it("correctly handles month boundary (March 31 → April 1)", () => {
    const player = makePlayer({ streak: 4, longestStreak: 4, lastActivityDate: "2026-03-31" });
    const result = updateStreak(player, "2026-04-01");
    expect(result.player.streak).toBe(5);
    expect(result.streakChanged).toBe(true);
  });

  it("correctly handles year boundary (Dec 31 → Jan 1)", () => {
    const player = makePlayer({ streak: 6, longestStreak: 6, lastActivityDate: "2025-12-31" });
    const result = updateStreak(player, "2026-01-01");
    expect(result.player.streak).toBe(7);
    expect(result.streakChanged).toBe(true);
  });

  it("gap across month boundary (March 30 → April 1) resets streak", () => {
    const player = makePlayer({ streak: 4, longestStreak: 4, lastActivityDate: "2026-03-30" });
    const result = updateStreak(player, "2026-04-01");
    expect(result.player.streak).toBe(1);
  });
});
