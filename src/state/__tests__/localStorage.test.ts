// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { saveState, loadState } from "../localStorage.js";
import type { GameState } from "../types.js";
import type { Player } from "../../models/player.js";
import type { Quest, QuestClaim } from "../../models/quest.js";
import type { Reward, RewardRedemption } from "../../models/reward.js";
import type { ParentSession } from "../../models/auth.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STORAGE_KEY = "chorequest_state";

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [],
    quests: [],
    claims: [],
    rewards: [],
    redemptions: [],
    parentConfig: null,
    parentSession: null,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// saveState
// ---------------------------------------------------------------------------

describe("saveState", () => {
  it("serializes and writes to localStorage key chorequest_state", () => {
    const state = makeMinimalState();
    saveState(state);

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string) as unknown;
    expect(parsed).toMatchObject({
      players: [],
      quests: [],
      claims: [],
      rewards: [],
      redemptions: [],
      parentConfig: null,
      parentSession: null,
    });
  });
});

// ---------------------------------------------------------------------------
// loadState
// ---------------------------------------------------------------------------

describe("loadState", () => {
  it("reads and deserializes from localStorage", () => {
    const state = makeMinimalState();
    saveState(state);

    const loaded = loadState();
    expect(loaded).not.toBeNull();
    expect(loaded?.players).toEqual([]);
    expect(loaded?.quests).toEqual([]);
  });

  it("returns null when key is absent", () => {
    const result = loadState();
    expect(result).toBeNull();
  });

  it("returns null on corrupted JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{ this is not valid json {{");

    const result = loadState();
    expect(result).toBeNull();
  });

  it("returns null if stored data has wrong shape (missing required fields)", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));

    const result = loadState();
    expect(result).toBeNull();
  });

  it("returns null if stored data is missing players field", () => {
    const { players: _players, ...withoutPlayers } = makeMinimalState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPlayers));

    const result = loadState();
    expect(result).toBeNull();
  });

  it("returns null if stored data is missing quests field", () => {
    const { quests: _quests, ...withoutQuests } = makeMinimalState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutQuests));

    const result = loadState();
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Date revival
// ---------------------------------------------------------------------------

