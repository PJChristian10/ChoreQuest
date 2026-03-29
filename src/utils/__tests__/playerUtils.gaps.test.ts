import { describe, it, expect } from "vitest";
import { getXpProgress } from "../playerUtils.js";
import { makePlayer } from "../../test/fixtures.js";

describe("getXpProgress — defensive fallback branches", () => {
  it("level 0 input hits the ?? 0 fallback (levelStart) and the range === 0 branch (percent = 0)", () => {
    // LEVEL_XP_THRESHOLDS[0 - 1] = LEVEL_XP_THRESHOLDS[-1] = undefined → levelStart = 0 (?? 0)
    // isMaxLevel = (0 >= 10) = false, so we reach levelEnd calculation
    // LEVEL_XP_THRESHOLDS[0] = 0 → levelEnd = 0
    // range = 0 - 0 = 0 → range > 0 is false → rawPercent = 0 (the `: 0` branch)
    const player = makePlayer({ level: 0, xp: 0 });
    const result = getXpProgress(player);

    expect(result.isMaxLevel).toBe(false);
    expect(result.percent).toBe(0);
    expect(result.levelStart).toBe(0);
    expect(result.levelEnd).toBe(0);
  });

  it("level 10 (max level) returns isMaxLevel true and percent 100 via early return path", () => {
    // isMaxLevel = (10 >= 10) = true → early return with percent: 100, levelEnd === levelStart
    const player = makePlayer({ level: 10, xp: 5000 });
    const result = getXpProgress(player);

    expect(result.isMaxLevel).toBe(true);
    expect(result.percent).toBe(100);
    expect(result.levelEnd).toBe(result.levelStart);
  });
});
