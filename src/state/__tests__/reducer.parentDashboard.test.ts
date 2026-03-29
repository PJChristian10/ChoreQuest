import { describe, it, expect } from "vitest";
import { gameReducer } from "../reducer.js";
import {
  makeGameState,
  makePlayer,
  makeQuest,
  makeReward,
  makeActiveSession,
} from "../../test/fixtures.js";

// ---------------------------------------------------------------------------
// ADD_QUEST
// ---------------------------------------------------------------------------

describe("reducer — ADD_QUEST", () => {
  it("appends a new quest to state.quests", () => {
    const state = makeGameState({ parentSession: makeActiveSession() });
    const newQuest = makeQuest({ id: "quest-new", title: "New Quest" });

    const result = gameReducer(state, { type: "ADD_QUEST", quest: newQuest });

    expect(result.quests).toHaveLength(1);
    expect(result.quests[0]).toEqual(newQuest);
  });

  it("does not affect other state slices", () => {
    const player = makePlayer({ id: "p1" });
    const state = makeGameState({ players: [player], parentSession: makeActiveSession() });
    const newQuest = makeQuest({ id: "quest-new" });

    const result = gameReducer(state, { type: "ADD_QUEST", quest: newQuest });

    expect(result.players).toEqual([player]);
  });
});

// ---------------------------------------------------------------------------
// UPDATE_QUEST
// ---------------------------------------------------------------------------

describe("reducer — UPDATE_QUEST", () => {
  it("updates an existing quest by id", () => {
    const quest = makeQuest({ id: "quest-1", title: "Original" });
    const state = makeGameState({ quests: [quest], parentSession: makeActiveSession() });

    const result = gameReducer(state, {
      type: "UPDATE_QUEST",
      quest: { ...quest, title: "Updated", isActive: false },
    });

    const updated = result.quests.find((q) => q.id === "quest-1");
    expect(updated?.title).toBe("Updated");
    expect(updated?.isActive).toBe(false);
  });

  it("returns unchanged state when quest id not found", () => {
    const quest = makeQuest({ id: "quest-1" });
    const state = makeGameState({ quests: [quest], parentSession: makeActiveSession() });

    const result = gameReducer(state, {
      type: "UPDATE_QUEST",
      quest: makeQuest({ id: "quest-nonexistent" }),
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// DELETE_QUEST
// ---------------------------------------------------------------------------

describe("reducer — DELETE_QUEST", () => {
  it("removes a quest from state.quests by id", () => {
    const quest = makeQuest({ id: "quest-1" });
    const state = makeGameState({ quests: [quest], parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "DELETE_QUEST", questId: "quest-1" });

    expect(result.quests).toHaveLength(0);
  });

  it("returns unchanged state when quest id not found", () => {
    const quest = makeQuest({ id: "quest-1" });
    const state = makeGameState({ quests: [quest], parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "DELETE_QUEST", questId: "quest-nonexistent" });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// ADD_REWARD
// ---------------------------------------------------------------------------

describe("reducer — ADD_REWARD", () => {
  it("appends a new reward to state.rewards", () => {
    const state = makeGameState({ parentSession: makeActiveSession() });
    const newReward = makeReward({ id: "reward-new", title: "New Reward" });

    const result = gameReducer(state, { type: "ADD_REWARD", reward: newReward });

    expect(result.rewards).toHaveLength(1);
    expect(result.rewards[0]).toEqual(newReward);
  });
});

// ---------------------------------------------------------------------------
// DELETE_REWARD
// ---------------------------------------------------------------------------

describe("reducer — DELETE_REWARD", () => {
  it("removes a reward from state.rewards by id", () => {
    const reward = makeReward({ id: "reward-1" });
    const state = makeGameState({ rewards: [reward], parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "DELETE_REWARD", rewardId: "reward-1" });

    expect(result.rewards).toHaveLength(0);
  });

  it("returns unchanged state when reward id not found", () => {
    const reward = makeReward({ id: "reward-1" });
    const state = makeGameState({ rewards: [reward], parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "DELETE_REWARD", rewardId: "reward-nonexistent" });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// UPDATE_PLAYER
// ---------------------------------------------------------------------------

describe("reducer — UPDATE_PLAYER", () => {
  it("updates an existing player by id", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const state = makeGameState({ players: [player], parentSession: makeActiveSession() });

    const result = gameReducer(state, {
      type: "UPDATE_PLAYER",
      player: { ...player, name: "Alexander", coins: player.coins + 10 },
    });

    const updated = result.players.find((p) => p.id === "p1");
    expect(updated?.name).toBe("Alexander");
    expect(updated?.coins).toBe(player.coins + 10);
  });

  it("returns unchanged state when player id not found", () => {
    const player = makePlayer({ id: "p1" });
    const state = makeGameState({ players: [player], parentSession: makeActiveSession() });

    const result = gameReducer(state, {
      type: "UPDATE_PLAYER",
      player: makePlayer({ id: "p-nonexistent" }),
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// DELETE_PLAYER
// ---------------------------------------------------------------------------

describe("reducer — DELETE_PLAYER", () => {
  it("removes the player from state.players", () => {
    const p1 = makePlayer({ id: "p1" });
    const p2 = makePlayer({ id: "p2" });
    const state = makeGameState({ players: [p1, p2], parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "DELETE_PLAYER", playerId: "p1" });

    expect(result.players).toHaveLength(1);
    expect(result.players[0]?.id).toBe("p2");
  });

  it("also removes the player's claims", () => {
    const p1 = makePlayer({ id: "p1" });
    const state = makeGameState({
      players: [p1],
      claims: [
        { id: "c1", questId: "q1", playerId: "p1", claimedAt: new Date(), status: "pending" },
        { id: "c2", questId: "q2", playerId: "p2", claimedAt: new Date(), status: "pending" },
      ],
      parentSession: makeActiveSession(),
    });

    const result = gameReducer(state, { type: "DELETE_PLAYER", playerId: "p1" });

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0]?.playerId).toBe("p2");
  });

  it("returns unchanged state when parentSession is null", () => {
    const p1 = makePlayer({ id: "p1" });
    const state = makeGameState({ players: [p1], parentSession: null });

    const result = gameReducer(state, { type: "DELETE_PLAYER", playerId: "p1" });

    expect(result).toBe(state);
  });

  it("returns unchanged state when player id not found", () => {
    const p1 = makePlayer({ id: "p1" });
    const state = makeGameState({ players: [p1], parentSession: makeActiveSession() });

    const result = gameReducer(state, { type: "DELETE_PLAYER", playerId: "p-nonexistent" });

    expect(result.players).toHaveLength(1);
  });
});