describe("Date revival", () => {
  it("revives badges[].awardedAt as Date objects", () => {
    const awardedAt = new Date("2026-01-15T10:00:00.000Z");
    const player: Player = {
      id: "p1",
      name: "Alice",
      xp: 0,
      lifetimeXP: 0,
      coins: 0,
      lifetimeCoins: 0,
      weeklyCoins: 0,
      level: 1,
      streak: 0,
      badges: [{ id: "badge-1", name: "First Quest", awardedAt }],
    };
    const state = makeMinimalState({ players: [player] });
    saveState(state);

    const loaded = loadState();
    const loadedBadge = loaded?.players[0]?.badges[0];
    expect(loadedBadge?.awardedAt).toBeInstanceOf(Date);
    expect(loadedBadge?.awardedAt.toISOString()).toBe(awardedAt.toISOString());
  });

  it("revives quests[].createdAt as Date objects", () => {
    const createdAt = new Date("2026-02-01T08:00:00.000Z");
    const quest: Quest = {
      id: "quest-1",
      title: "Wash Dishes",
      icon: "🍳",
      xpReward: 10,
      coinReward: 5,
      difficulty: 1,
      recurrence: "daily",
      category: "Kitchen",
      status: "available",
      createdAt,
    };
    const state = makeMinimalState({ quests: [quest] });
    saveState(state);

    const loaded = loadState();
    const loadedQuest = loaded?.quests[0];
    expect(loadedQuest?.createdAt).toBeInstanceOf(Date);
    expect(loadedQuest?.createdAt?.toISOString()).toBe(createdAt.toISOString());
  });

  it("revives claims[].claimedAt and claims[].resolvedAt as Date objects", () => {
    const claimedAt = new Date("2026-03-10T09:00:00.000Z");
    const resolvedAt = new Date("2026-03-10T10:00:00.000Z");
    const claim: QuestClaim = {
      id: "claim-1",
      questId: "quest-1",
      playerId: "player-1",
      claimedAt,
      voided: false,
      resolvedAt,
    };
    const state = makeMinimalState({ claims: [claim] });
    saveState(state);

    const loaded = loadState();
    const loadedClaim = loaded?.claims[0];
    expect(loadedClaim?.claimedAt).toBeInstanceOf(Date);
    expect(loadedClaim?.claimedAt.toISOString()).toBe(claimedAt.toISOString());
    expect(loadedClaim?.resolvedAt).toBeInstanceOf(Date);
    expect(loadedClaim?.resolvedAt?.toISOString()).toBe(resolvedAt.toISOString());
  });

  it("revives rewards[].expiresAt as Date objects", () => {
    const expiresAt = new Date("2026-12-31T23:59:59.000Z");
    const reward: Reward = {
      id: "reward-1",
      title: "Ice Cream",
      icon: "🍦",
      description: "A treat",
      coinCost: 50,
      stock: -1,
      isActive: true,
      category: "food_treats",
      expiresAt,
    };
    const state = makeMinimalState({ rewards: [reward] });
    saveState(state);

    const loaded = loadState();
    const loadedReward = loaded?.rewards[0];
    expect(loadedReward?.expiresAt).toBeInstanceOf(Date);
    expect(loadedReward?.expiresAt?.toISOString()).toBe(expiresAt.toISOString());
  });

  it("revives redemptions[].redeemedAt and redemptions[].fulfilledAt as Date objects", () => {
    const redeemedAt = new Date("2026-03-15T11:00:00.000Z");
    const fulfilledAt = new Date("2026-03-15T12:00:00.000Z");
    const redemption: RewardRedemption = {
      id: "redemption-1",
      rewardId: "reward-1",
      playerId: "player-1",
      status: "fulfilled",
      redeemedAt,
      fulfilledAt,
    };
    const state = makeMinimalState({ redemptions: [redemption] });
    saveState(state);

    const loaded = loadState();
    const loadedRedemption = loaded?.redemptions[0];
    expect(loadedRedemption?.redeemedAt).toBeInstanceOf(Date);
    expect(loadedRedemption?.redeemedAt.toISOString()).toBe(redeemedAt.toISOString());
    expect(loadedRedemption?.fulfilledAt).toBeInstanceOf(Date);
    expect(loadedRedemption?.fulfilledAt?.toISOString()).toBe(fulfilledAt.toISOString());
  });

  it("revives parentSession.createdAt and parentSession.lastActivityAt as Date objects", () => {
    const createdAt = new Date("2026-03-18T09:00:00.000Z");
    const lastActivityAt = new Date("2026-03-18T09:05:00.000Z");
    const parentSession: ParentSession = {
      isActive: true,
      createdAt,
      lastActivityAt,
    };
    const state = makeMinimalState({ parentSession });
    saveState(state);

    const loaded = loadState();
    expect(loaded?.parentSession?.createdAt).toBeInstanceOf(Date);
    expect(loaded?.parentSession?.createdAt.toISOString()).toBe(createdAt.toISOString());
    expect(loaded?.parentSession?.lastActivityAt).toBeInstanceOf(Date);
    expect(loaded?.parentSession?.lastActivityAt.toISOString()).toBe(lastActivityAt.toISOString());
  });

  it("round-trips a full state with multiple Date fields correctly", () => {
    const now = new Date("2026-03-18T12:00:00.000Z");
    const player: Player = {
      id: "p1",
      name: "Alice",
      xp: 100,
      lifetimeXP: 100,
      coins: 50,
      lifetimeCoins: 60,
      weeklyCoins: 20,
      level: 2,
      streak: 3,
      badges: [{ id: "b1", name: "First", awardedAt: now }],
    };
    const claim: QuestClaim = {
      id: "c1",
      questId: "q1",
      playerId: "p1",
      claimedAt: now,
      voided: false,
    };
    const state = makeMinimalState({ players: [player], claims: [claim] });
    saveState(state);

    const loaded = loadState();
    expect(loaded?.players[0]?.badges[0]?.awardedAt).toBeInstanceOf(Date);
    expect(loaded?.claims[0]?.claimedAt).toBeInstanceOf(Date);
  });
});
