import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { ActivityLogTab } from "../ActivityLogTab.js";
import { GameProvider } from "../../../../../state/GameContext.js";
import {
  makeGameState,
  makePlayer,
  makeClaim,
  makeQuest,
  makeRedemption,
  makeReward,
} from "../../../../../test/fixtures.js";

afterEach(() => {
  cleanup();
});

function renderActivityLogTab(state = makeGameState()) {
  return render(
    <GameProvider initialState={state}>
      <ActivityLogTab />
    </GameProvider>
  );
}

describe("ActivityLogTab", () => {
  it("renders empty state when no claims or redemptions", () => {
    renderActivityLogTab(makeGameState());
    expect(screen.getByTestId("empty-log")).toBeInTheDocument();
    expect(screen.getByTestId("empty-log")).toHaveTextContent("No activity yet");
  });

  it("renders a log entry for each claim", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const quest = makeQuest({ id: "q1", title: "Wash Dishes" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = makeGameState({
      players: [player],
      quests: [quest],
      claims: [claim],
    });

    renderActivityLogTab(state);

    const entries = screen.getAllByTestId("log-entry");
    expect(entries).toHaveLength(1);
  });

  it("renders a log entry for each redemption", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const reward = makeReward({ id: "r1", title: "Screen Time" });
    const redemption = makeRedemption({ id: "red1", rewardId: "r1", playerId: "p1" });
    const state = makeGameState({
      players: [player],
      rewards: [reward],
      redemptions: [redemption],
    });

    renderActivityLogTab(state);

    const entries = screen.getAllByTestId("log-entry");
    expect(entries).toHaveLength(1);
  });

  it("renders log entries for both claims and redemptions", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const quest = makeQuest({ id: "q1", title: "Wash Dishes" });
    const reward = makeReward({ id: "r1", title: "Screen Time" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const redemption = makeRedemption({ id: "red1", rewardId: "r1", playerId: "p1" });
    const state = makeGameState({
      players: [player],
      quests: [quest],
      rewards: [reward],
      claims: [claim],
      redemptions: [redemption],
    });

    renderActivityLogTab(state);

    const entries = screen.getAllByTestId("log-entry");
    expect(entries).toHaveLength(2);
  });

  it("entries are sorted most recent first", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const quest = makeQuest({ id: "q1", title: "Early Quest" });
    const reward = makeReward({ id: "r1", title: "Recent Reward" });
    const claim = makeClaim({
      id: "c1",
      questId: "q1",
      playerId: "p1",
      claimedAt: new Date("2026-01-01T08:00:00Z"),
    });
    const redemption = makeRedemption({
      id: "red1",
      rewardId: "r1",
      playerId: "p1",
      redeemedAt: new Date("2026-03-01T12:00:00Z"),
    });
    const state = makeGameState({
      players: [player],
      quests: [quest],
      rewards: [reward],
      claims: [claim],
      redemptions: [redemption],
    });

    renderActivityLogTab(state);

    const entries = screen.getAllByTestId("log-entry");
    // Most recent (redemption) should be first
    expect(entries[0]).toHaveTextContent("Recent Reward");
    expect(entries[1]).toHaveTextContent("Early Quest");
  });

  it("each claim entry shows actor name", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const quest = makeQuest({ id: "q1", title: "Wash Dishes" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = makeGameState({
      players: [player],
      quests: [quest],
      claims: [claim],
    });

    renderActivityLogTab(state);

    const entry = screen.getByTestId("log-entry");
    expect(within(entry).getByText("Alex")).toBeInTheDocument();
  });

  it("each redemption entry shows actor name", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const reward = makeReward({ id: "r1", title: "Screen Time" });
    const redemption = makeRedemption({ id: "red1", rewardId: "r1", playerId: "p1" });
    const state = makeGameState({
      players: [player],
      rewards: [reward],
      redemptions: [redemption],
    });

    renderActivityLogTab(state);

    const entry = screen.getByTestId("log-entry");
    expect(within(entry).getByText("Alex")).toBeInTheDocument();
  });
});
