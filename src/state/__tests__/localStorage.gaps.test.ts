// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { saveState, loadState } from "../localStorage.js";
import { makeGameState, makeReward, makeRedemption, makeQuest } from "../../test/fixtures.js";

beforeEach(() => {
  localStorage.clear();
});

describe("localStorage — optional Date revival branches", () => {
  it("round-trips a reward with expiresAt as a Date", () => {
    const expiresAt = new Date("2026-12-31T00:00:00.000Z");
    const state = makeGameState({
      rewards: [makeReward({ expiresAt })],
    });

    saveState(state);
    const loaded = loadState();

    expect(loaded).not.toBeNull();
    const revivedExpiresAt = loaded!.rewards[0]!.expiresAt;
    expect(revivedExpiresAt).toBeInstanceOf(Date);
    expect((revivedExpiresAt as Date).toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it("round-trips a redemption with fulfilledAt as a Date", () => {
    const fulfilledAt = new Date("2026-03-19T12:00:00.000Z");
    const state = makeGameState({
      redemptions: [makeRedemption({ status: "fulfilled", fulfilledAt })],
    });

    saveState(state);
    const loaded = loadState();

    expect(loaded).not.toBeNull();
    const revivedFulfilledAt = loaded!.redemptions[0]!.fulfilledAt;
    expect(revivedFulfilledAt).toBeInstanceOf(Date);
    expect((revivedFulfilledAt as Date).toISOString()).toBe("2026-03-19T12:00:00.000Z");
  });

  it("round-trips a quest with createdAt as a Date", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const state = makeGameState({
      quests: [makeQuest({ createdAt })],
    });

    saveState(state);
    const loaded = loadState();

    expect(loaded).not.toBeNull();
    const revivedCreatedAt = loaded!.quests[0]!.createdAt;
    expect(revivedCreatedAt).toBeInstanceOf(Date);
    expect((revivedCreatedAt as Date).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("round-trips a reward without expiresAt — expiresAt stays undefined (false branch)", () => {
    // makeReward() has no expiresAt — covers the `: undefined` false branch on line 90
    const state = makeGameState({
      rewards: [makeReward()],
    });

    saveState(state);
    const loaded = loadState();

    expect(loaded).not.toBeNull();
    expect(loaded!.rewards[0]!.expiresAt).toBeUndefined();
  });

  it("round-trips a redemption without fulfilledAt — fulfilledAt stays undefined (false branch)", () => {
    // makeRedemption() with status 'pending' has no fulfilledAt — covers the `: undefined` false branch
    const state = makeGameState({
      redemptions: [makeRedemption({ status: "pending" })],
    });

    saveState(state);
    const loaded = loadState();

    expect(loaded).not.toBeNull();
    expect(loaded!.redemptions[0]!.fulfilledAt).toBeUndefined();
  });
});
