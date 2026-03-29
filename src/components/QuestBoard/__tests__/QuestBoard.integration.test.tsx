import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameProvider } from "../../../state/GameContext.js";
import { QuestBoard } from "../QuestBoard.js";
import { makePlayer, makePlayerLevel10, makeQuest, makeClaim, makeGameState } from "../../../test/fixtures.js";
import type { GameState } from "../../../state/types.js";

afterEach(cleanup);

function renderBoard(
  activePlayerId: string | null,
  state: GameState,
  onPlayerSelect = vi.fn(),
  onExit = vi.fn()
) {
  render(
    <GameProvider initialState={state}>
      <QuestBoard activePlayerId={activePlayerId} onPlayerSelect={onPlayerSelect} onExit={onExit} />
    </GameProvider>
  );
  return { onPlayerSelect, onExit };
}

describe("QuestBoard — integration tests", () => {
  it("full claim workflow: available quest becomes Awaiting Approval after clicking Claim Quest", async () => {
    const user = userEvent.setup();
    const state = makeGameState({
      players: [makePlayer({ id: "player-1" })],
      quests: [makeQuest({ id: "quest-1", status: "available" })],
    });

    renderBoard("player-1", state);

    const claimButton = screen.getByRole("button", { name: /claim quest/i });
    expect(claimButton).toBeDefined();

    await user.click(claimButton);

    expect(screen.getByText("Awaiting Approval")).toBeDefined();
    expect(screen.queryByRole("button", { name: /claim quest/i })).toBeNull();
  });

  it("displays available, awaiting_approval, and approved quests simultaneously", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "player-1" })],
      quests: [
        makeQuest({ id: "q1", title: "Quest A" }),
        makeQuest({ id: "q2", title: "Quest B" }),
        makeQuest({ id: "q3", title: "Quest C" }),
      ],
      claims: [
        // pending claim → shows "Awaiting Approval"
        { ...makeClaim(), id: "claim-b", questId: "q2", playerId: "player-1", status: "pending" as const },
        // approved claim → shows "Complete"
        { ...makeClaim(), id: "claim-c", questId: "q3", playerId: "player-1", status: "approved" as const },
      ],
    });

    renderBoard("player-1", state);

    expect(screen.getByRole("button", { name: /claim quest/i })).toBeDefined();
    expect(screen.getByText("Awaiting Approval")).toBeDefined();
    expect(screen.getByText(/complete/i)).toBeDefined();
  });

  it("excludes isActive:false quests from the quest list", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "player-1" })],
      quests: [
        makeQuest({ id: "q1", title: "Active Quest", isActive: true }),
        makeQuest({ id: "q2", title: "Hidden Quest", isActive: false }),
      ],
    });

    renderBoard("player-1", state);

    expect(screen.getByText("Active Quest")).toBeDefined();
    expect(screen.queryByText("Hidden Quest")).toBeNull();
  });

  it("filters quests by category — only matching category visible", async () => {
    const user = userEvent.setup();
    const state = makeGameState({
      players: [makePlayer({ id: "player-1" })],
      quests: [
        makeQuest({ id: "q-k", title: "Kitchen Quest", category: "Kitchen" }),
        makeQuest({ id: "q-p", title: "Pets Quest", category: "Pets" }),
      ],
    });

    renderBoard("player-1", state);

    const categorySelect = screen.getByLabelText("Category");
    await user.selectOptions(categorySelect, "Kitchen");

    expect(screen.getByText("Kitchen Quest")).toBeDefined();
    expect(screen.queryByText("Pets Quest")).toBeNull();
  });

  it("sorts quests by xp-desc — highest XP quest first in the list", async () => {
    const user = userEvent.setup();
    const state = makeGameState({
      players: [makePlayer({ id: "player-1" })],
      quests: [
        makeQuest({ id: "q1", title: "Low XP Quest", xpReward: 15 }),
        makeQuest({ id: "q2", title: "High XP Quest", xpReward: 40 }),
        makeQuest({ id: "q3", title: "Mid XP Quest", xpReward: 25 }),
      ],
    });

    renderBoard("player-1", state);

    const sortSelect = screen.getByLabelText("Sort by");
    await user.selectOptions(sortSelect, "xp-desc");

    const listItems = screen.getAllByRole("listitem");
    // First item should have the highest XP (40 XP)
    expect(listItems[0]?.textContent).toContain("40 XP");
    // Last item should have the lowest XP (15 XP)
    expect(listItems[listItems.length - 1]?.textContent).toContain("15 XP");
  });

  it("filter and sort combined: Kitchen category sorted by xp-desc", async () => {
    const user = userEvent.setup();
    const state = makeGameState({
      players: [makePlayer({ id: "player-1" })],
      quests: [
        makeQuest({ id: "q1", title: "Kitchen Low", category: "Kitchen", xpReward: 15 }),
        makeQuest({ id: "q2", title: "Kitchen High", category: "Kitchen", xpReward: 40 }),
        makeQuest({ id: "q3", title: "Pets Quest", category: "Pets", xpReward: 25 }),
      ],
    });

    renderBoard("player-1", state);

    const categorySelect = screen.getByLabelText("Category");
    await user.selectOptions(categorySelect, "Kitchen");

    const sortSelect = screen.getByLabelText("Sort by");
    await user.selectOptions(sortSelect, "xp-desc");

    // Pets quest should not be visible
    expect(screen.queryByText("Pets Quest")).toBeNull();

    // Both Kitchen quests should be visible
    expect(screen.getByText("Kitchen High")).toBeDefined();
    expect(screen.getByText("Kitchen Low")).toBeDefined();

    // Kitchen High (40 XP) should come before Kitchen Low (15 XP)
    const listItems = screen.getAllByRole("listitem");
    expect(listItems[0]?.textContent).toContain("40 XP");
    expect(listItems[1]?.textContent).toContain("15 XP");
  });

  it("switching active player updates the PlayerHero to show new player's name", () => {
    const state = makeGameState({
      players: [
        makePlayer({ id: "p1", name: "Alex" }),
        makePlayer({ id: "p2", name: "Maya" }),
      ],
      quests: [makeQuest()],
    });

    renderBoard("p1", state);
    expect(screen.getByRole("heading", { name: "Alex" })).toBeDefined();

    cleanup();

    renderBoard("p2", state);
    expect(screen.getByRole("heading", { name: "Maya" })).toBeDefined();
  });

  it("shows MAX LEVEL in XP bar when player is level 10", () => {
    const state = makeGameState({
      players: [makePlayerLevel10({ id: "p1" })],
      quests: [makeQuest()],
    });

    renderBoard("p1", state);

    expect(screen.getByText("MAX LEVEL")).toBeDefined();
  });

  it("shows 'On a Roll!' badge when active player has streak >= 3", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", streak: 5 })],
      quests: [makeQuest()],
    });

    renderBoard("p1", state);

    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("On a Roll!")).toBeDefined();
  });

  it("renders null when activePlayerId does not match any player in state", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1" })],
      quests: [makeQuest()],
    });

    renderBoard("nonexistent-id", state);

    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByRole("list", { name: /quest board/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /claim quest/i })).toBeNull();
  });
});
