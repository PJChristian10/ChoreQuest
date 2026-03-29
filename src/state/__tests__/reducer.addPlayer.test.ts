import { describe, it, expect } from "vitest";
import { gameReducer, INITIAL_STATE } from "../reducer.js";
import { makePlayer, makeGameState } from "../../test/fixtures.js";

describe("ADD_PLAYER", () => {
  it("appends a new player to state.players", () => {
    const player = makePlayer();
    const result = gameReducer(INITIAL_STATE, { type: "ADD_PLAYER", player });
    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toBe(player);
  });

  it("preserves existing players when adding a second", () => {
    const player1 = makePlayer();
    const stateWith1 = makeGameState({ players: [player1] });
    const player2 = makePlayer({ id: "p2" });
    const result = gameReducer(stateWith1, { type: "ADD_PLAYER", player: player2 });
    expect(result.players).toHaveLength(2);
    expect(result.players[0]).toBe(player1);
    expect(result.players[1]).toBe(player2);
  });

  it("new player has the avatar and playerPin from the action", () => {
    const player = makePlayer({ id: "p-new", avatar: "dragon", playerPin: "hash-xyz" });
    const result = gameReducer(INITIAL_STATE, { type: "ADD_PLAYER", player });
    const added = result.players[0];
    expect(added).toBeDefined();
    expect(added!.avatar).toBe("dragon");
    expect(added!.playerPin).toBe("hash-xyz");
  });

  it("does not mutate the input state", () => {
    const initialLength = INITIAL_STATE.players.length;
    const player = makePlayer();
    gameReducer(INITIAL_STATE, { type: "ADD_PLAYER", player });
    expect(INITIAL_STATE.players).toHaveLength(initialLength);
  });
});
