import { describe, it, expect } from "vitest";
import { getLevelTitle, getXpProgress } from "../playerUtils.js";
import type { Player } from "../../models/player.js";

const ALEX: Player = {
  id: "p1",
  name: "Alex",
  xp: 350,
  lifetimeXP: 350,
  coins: 75,
  lifetimeCoins: 90,
  weeklyCoins: 45,
  level: 3,
  streak: 5,
  longestStreak: 12,
  lastActivityDate: "2026-03-18",
  badges: [],
};

describe("getLevelTitle", () => {
  it("returns Apprentice for level 1", () => {
    expect(getLevelTitle(1)).toBe("Apprentice");
  });

  it("returns Knight for level 5", () => {
    expect(getLevelTitle(5)).toBe("Knight");
  });

  it("returns Grand Master for level 10", () => {
    expect(getLevelTitle(10)).toBe("Grand Master");
  });

  it("clamps level 0 to Apprentice", () => {
    expect(getLevelTitle(0)).toBe("Apprentice");
  });

  it("clamps level 11 to Grand Master", () => {
    expect(getLevelTitle(11)).toBe("Grand Master");
  });
});

describe("getXpProgress", () => {
  it("returns correct progress for ALEX at level 3 with xp=350", () => {
    const progress = getXpProgress(ALEX);
    expect(progress.levelStart).toBe(250);
    expect(progress.levelEnd).toBe(500);
    expect(progress.current).toBe(350);
    // (350 - 250) / (500 - 250) * 100 = 100/250*100 = 40
    expect(progress.percent).toBe(40);
    expect(progress.isMaxLevel).toBe(false);
  });

  it("returns percent=0 when xp is at exact threshold start (level 3, xp=250)", () => {
    const player: Player = { ...ALEX, xp: 250, level: 3 };
    const progress = getXpProgress(player);
    expect(progress.percent).toBe(0);
    expect(progress.levelStart).toBe(250);
    expect(progress.levelEnd).toBe(500);
  });

  it("returns isMaxLevel=true and percent=100 at max level (level=10, xp=5200)", () => {
    const player: Player = { ...ALEX, xp: 5200, level: 10 };
    const progress = getXpProgress(player);
    expect(progress.isMaxLevel).toBe(true);
    expect(progress.percent).toBe(100);
  });

  it("returns correct progress for level 1 player (level=1, xp=50)", () => {
    const player: Player = { ...ALEX, xp: 50, level: 1 };
    const progress = getXpProgress(player);
    expect(progress.levelStart).toBe(0);
    expect(progress.levelEnd).toBe(100);
    expect(progress.percent).toBe(50);
    expect(progress.isMaxLevel).toBe(false);
  });
});
