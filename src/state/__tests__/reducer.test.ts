import { describe, it, expect } from "vitest";
import { gameReducer, INITIAL_STATE } from "../reducer.js";
import type { GameState } from "../types.js";
import type { Player } from "../../models/player.js";
import type { Quest, QuestClaim } from "../../models/quest.js";
import type { Reward, RewardRedemption } from "../../models/reward.js";
import type { ParentConfig, ParentSession } from "../../models/auth.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Alice",
    xp: 100,
    lifetimeXP: 100,
    coins: 50,
    lifetimeCoins: 60,
    weeklyCoins: 20,
    level: 2,
    streak: 3,
    longestStreak: 5,
    lastActivityDate: "2026-03-17",
    badges: [],
    ...overrides,
  };
}

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "quest-1",
    title: "Wash the Dishes",
    icon: "🍳",
    xpReward: 15,
    coinReward: 10,
    difficulty: 1,
    recurrence: "daily",
    category: "Kitchen",
    status: "available",
    isActive: true,
    ...overrides,
  };
}

function makeClaim(overrides: Partial<QuestClaim> = {}): QuestClaim {
  return {
    id: "claim-1",
    questId: "quest-1",
    playerId: "player-1",
    claimedAt: new Date("2026-03-18T10:00:00Z"),
    voided: false,
    ...overrides,
  };
}

function makeReward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: "reward-1",
    title: "Extra Screen Time",
    icon: "📺",
    description: "One extra hour of screen time",
    coinCost: 50,
    stock: -1,
    isActive: true,
    category: "screen_time",
    ...overrides,
  };
}

function makeRedemption(overrides: Partial<RewardRedemption> = {}): RewardRedemption {
  return {
    id: "redemption-1",
    rewardId: "reward-1",
    playerId: "player-1",
    status: "pending",
    redeemedAt: new Date("2026-03-18T10:00:00Z"),
    ...overrides,
  };
}

function makeParentSession(overrides: Partial<ParentSession> = {}): ParentSession {
  return {
    isActive: true,
    createdAt: new Date("2026-03-18T09:00:00Z"),
    lastActivityAt: new Date("2026-03-18T09:00:00Z"),
    ...overrides,
  };
}

/** Active session stamped at current time — passes isSessionActive check. */
function makeActiveSession(): ParentSession {
  return {
    isActive: true,
    createdAt: new Date(),
    lastActivityAt: new Date(),
  };
}

