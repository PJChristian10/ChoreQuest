import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
import { GameProvider } from "../../../state/GameContext.js";
import { QuestBoard } from "../QuestBoard.js";
import type { Player } from "../../../models/player.js";
import type { Quest } from "../../../models/quest.js";
import type { GameState } from "../../../state/types.js";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    name: "Alex",
    xp: 100,
    lifetimeXP: 100,
    coins: 50,
    lifetimeCoins: 50,
    weeklyCoins: 10,
    level: 2,
    streak: 1,
    longestStreak: 1,
    lastActivityDate: "2026-03-18",
    badges: [],
    ...overrides,
  };
}

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "q1",
    title: "Wash Dishes",
    icon: "🍳",
    category: "Kitchen",
    recurrence: "daily",
    difficulty: 1,
    xpReward: 15,
    coinReward: 10,
    status: "available",
    isActive: true,
    ...overrides,
  };
}

function makeState(players: Player[], quests: Quest[]): GameState {
  return {
    players,
    quests,
    claims: [],
    rewards: [],
    redemptions: [],
    parentConfig: null,
    parentSession: null,
  };
}

function renderBoard(
  activePlayerId: string | null = "p1",
  state?: GameState,
  onPlayerSelect = vi.fn(),
  onExit = vi.fn()
) {
  const s = state ?? makeState([makePlayer()], [makeQuest()]);
  render(
    <GameProvider skipSync={true} initialState={s}>
      <QuestBoard activePlayerId={activePlayerId} onPlayerSelect={onPlayerSelect} onExit={onExit} />
    </GameProvider>
  );
  return { onPlayerSelect, onExit };
}

describe("QuestBoard", () => {
  it("renders PlayerHero with the active player's name", () => {
    renderBoard();
    expect(screen.getByRole("heading", { name: "Alex" })).toBeDefined();
  });

  it("renders a QuestCard for each active quest", () => {
    const state = makeState(
      [makePlayer()],
      [
        makeQuest({ id: "q1", title: "Wash Dishes" }),
        makeQuest({ id: "q2", title: "Feed Pets", category: "Pets" }),
      ]
    );
    renderBoard("p1", state);
    expect(screen.getByText("Wash Dishes")).toBeDefined();
    expect(screen.getByText("Feed Pets")).toBeDefined();
  });

  it("renders the FilterSortBar", () => {
    renderBoard();
    expect(screen.getByLabelText("Category")).toBeDefined();
  });

  it("clicking Claim Quest dispatches and immediately shows Awaiting Approval", () => {
    renderBoard();
    const claimButton = screen.getByRole("button", { name: /claim quest/i });
    fireEvent.click(claimButton);
    expect(screen.getByText("Awaiting Approval")).toBeDefined();
  });

  it("filters quest list when a Category filter is applied", () => {
    const state = makeState(
      [makePlayer()],
      [
        makeQuest({ id: "q1", title: "Wash Dishes", category: "Kitchen" }),
        makeQuest({ id: "q2", title: "Feed Pets", category: "Pets" }),
      ]
    );
    renderBoard("p1", state);
    // Select "Kitchen" in the Category filter
    const categorySelect = screen.getByLabelText("Category");
    fireEvent.change(categorySelect, { target: { value: "Kitchen" } });
    // Only Kitchen quest should be visible
    expect(screen.getByText("Wash Dishes")).toBeDefined();
    expect(screen.queryByText("Feed Pets")).toBeNull();
  });

  it("shows the player selection screen when activePlayerId is null", () => {
    const state = makeState([makePlayer()], [makeQuest()]);
    renderBoard(null, state);
    expect(screen.getByText("Who's playing?")).toBeDefined();
  });

  it("renders PlayerSwitcher with player names", () => {
    renderBoard();
    expect(screen.getByRole("navigation", { name: /switch player/i })).toBeDefined();
    expect(screen.getByRole("button", { name: "Alex" })).toBeDefined();
  });

  it("calls onPlayerSelect when a player button is clicked in PlayerSwitcher", () => {
    const state = makeState(
      [
        makePlayer({ id: "p1", name: "Alex" }),
        makePlayer({ id: "p2", name: "Maya" }),
      ],
      [makeQuest()]
    );
    const { onPlayerSelect } = renderBoard("p1", state);
    const mayaButton = screen.getByRole("button", { name: "Maya" });
    fireEvent.click(mayaButton);
    expect(onPlayerSelect).toHaveBeenCalledWith("p2");
  });

  it("renders 'Open Reward Shop' button", () => {
    renderBoard();
    expect(screen.getByRole("button", { name: "Open Reward Shop" })).toBeDefined();
  });

  it("clicking 'Open Reward Shop' button renders RewardShop", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: "Open Reward Shop" }));
    // RewardShopHeader's back button should be visible
    expect(screen.getByRole("button", { name: "Back to Quest Board" })).toBeDefined();
  });

  it("clicking back in RewardShop returns to QuestBoard (quest list visible again)", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: "Open Reward Shop" }));
    expect(screen.getByRole("button", { name: "Back to Quest Board" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Back to Quest Board" }));
    // Quest board should be visible again
    expect(screen.getByRole("heading", { name: "Alex" })).toBeDefined();
  });

  it("renders the Exit button", () => {
    renderBoard();
    expect(screen.getByRole("button", { name: "Exit to home" })).toBeDefined();
  });

  it("clicking Exit calls onExit", () => {
    const { onExit } = renderBoard();
    fireEvent.click(screen.getByRole("button", { name: "Exit to home" }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
