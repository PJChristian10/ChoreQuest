import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ParentDashboard } from "../ParentDashboard.js";
import { GameProvider } from "../../../state/GameContext.js";
import {
  makeGameState,
  makePlayer,
  makeQuest,
  makeClaim,
  makeActiveSession,
  makeExpiredSession,
} from "../../../test/fixtures.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderParentDashboard(
  state = makeGameState({ parentSession: makeActiveSession() }),
  onExit = vi.fn()
) {
  return render(
    <GameProvider skipSync={true} initialState={state}>
      <ParentDashboard onExit={onExit} />
    </GameProvider>
  );
}

describe("ParentDashboard", () => {
  it("renders the tab navigation bar", () => {
    renderParentDashboard();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("'Pending Approvals' tab is selected by default", () => {
    renderParentDashboard();
    const approvalsTab = screen.getByRole("tab", { name: /pending approvals/i });
    expect(approvalsTab).toHaveAttribute("aria-selected", "true");
  });

  it("renders badge count on Approvals tab when there are pending claims", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const quest = makeQuest({ id: "q1", title: "Wash Dishes", status: "awaiting_approval" });
    const claim = makeClaim({ id: "c1", questId: "q1", playerId: "p1" });
    const state = makeGameState({
      players: [player],
      quests: [quest],
      claims: [claim],
      parentSession: makeActiveSession(),
    });
    renderParentDashboard(state);
    // Badge count "1" should appear in approvals tab
    const approvalsTab = screen.getByRole("tab", { name: /pending approvals/i });
    expect(approvalsTab.textContent).toMatch(/1/);
  });

  it("clicking a tab switches the active panel", () => {
    renderParentDashboard();
    // Default is approvals panel visible
    const questTab = screen.getByRole("tab", { name: /quest management/i });
    fireEvent.click(questTab);
    expect(questTab).toHaveAttribute("aria-selected", "true");
    // Approvals tab no longer selected
    const approvalsTab = screen.getByRole("tab", { name: /pending approvals/i });
    expect(approvalsTab).toHaveAttribute("aria-selected", "false");
  });

  it("renders Exit button", () => {
    renderParentDashboard();
    expect(screen.getByRole("button", { name: "Exit parent dashboard" })).toBeInTheDocument();
  });

  it("calls onExit when Exit clicked", () => {
    const onExit = vi.fn();
    renderParentDashboard(makeGameState({ parentSession: makeActiveSession() }), onExit);
    fireEvent.click(screen.getByRole("button", { name: "Exit parent dashboard" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("calls onExit when parentSession is null", () => {
    const onExit = vi.fn();
    renderParentDashboard(makeGameState({ parentSession: null }), onExit);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("calls onExit when parentSession is expired", () => {
    const onExit = vi.fn();
    renderParentDashboard(
      makeGameState({ parentSession: makeExpiredSession() }),
      onExit
    );
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("switching to Quest Management shows quest panel", () => {
    renderParentDashboard();
    fireEvent.click(screen.getByRole("tab", { name: /quest management/i }));
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("switching to Activity Log shows activity log panel", () => {
    renderParentDashboard();
    fireEvent.click(screen.getByRole("tab", { name: /activity log/i }));
    // Should show empty log since no activity
    expect(screen.getByTestId("empty-log")).toBeInTheDocument();
  });
});
