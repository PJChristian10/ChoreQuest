import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PendingApprovalsTab } from "../PendingApprovalsTab.js";
import { GameProvider } from "../../../../../state/GameContext.js";
import {
  makeGameState,
  makePlayer,
  makeQuest,
  makeClaim,
  makeActiveSession,
  makeExpiredSession,
} from "../../../../../test/fixtures.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderPendingApprovalsTab(
  state = makeGameState(),
  onSessionExpired = vi.fn()
) {
  return render(
    <GameProvider initialState={state}>
      <PendingApprovalsTab onSessionExpired={onSessionExpired} />
    </GameProvider>
  );
}

function makePendingState() {
  const player = makePlayer({ id: "p1", name: "Alex" });
  const quest = makeQuest({
    id: "q1",
    title: "Wash Dishes",
    xpReward: 20,
    coinReward: 10,
    status: "awaiting_approval",
  });
  const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
  return makeGameState({
    players: [player],
    quests: [quest],
    claims: [claim],
    parentSession: makeActiveSession(),
  });
}

describe("PendingApprovalsTab", () => {
  it("renders empty state when no pending approvals", () => {
    renderPendingApprovalsTab(makeGameState({ parentSession: makeActiveSession() }));
    expect(screen.getByTestId("empty-approvals")).toBeInTheDocument();
    expect(screen.getByTestId("empty-approvals")).toHaveTextContent("No pending approvals");
  });

  it("renders a list item for each pending claim", () => {
    renderPendingApprovalsTab(makePendingState());
    const items = screen.getAllByTestId("pending-approval-item");
    expect(items).toHaveLength(1);
  });

  it("each item shows player name", () => {
    renderPendingApprovalsTab(makePendingState());
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("each item shows quest title", () => {
    renderPendingApprovalsTab(makePendingState());
    expect(screen.getByText("Wash Dishes")).toBeInTheDocument();
  });

  it("each item shows XP reward", () => {
    renderPendingApprovalsTab(makePendingState());
    expect(screen.getByText(/20 XP/)).toBeInTheDocument();
  });

  it("each item shows coin reward", () => {
    renderPendingApprovalsTab(makePendingState());
    expect(screen.getByText(/10 coins/)).toBeInTheDocument();
  });

  it("approve button has correct aria-label", () => {
    renderPendingApprovalsTab(makePendingState());
    expect(
      screen.getByRole("button", { name: "Approve Wash Dishes for Alex" })
    ).toBeInTheDocument();
  });

  it("deny button has correct aria-label", () => {
    renderPendingApprovalsTab(makePendingState());
    expect(
      screen.getByRole("button", { name: "Deny Wash Dishes for Alex" })
    ).toBeInTheDocument();
  });

  it("clicking approve changes quest status from awaiting_approval", () => {
    const state = makePendingState();

    renderPendingApprovalsTab(state);

    fireEvent.click(screen.getByRole("button", { name: "Approve Wash Dishes for Alex" }));

    // After approval, no more pending items (quest is no longer awaiting_approval)
    expect(screen.queryByTestId("pending-approval-item")).not.toBeInTheDocument();
  });

  it("clicking deny changes quest status from awaiting_approval", () => {
    const state = makePendingState();

    renderPendingApprovalsTab(state);

    fireEvent.click(screen.getByRole("button", { name: "Deny Wash Dishes for Alex" }));

    // After denial, no more pending items
    expect(screen.queryByTestId("pending-approval-item")).not.toBeInTheDocument();
  });

  it("approve calls onSessionExpired if session is expired", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const quest = makeQuest({
      id: "q1",
      title: "Wash Dishes",
      status: "awaiting_approval",
    });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = makeGameState({
      players: [player],
      quests: [quest],
      claims: [claim],
      parentSession: makeExpiredSession(),
    });

    const onSessionExpired = vi.fn();
    renderPendingApprovalsTab(state, onSessionExpired);

    fireEvent.click(screen.getByRole("button", { name: "Approve Wash Dishes for Alex" }));

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("deny calls onSessionExpired if session is expired", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const quest = makeQuest({
      id: "q1",
      title: "Wash Dishes",
      status: "awaiting_approval",
    });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = makeGameState({
      players: [player],
      quests: [quest],
      claims: [claim],
      parentSession: makeExpiredSession(),
    });

    const onSessionExpired = vi.fn();
    renderPendingApprovalsTab(state, onSessionExpired);

    fireEvent.click(screen.getByRole("button", { name: "Deny Wash Dishes for Alex" }));

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
