import { describe, it, expect } from "vitest";
import { gameReducer, INITIAL_STATE } from "../reducer.js";
import { makePlayer, makeQuest, makeClaim, makeRedemption, makeGameState, makeActiveSession } from "../../test/fixtures.js";

describe("APPROVE_QUEST — gap branches", () => {
  it("returns unchanged state when the claim's questId is not found in state.quests", () => {
    // Claim references quest-1, but state.quests is empty — quest lookup returns undefined
    const state = makeGameState({
      players: [makePlayer()],
      quests: [],
      claims: [makeClaim({ questId: "quest-1" })],
      parentSession: makeActiveSession(),
    });

    const result = gameReducer(state, {
      type: "APPROVE_QUEST",
      claimId: "claim-1",
      now: new Date(),
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state when the claim's playerId is not found in state.players", () => {
    // Quest exists and is awaiting_approval, claim exists, but no players in state
    const state = makeGameState({
      players: [],
      quests: [makeQuest({ status: "awaiting_approval" })],
      claims: [makeClaim({ questId: "quest-1", playerId: "player-1" })],
      parentSession: makeActiveSession(),
    });

    const result = gameReducer(state, {
      type: "APPROVE_QUEST",
      claimId: "claim-1",
      now: new Date(),
    });

    expect(result).toBe(state);
  });

  it("sets isActive false for a 'bonus' recurrence quest after approval", () => {
    const player = makePlayer({
      coins: 0,
      xp: 0,
      weeklyCoins: 0,
      streak: 0,
      lifetimeXP: 0,
      lifetimeCoins: 0,
      level: 1,
    });
    const quest = makeQuest({
      recurrence: "bonus",
      status: "awaiting_approval",
      xpReward: 10,
      coinReward: 5,
    });
    const claim = makeClaim();
    const state = makeGameState({
      players: [player],
      quests: [quest],
      claims: [claim],
      parentSession: makeActiveSession(),
    });

    const result = gameReducer(state, {
      type: "APPROVE_QUEST",
      claimId: "claim-1",
      now: new Date("2026-03-19T10:00:00Z"),
    });

    const resultQuest = result.quests.find((q) => q.id === "quest-1");
    expect(resultQuest?.isActive).toBe(false);
  });
});

describe("FULFILL_REDEMPTION — gap branches", () => {
  it("returns unchanged state when redemption status is 'cancelled'", () => {
    // The reducer's pre-check only guards against 'fulfilled', not 'cancelled'.
    // fulfillRedemption() throws on 'cancelled' → catch block returns state unchanged.
    const state = makeGameState({
      redemptions: [makeRedemption({ status: "cancelled" })],
      parentSession: makeActiveSession(),
    });

    const result = gameReducer(state, {
      type: "FULFILL_REDEMPTION",
      redemptionId: "redemption-1",
      now: new Date(),
    });

    expect(result).toBe(state);
    expect(result.redemptions[0]?.status).toBe("cancelled");
  });
});

describe("DENY_QUEST — gap branches", () => {
  it("returns unchanged state when the service throws (quest not in awaiting_approval)", () => {
    // Quest status is 'available' (not 'awaiting_approval') → denyQuest throws → catch returns state
    const state = makeGameState({
      players: [makePlayer()],
      quests: [makeQuest({ status: "available" })],
      claims: [makeClaim({ questId: "quest-1", voided: false })],
      parentSession: makeActiveSession(),
    });

    const result = gameReducer(state, {
      type: "DENY_QUEST",
      claimId: "claim-1",
    });

    expect(result).toBe(state);
    expect(result.quests[0]?.status).toBe("available");
    expect(result.claims[0]?.voided).toBe(false);
  });
});

describe("INITIAL_STATE — imported from shared fixtures", () => {
  it("INITIAL_STATE has correct empty structure", () => {
    expect(INITIAL_STATE.players).toEqual([]);
    expect(INITIAL_STATE.quests).toEqual([]);
    expect(INITIAL_STATE.claims).toEqual([]);
    expect(INITIAL_STATE.redemptions).toEqual([]);
    expect(INITIAL_STATE.parentConfig).toBeNull();
    expect(INITIAL_STATE.parentSession).toBeNull();
  });
});
