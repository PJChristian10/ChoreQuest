import { describe, it, expect } from "vitest";
import { gameReducer } from "../reducer.js";
import {
  makeGameState,
  makePlayer,
  makeQuest,
  makeClaim,
  makeRedemption,
  makeActiveSession,
  makeExpiredSession,
  makeParentConfig,
} from "../../test/fixtures.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stateWithNoSession() {
  return makeGameState({ parentSession: null });
}

function stateWithExpiredSession() {
  return makeGameState({ parentSession: makeExpiredSession() });
}

function stateWithActiveSession() {
  return makeGameState({ parentSession: makeActiveSession() });
}

// ---------------------------------------------------------------------------
// APPROVE_QUEST session guard tests
// ---------------------------------------------------------------------------

describe("reducer session guard — APPROVE_QUEST", () => {
  it("returns unchanged state when parentSession is null", () => {
    const player = makePlayer({ id: "p1" });
    const quest = makeQuest({ id: "q1", status: "awaiting_approval" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = {
      ...stateWithNoSession(),
      players: [player],
      quests: [quest],
      claims: [claim],
    };

    const result = gameReducer(state, {
      type: "APPROVE_QUEST",
      claimId: "c1",
      now: new Date(),
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state when parentSession is expired", () => {
    const player = makePlayer({ id: "p1" });
    const quest = makeQuest({ id: "q1", status: "awaiting_approval" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = {
      ...stateWithExpiredSession(),
      players: [player],
      quests: [quest],
      claims: [claim],
    };

    const result = gameReducer(state, {
      type: "APPROVE_QUEST",
      claimId: "c1",
      now: new Date(),
    });

    expect(result).toBe(state);
  });

  it("executes normally when parentSession is active", () => {
    const player = makePlayer({ id: "p1" });
    const quest = makeQuest({ id: "q1", status: "awaiting_approval" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = {
      ...stateWithActiveSession(),
      players: [player],
      quests: [quest],
      claims: [claim],
    };

    const result = gameReducer(state, {
      type: "APPROVE_QUEST",
      claimId: "c1",
      now: new Date(),
    });

    // Should have changed (quest approved, player rewarded)
    expect(result).not.toBe(state);
    // Player should have updated XP/coins
    const resultPlayer = result.players.find((p) => p.id === "p1");
    expect(resultPlayer?.xp).toBeGreaterThan(player.xp);
  });
});

// ---------------------------------------------------------------------------
// DENY_QUEST session guard tests
// ---------------------------------------------------------------------------

describe("reducer session guard — DENY_QUEST", () => {
  it("returns unchanged state when parentSession is null", () => {
    const quest = makeQuest({ id: "q1", status: "awaiting_approval" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = {
      ...stateWithNoSession(),
      quests: [quest],
      claims: [claim],
    };

    const result = gameReducer(state, {
      type: "DENY_QUEST",
      claimId: "c1",
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state when parentSession is expired", () => {
    const quest = makeQuest({ id: "q1", status: "awaiting_approval" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = {
      ...stateWithExpiredSession(),
      quests: [quest],
      claims: [claim],
    };

    const result = gameReducer(state, {
      type: "DENY_QUEST",
      claimId: "c1",
    });

    expect(result).toBe(state);
  });

  it("executes normally when parentSession is active", () => {
    const quest = makeQuest({ id: "q1", status: "awaiting_approval" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = {
      ...stateWithActiveSession(),
      quests: [quest],
      claims: [claim],
    };

    const result = gameReducer(state, {
      type: "DENY_QUEST",
      claimId: "c1",
    });

    // Should have changed (quest denied)
    expect(result).not.toBe(state);
    const resultQuest = result.quests.find((q) => q.id === "q1");
    expect(resultQuest?.status).toBe("available");
  });
});

// ---------------------------------------------------------------------------
// FULFILL_REDEMPTION session guard tests
// ---------------------------------------------------------------------------

describe("reducer session guard — FULFILL_REDEMPTION", () => {
  it("returns unchanged state when parentSession is null", () => {
    const redemption = makeRedemption({ id: "r1", status: "pending" });
    const state = {
      ...stateWithNoSession(),
      redemptions: [redemption],
    };

    const result = gameReducer(state, {
      type: "FULFILL_REDEMPTION",
      redemptionId: "r1",
      now: new Date(),
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state when parentSession is expired", () => {
    const redemption = makeRedemption({ id: "r1", status: "pending" });
    const state = {
      ...stateWithExpiredSession(),
      redemptions: [redemption],
    };

    const result = gameReducer(state, {
      type: "FULFILL_REDEMPTION",
      redemptionId: "r1",
      now: new Date(),
    });

    expect(result).toBe(state);
  });

  it("executes normally when parentSession is active", () => {
    const redemption = makeRedemption({ id: "r1", status: "pending" });
    const state = {
      ...stateWithActiveSession(),
      redemptions: [redemption],
    };

    const result = gameReducer(state, {
      type: "FULFILL_REDEMPTION",
      redemptionId: "r1",
      now: new Date(),
    });

    // Should have changed (redemption fulfilled)
    expect(result).not.toBe(state);
    const resultRedemption = result.redemptions.find((r) => r.id === "r1");
    expect(resultRedemption?.status).toBe("fulfilled");
  });
});

// ---------------------------------------------------------------------------
// SET_PARENT_CONFIG session guard tests
// ---------------------------------------------------------------------------

describe("reducer session guard — SET_PARENT_CONFIG", () => {
  it("returns unchanged state when parentSession is null (re-configuration)", () => {
    // parentConfig already set → guard fires
    const existingConfig = makeParentConfig({ hashedPin: "oldhash" });
    const state = { ...stateWithNoSession(), parentConfig: existingConfig };
    const newConfig = makeParentConfig({ hashedPin: "newhash" });

    const result = gameReducer(state, {
      type: "SET_PARENT_CONFIG",
      config: newConfig,
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state when parentSession is expired (re-configuration)", () => {
    // parentConfig already set → guard fires
    const existingConfig = makeParentConfig({ hashedPin: "oldhash" });
    const state = { ...stateWithExpiredSession(), parentConfig: existingConfig };
    const newConfig = makeParentConfig({ hashedPin: "newhash" });

    const result = gameReducer(state, {
      type: "SET_PARENT_CONFIG",
      config: newConfig,
    });

    expect(result).toBe(state);
  });

  it("executes normally when parentSession is active (re-configuration)", () => {
    const existingConfig = makeParentConfig({ hashedPin: "oldhash" });
    const state = { ...stateWithActiveSession(), parentConfig: existingConfig };
    const newConfig = makeParentConfig({ hashedPin: "newhash" });

    const result = gameReducer(state, {
      type: "SET_PARENT_CONFIG",
      config: newConfig,
    });

    expect(result).not.toBe(state);
    expect(result.parentConfig?.hashedPin).toBe("newhash");
  });

  it("allows initial setup (parentConfig is null) without a session", () => {
    // First-time setup: no parentConfig yet, no session needed
    const state = stateWithNoSession();
    const config = makeParentConfig({ hashedPin: "firsthash" });

    const result = gameReducer(state, {
      type: "SET_PARENT_CONFIG",
      config,
    });

    expect(result).not.toBe(state);
    expect(result.parentConfig?.hashedPin).toBe("firsthash");
  });
});