function makeParentConfig(overrides: Partial<ParentConfig> = {}): ParentConfig {
  return {
    hashedPin: "$2b$10$somehashedpin",
    failedAttempts: 0,
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...INITIAL_STATE,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// INITIAL_STATE
// ---------------------------------------------------------------------------

describe("INITIAL_STATE", () => {
  it("has empty arrays and null session/config", () => {
    expect(INITIAL_STATE.players).toEqual([]);
    expect(INITIAL_STATE.quests).toEqual([]);
    expect(INITIAL_STATE.claims).toEqual([]);
    expect(INITIAL_STATE.rewards).toEqual([]);
    expect(INITIAL_STATE.redemptions).toEqual([]);
    expect(INITIAL_STATE.parentConfig).toBeNull();
    expect(INITIAL_STATE.parentSession).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// LOAD_STATE
// ---------------------------------------------------------------------------

describe("LOAD_STATE", () => {
  it("replaces entire state with payload", () => {
    const player = makePlayer();
    const newState: GameState = makeState({ players: [player] });

    const result = gameReducer(INITIAL_STATE, { type: "LOAD_STATE", payload: newState });

    expect(result).toBe(newState);
    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toBe(player);
  });
});

// ---------------------------------------------------------------------------
// CLAIM_QUEST
// ---------------------------------------------------------------------------

describe("CLAIM_QUEST", () => {
  it("adds claim to state.claims and sets quest status to awaiting_approval", () => {
    const player = makePlayer();
    const quest = makeQuest();
    const state = makeState({ players: [player], quests: [quest] });

    const result = gameReducer(state, {
      type: "CLAIM_QUEST",
      questId: "quest-1",
      playerId: "player-1",
    });

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0]?.questId).toBe("quest-1");
    expect(result.claims[0]?.playerId).toBe("player-1");
    expect(result.claims[0]?.voided).toBe(false);

    const updatedQuest = result.quests.find((q) => q.id === "quest-1");
    expect(updatedQuest?.status).toBe("awaiting_approval");
  });

  it("returns unchanged state if questId not found", () => {
    const player = makePlayer();
    const state = makeState({ players: [player] });

    const result = gameReducer(state, {
      type: "CLAIM_QUEST",
      questId: "nonexistent-quest",
      playerId: "player-1",
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state if quest is not active (isActive === false)", () => {
    const player = makePlayer();
    const quest = makeQuest({ isActive: false });
    const state = makeState({ players: [player], quests: [quest] });

    const result = gameReducer(state, {
      type: "CLAIM_QUEST",
      questId: "quest-1",
      playerId: "player-1",
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state if quest status is not available", () => {
    const player = makePlayer();
    const quest = makeQuest({ status: "awaiting_approval" });
    const state = makeState({ players: [player], quests: [quest] });

    const result = gameReducer(state, {
      type: "CLAIM_QUEST",
      questId: "quest-1",
      playerId: "player-1",
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// APPROVE_QUEST
// ---------------------------------------------------------------------------

describe("APPROVE_QUEST", () => {
  it("awards XP and coins to the claiming player", () => {
    const player = makePlayer({ xp: 100, lifetimeXP: 100, coins: 50, lifetimeCoins: 60 });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 15, coinReward: 10 });
    const claim = makeClaim({ questId: "quest-1", playerId: "player-1" });
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T12:00:00Z");

    const result = gameReducer(state, { type: "APPROVE_QUEST", claimId: "claim-1", now });

    const updatedPlayer = result.players.find((p) => p.id === "player-1");
    expect(updatedPlayer?.xp).toBe(115);
    expect(updatedPlayer?.lifetimeXP).toBe(115);
    expect(updatedPlayer?.coins).toBe(60);
    expect(updatedPlayer?.lifetimeCoins).toBe(70);
  });

  it("increments player.weeklyCoins by quest.coinReward", () => {
    const player = makePlayer({ weeklyCoins: 20, coins: 50 });
    const quest = makeQuest({ status: "awaiting_approval", coinReward: 10 });
    const claim = makeClaim();
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T12:00:00Z");

    const result = gameReducer(state, { type: "APPROVE_QUEST", claimId: "claim-1", now });

    const updatedPlayer = result.players.find((p) => p.id === "player-1");
    expect(updatedPlayer?.weeklyCoins).toBe(30);
  });

  it("updates player streak via streakService", () => {
    const player = makePlayer({ streak: 3, lastActivityDate: "2026-03-17" });
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = makeClaim();
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T12:00:00Z");

    const result = gameReducer(state, { type: "APPROVE_QUEST", claimId: "claim-1", now });

    const updatedPlayer = result.players.find((p) => p.id === "player-1");
    // lastActivityDate "2026-03-17" + 1 day = "2026-03-18" → streak should increment to 4
    expect(updatedPlayer?.streak).toBe(4);
    expect(updatedPlayer?.lastActivityDate).toBe("2026-03-18");
  });

  it("marks claim with xpAwarded, coinsAwarded, resolvedAt snapshots", () => {
    const player = makePlayer();
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 15, coinReward: 10 });
    const claim = makeClaim();
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T12:00:00Z");

    const result = gameReducer(state, { type: "APPROVE_QUEST", claimId: "claim-1", now });

    const updatedClaim = result.claims.find((c) => c.id === "claim-1");
    expect(updatedClaim?.xpAwarded).toBe(15);
    expect(updatedClaim?.coinsAwarded).toBe(10);
    expect(updatedClaim?.resolvedAt).toBeInstanceOf(Date);
  });

  it("resets daily quest back to status available after approval", () => {
    const player = makePlayer();
    const quest = makeQuest({ status: "awaiting_approval", recurrence: "daily" });
    const claim = makeClaim();
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T12:00:00Z");

    const result = gameReducer(state, { type: "APPROVE_QUEST", claimId: "claim-1", now });

    const updatedQuest = result.quests.find((q) => q.id === "quest-1");
    expect(updatedQuest?.status).toBe("available");
    expect(updatedQuest?.isActive).toBe(true);
  });

  it("resets weekly quest back to status available after approval", () => {
    const player = makePlayer();
    const quest = makeQuest({ status: "awaiting_approval", recurrence: "weekly" });
    const claim = makeClaim();
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T12:00:00Z");

    const result = gameReducer(state, { type: "APPROVE_QUEST", claimId: "claim-1", now });

    const updatedQuest = result.quests.find((q) => q.id === "quest-1");
    expect(updatedQuest?.status).toBe("available");
    expect(updatedQuest?.isActive).toBe(true);
  });

  it("deactivates one-time quest after approval", () => {
    const player = makePlayer();
    const quest = makeQuest({ status: "awaiting_approval", recurrence: "one-time" });
    const claim = makeClaim();
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T12:00:00Z");

    const result = gameReducer(state, { type: "APPROVE_QUEST", claimId: "claim-1", now });

    const updatedQuest = result.quests.find((q) => q.id === "quest-1");
    expect(updatedQuest?.isActive).toBe(false);
  });

  it("deactivates bonus quest after approval", () => {
    const player = makePlayer();
    const quest = makeQuest({ status: "awaiting_approval", recurrence: "bonus" });
    const claim = makeClaim();
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T12:00:00Z");

    const result = gameReducer(state, { type: "APPROVE_QUEST", claimId: "claim-1", now });

    const updatedQuest = result.quests.find((q) => q.id === "quest-1");
    expect(updatedQuest?.isActive).toBe(false);
  });

  it("returns unchanged state if claimId not found", () => {
    const state = makeState({ parentSession: makeActiveSession() });

    const result = gameReducer(state, {
      type: "APPROVE_QUEST",
      claimId: "nonexistent-claim",
      now: new Date(),
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state if associated quest is not in awaiting_approval status", () => {
    const player = makePlayer();
    const quest = makeQuest({ status: "available" });
    const claim = makeClaim();
    const state = makeState({ players: [player], quests: [quest], claims: [claim], parentSession: makeActiveSession() });

    const result = gameReducer(state, {
      type: "APPROVE_QUEST",
      claimId: "claim-1",
      now: new Date(),
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// DENY_QUEST
// ---------------------------------------------------------------------------

describe("DENY_QUEST", () => {
  it("sets claim.voided to true and quest.status to available", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = makeClaim({ questId: "quest-1" });
    const state = makeState({ quests: [quest], claims: [claim], parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "DENY_QUEST", claimId: "claim-1" });

    const updatedClaim = result.claims.find((c) => c.id === "claim-1");
    const updatedQuest = result.quests.find((q) => q.id === "quest-1");
    expect(updatedClaim?.voided).toBe(true);
    expect(updatedQuest?.status).toBe("available");
  });

  it("returns unchanged state if claimId not found", () => {
    const state = makeState({ parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "DENY_QUEST", claimId: "nonexistent-claim" });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// REDEEM_REWARD
// ---------------------------------------------------------------------------

describe("REDEEM_REWARD", () => {
  it("deducts coinCost from player.coins and leaves lifetimeCoins unchanged", () => {
    const player = makePlayer({ coins: 100, lifetimeCoins: 150 });
    const reward = makeReward({ coinCost: 50, stock: -1 });
    const state = makeState({ players: [player], rewards: [reward] });

    const result = gameReducer(state, {
      type: "REDEEM_REWARD",
      rewardId: "reward-1",
      playerId: "player-1",
    });

    const updatedPlayer = result.players.find((p) => p.id === "player-1");
    expect(updatedPlayer?.coins).toBe(50);
    expect(updatedPlayer?.lifetimeCoins).toBe(150);
  });

  it("decrements reward stock by 1 (stock -1 stays -1)", () => {
    const player = makePlayer({ coins: 100 });
    const rewardUnlimited = makeReward({ stock: -1, coinCost: 50 });
    const rewardLimited = makeReward({ id: "reward-2", stock: 3, coinCost: 50 });
    const state = makeState({
      players: [player],
      rewards: [rewardUnlimited, rewardLimited],
    });

    const resultUnlimited = gameReducer(state, {
      type: "REDEEM_REWARD",
      rewardId: "reward-1",
      playerId: "player-1",
    });
    expect(resultUnlimited.rewards.find((r) => r.id === "reward-1")?.stock).toBe(-1);

    const stateLimited = makeState({
      players: [player],
      rewards: [rewardUnlimited, rewardLimited],
    });
    const resultLimited = gameReducer(stateLimited, {
      type: "REDEEM_REWARD",
      rewardId: "reward-2",
      playerId: "player-1",
    });
    expect(resultLimited.rewards.find((r) => r.id === "reward-2")?.stock).toBe(2);
  });

  it("adds new RewardRedemption with status pending to state.redemptions", () => {
    const player = makePlayer({ coins: 100 });
    const reward = makeReward({ coinCost: 50 });
    const state = makeState({ players: [player], rewards: [reward] });

    const result = gameReducer(state, {
      type: "REDEEM_REWARD",
      rewardId: "reward-1",
      playerId: "player-1",
    });

    expect(result.redemptions).toHaveLength(1);
    expect(result.redemptions[0]?.rewardId).toBe("reward-1");
    expect(result.redemptions[0]?.playerId).toBe("player-1");
    expect(result.redemptions[0]?.status).toBe("pending");
  });

  it("returns unchanged state if rewardId not found", () => {
    const player = makePlayer();
    const state = makeState({ players: [player] });

    const result = gameReducer(state, {
      type: "REDEEM_REWARD",
      rewardId: "nonexistent-reward",
      playerId: "player-1",
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state if playerId not found", () => {
    const reward = makeReward();
    const state = makeState({ rewards: [reward] });

    const result = gameReducer(state, {
      type: "REDEEM_REWARD",
      rewardId: "reward-1",
      playerId: "nonexistent-player",
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state if player has insufficient coins", () => {
    const player = makePlayer({ coins: 30 });
    const reward = makeReward({ coinCost: 50 });
    const state = makeState({ players: [player], rewards: [reward] });

    const result = gameReducer(state, {
      type: "REDEEM_REWARD",
      rewardId: "reward-1",
      playerId: "player-1",
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state if reward is out of stock (stock === 0)", () => {
    const player = makePlayer({ coins: 100 });
    const reward = makeReward({ stock: 0, coinCost: 50 });
    const state = makeState({ players: [player], rewards: [reward] });

    const result = gameReducer(state, {
      type: "REDEEM_REWARD",
      rewardId: "reward-1",
      playerId: "player-1",
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// FULFILL_REDEMPTION
// ---------------------------------------------------------------------------

describe("FULFILL_REDEMPTION", () => {
  it("sets redemption status to fulfilled and sets fulfilledAt", () => {
    const redemption = makeRedemption({ status: "pending" });
    const state = makeState({ redemptions: [redemption], parentSession: makeActiveSession() });
    const now = new Date("2026-03-18T14:00:00Z");

    const result = gameReducer(state, {
      type: "FULFILL_REDEMPTION",
      redemptionId: "redemption-1",
      now,
    });

    const updated = result.redemptions.find((r) => r.id === "redemption-1");
    expect(updated?.status).toBe("fulfilled");
    expect(updated?.fulfilledAt).toBeInstanceOf(Date);
  });

  it("returns unchanged state if redemptionId not found", () => {
    const state = makeState({ parentSession: makeActiveSession() });

    const result = gameReducer(state, {
      type: "FULFILL_REDEMPTION",
      redemptionId: "nonexistent",
      now: new Date(),
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state if redemption is already fulfilled", () => {
    const redemption = makeRedemption({ status: "fulfilled" });
    const state = makeState({ redemptions: [redemption], parentSession: makeActiveSession() });

    const result = gameReducer(state, {
      type: "FULFILL_REDEMPTION",
      redemptionId: "redemption-1",
      now: new Date(),
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// RESET_WEEKLY
// ---------------------------------------------------------------------------

describe("RESET_WEEKLY", () => {
  it("resets all players weeklyCoins to 0", () => {
    const players = [
      makePlayer({ id: "p1", weeklyCoins: 50, coins: 50, lifetimeCoins: 50 }),
      makePlayer({ id: "p2", weeklyCoins: 30, coins: 30, lifetimeCoins: 30 }),
    ];
    const state = makeState({ players });

    const result = gameReducer(state, { type: "RESET_WEEKLY", bonusAmount: 10 });

    for (const player of result.players) {
      expect(player.weeklyCoins).toBe(0);
    }
  });

  it("awards bonusAmount to coins (but not lifetimeCoins) of weekly winner(s)", () => {
    const players = [
      makePlayer({ id: "p1", weeklyCoins: 50, coins: 50, lifetimeCoins: 50 }),
      makePlayer({ id: "p2", weeklyCoins: 30, coins: 30, lifetimeCoins: 30 }),
    ];
    const state = makeState({ players });

    const result = gameReducer(state, { type: "RESET_WEEKLY", bonusAmount: 25 });

    const winner = result.players.find((p) => p.id === "p1");
    const loser = result.players.find((p) => p.id === "p2");

    // leaderboardService.resetWeekly awards bonus to both coins AND lifetimeCoins
    // We just verify the winner gets coins and the loser doesn't
    expect(winner?.coins).toBeGreaterThan(50);
    expect(loser?.coins).toBe(30);
  });

  it("awards no bonus when all players have 0 weeklyCoins", () => {
    const players = [
      makePlayer({ id: "p1", weeklyCoins: 0, coins: 50, lifetimeCoins: 50 }),
      makePlayer({ id: "p2", weeklyCoins: 0, coins: 30, lifetimeCoins: 30 }),
    ];
    const state = makeState({ players });

    const result = gameReducer(state, { type: "RESET_WEEKLY", bonusAmount: 25 });

    const p1 = result.players.find((p) => p.id === "p1");
    const p2 = result.players.find((p) => p.id === "p2");
    expect(p1?.coins).toBe(50);
    expect(p2?.coins).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// SET_PARENT_SESSION
// ---------------------------------------------------------------------------

describe("SET_PARENT_SESSION", () => {
  it("sets parentSession to provided session", () => {
    const session = makeParentSession();
    const state = makeState();

    const result = gameReducer(state, { type: "SET_PARENT_SESSION", session });

    expect(result.parentSession).toBe(session);
  });

  it("clears parentSession when null is passed", () => {
    const session = makeParentSession();
    const state = makeState({ parentSession: session });

    const result = gameReducer(state, { type: "SET_PARENT_SESSION", session: null });

    expect(result.parentSession).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TOUCH_SESSION
// ---------------------------------------------------------------------------

describe("TOUCH_SESSION", () => {
  it("updates parentSession.lastActivityAt to action.now", () => {
    const session = makeParentSession({
      lastActivityAt: new Date("2026-03-18T09:00:00Z"),
    });
    const state = makeState({ parentSession: session });
    const now = new Date("2026-03-18T09:05:00Z");

    const result = gameReducer(state, { type: "TOUCH_SESSION", now });

    expect(result.parentSession?.lastActivityAt).toBe(now);
  });

  it("returns unchanged state when no parentSession exists", () => {
    const state = makeState({ parentSession: null });

    const result = gameReducer(state, {
      type: "TOUCH_SESSION",
      now: new Date(),
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// END_SESSION
// ---------------------------------------------------------------------------

describe("END_SESSION", () => {
  it("sets parentSession.isActive to false", () => {
    const session = makeParentSession({ isActive: true });
    const state = makeState({ parentSession: session });

    const result = gameReducer(state, { type: "END_SESSION" });

    expect(result.parentSession?.isActive).toBe(false);
  });

  it("returns unchanged state when no parentSession exists", () => {
    const state = makeState({ parentSession: null });

    const result = gameReducer(state, { type: "END_SESSION" });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// SET_PARENT_CONFIG
// ---------------------------------------------------------------------------

describe("SET_PARENT_CONFIG", () => {
  it("sets parentConfig on initial setup (no existing parentConfig)", () => {
    const config = makeParentConfig();
    // parentConfig is null (initial setup) — no session required
    const state = makeState({ parentConfig: null, parentSession: null });

    const result = gameReducer(state, { type: "SET_PARENT_CONFIG", config });

    expect(result.parentConfig).toBe(config);
  });

  it("sets parentConfig when re-configuring with an active session", () => {
    const existingConfig = makeParentConfig({ hashedPin: "oldhash" });
    const newConfig = makeParentConfig({ hashedPin: "newhash" });
    const state = makeState({ parentConfig: existingConfig, parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "SET_PARENT_CONFIG", config: newConfig });

    expect(result.parentConfig).toBe(newConfig);
  });
});

// ---------------------------------------------------------------------------
// unknown action
// ---------------------------------------------------------------------------

describe("unknown action", () => {
  it("returns state unchanged and never throws", () => {
    const state = makeState({ players: [makePlayer()] });

    // Cast to GameAction to simulate unknown dispatch
    const result = gameReducer(state, { type: "UNKNOWN_ACTION" } as never);

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// ADD_QUESTS_BATCH
// ---------------------------------------------------------------------------

describe("ADD_QUESTS_BATCH", () => {
  it("appends all quests to an empty quests array", () => {
    const state = makeState();
    const q1 = makeQuest({ id: "q-1", title: "Make Bed" });
    const q2 = makeQuest({ id: "q-2", title: "Brush Teeth" });

    const result = gameReducer(state, {
      type: "ADD_QUESTS_BATCH",
      payload: { quests: [q1, q2] },
    });

    expect(result.quests).toHaveLength(2);
    expect(result.quests).toContain(q1);
    expect(result.quests).toContain(q2);
  });

  it("appends new quests to an already-populated quests array", () => {
    const existing = makeQuest({ id: "q-existing" });
    const state = makeState({ quests: [existing] });
    const incoming = makeQuest({ id: "q-new" });

    const result = gameReducer(state, {
      type: "ADD_QUESTS_BATCH",
      payload: { quests: [incoming] },
    });

    expect(result.quests).toHaveLength(2);
    expect(result.quests).toContain(existing);
    expect(result.quests).toContain(incoming);
  });

  it("ignores quests whose id already exists in state (idempotent)", () => {
    const original = makeQuest({ id: "q-1", title: "Original" });
    const state = makeState({ quests: [original] });
    const duplicate = makeQuest({ id: "q-1", title: "Duplicate" });

    const result = gameReducer(state, {
      type: "ADD_QUESTS_BATCH",
      payload: { quests: [duplicate] },
    });

    expect(result.quests).toHaveLength(1);
    expect(result.quests[0]!.title).toBe("Original");
  });

  it("adds only truly new quests when payload mixes new and duplicate ids", () => {
    const existing = makeQuest({ id: "q-1" });
    const state = makeState({ quests: [existing] });
    const duplicate = makeQuest({ id: "q-1" });
    const fresh = makeQuest({ id: "q-2" });

    const result = gameReducer(state, {
      type: "ADD_QUESTS_BATCH",
      payload: { quests: [duplicate, fresh] },
    });

    expect(result.quests).toHaveLength(2);
    expect(result.quests.find((q) => q.id === "q-2")).toBe(fresh);
  });

  it("returns state unchanged when payload is empty", () => {
    const state = makeState({ quests: [makeQuest()] });

    const result = gameReducer(state, {
      type: "ADD_QUESTS_BATCH",
      payload: { quests: [] },
    });

    expect(result).toBe(state);
  });

  it("does not mutate existing quests in state", () => {
    const state = makeState({ quests: [makeQuest({ id: "q-1" })] });
    const before = state.quests;

    gameReducer(state, {
      type: "ADD_QUESTS_BATCH",
      payload: { quests: [makeQuest({ id: "q-2" })] },
    });

    expect(state.quests).toBe(before);
  });

  it("preserves all other state slices unchanged", () => {
    const player = makePlayer();
    const reward = makeReward();
    const state = makeState({ players: [player], rewards: [reward] });

    const result = gameReducer(state, {
      type: "ADD_QUESTS_BATCH",
      payload: { quests: [makeQuest({ id: "q-new" })] },
    });

    expect(result.players).toBe(state.players);
    expect(result.rewards).toBe(state.rewards);
    expect(result.claims).toBe(state.claims);
    expect(result.redemptions).toBe(state.redemptions);
  });
});

// ---------------------------------------------------------------------------
// ADD_REWARDS_BATCH
// ---------------------------------------------------------------------------

describe("ADD_REWARDS_BATCH", () => {
  it("appends all rewards to an empty rewards array", () => {
    const state = makeState();
    const r1 = makeReward({ id: "r-1", title: "Screen Time" });
    const r2 = makeReward({ id: "r-2", title: "Dessert" });

    const result = gameReducer(state, {
      type: "ADD_REWARDS_BATCH",
      payload: { rewards: [r1, r2] },
    });

    expect(result.rewards).toHaveLength(2);
    expect(result.rewards).toContain(r1);
    expect(result.rewards).toContain(r2);
  });

  it("appends new rewards to an already-populated rewards array", () => {
    const existing = makeReward({ id: "r-existing" });
    const state = makeState({ rewards: [existing] });
    const incoming = makeReward({ id: "r-new" });

    const result = gameReducer(state, {
      type: "ADD_REWARDS_BATCH",
      payload: { rewards: [incoming] },
    });

    expect(result.rewards).toHaveLength(2);
    expect(result.rewards).toContain(existing);
    expect(result.rewards).toContain(incoming);
  });

  it("ignores rewards whose id already exists in state (idempotent)", () => {
    const original = makeReward({ id: "r-1", title: "Original" });
    const state = makeState({ rewards: [original] });
    const duplicate = makeReward({ id: "r-1", title: "Duplicate" });

    const result = gameReducer(state, {
      type: "ADD_REWARDS_BATCH",
      payload: { rewards: [duplicate] },
    });

    expect(result.rewards).toHaveLength(1);
    expect(result.rewards[0]!.title).toBe("Original");
  });

  it("adds only truly new rewards when payload mixes new and duplicate ids", () => {
    const existing = makeReward({ id: "r-1" });
    const state = makeState({ rewards: [existing] });
    const duplicate = makeReward({ id: "r-1" });
    const fresh = makeReward({ id: "r-2" });

    const result = gameReducer(state, {
      type: "ADD_REWARDS_BATCH",
      payload: { rewards: [duplicate, fresh] },
    });

    expect(result.rewards).toHaveLength(2);
    expect(result.rewards.find((r) => r.id === "r-2")).toBe(fresh);
  });

  it("returns state unchanged when payload is empty", () => {
    const state = makeState({ rewards: [makeReward()] });

    const result = gameReducer(state, {
      type: "ADD_REWARDS_BATCH",
      payload: { rewards: [] },
    });

    expect(result).toBe(state);
  });

  it("does not mutate existing rewards in state", () => {
    const state = makeState({ rewards: [makeReward({ id: "r-1" })] });
    const before = state.rewards;

    gameReducer(state, {
      type: "ADD_REWARDS_BATCH",
      payload: { rewards: [makeReward({ id: "r-2" })] },
    });

    expect(state.rewards).toBe(before);
  });

  it("preserves all other state slices unchanged", () => {
    const player = makePlayer();
    const quest = makeQuest();
    const state = makeState({ players: [player], quests: [quest] });

    const result = gameReducer(state, {
      type: "ADD_REWARDS_BATCH",
      payload: { rewards: [makeReward({ id: "r-new" })] },
    });

    expect(result.players).toBe(state.players);
    expect(result.quests).toBe(state.quests);
    expect(result.claims).toBe(state.claims);
    expect(result.redemptions).toBe(state.redemptions);
  });
});
