import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { PlayerManagementTab } from "../PlayerManagementTab.js";
import { GameProvider } from "../../../../../state/GameContext.js";
import {
  makeGameState,
  makePlayer,
  makeActiveSession,
} from "../../../../../test/fixtures.js";

// hashPin is async (bcrypt) — stub it to keep tests fast
vi.mock("../../../../../services/authService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../../services/authService.js")>();
  return {
    ...actual,
    hashPin: vi.fn(async (pin: string) => `hashed:${pin}`),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderPlayerManagementTab(
  state = makeGameState({ parentSession: makeActiveSession() }),
  onSessionExpired = vi.fn()
) {
  return render(
    <GameProvider skipSync={true} initialState={state}>
      <PlayerManagementTab onSessionExpired={onSessionExpired} />
    </GameProvider>
  );
}

describe("PlayerManagementTab", () => {
  it("renders a card for each player", () => {
    const state = makeGameState({
      players: [
        makePlayer({ id: "p1", name: "Alex" }),
        makePlayer({ id: "p2", name: "Maya" }),
      ],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
  });

  it("each card shows player stats (Level, XP, Coins, Streak)", () => {
    const player = makePlayer({
      id: "p1",
      name: "Alex",
      level: 3,
      xp: 100,
      coins: 50,
      streak: 5,
    });
    const state = makeGameState({
      players: [player],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    expect(screen.getByText(/Level 3/)).toBeInTheDocument();
    expect(screen.getByText(/100 XP/)).toBeInTheDocument();
    expect(screen.getByText(/50 coins/)).toBeInTheDocument();
    expect(screen.getByText(/5 streak/i)).toBeInTheDocument();
  });

  it("clicking 'Edit Player' shows edit form", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" })],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Edit Alex" }));
    expect(screen.getByRole("textbox", { name: "Player name" })).toBeInTheDocument();
  });

  it("edit form has name input pre-filled", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" })],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Edit Alex" }));
    expect(screen.getByRole("textbox", { name: "Player name" })).toHaveValue("Alex");
  });

  it("edit form has AvatarPicker", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" })],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Edit Alex" }));
    // AvatarPicker renders a radiogroup
    expect(screen.getByRole("radiogroup", { name: "Choose your avatar" })).toBeInTheDocument();
  });

  it("saving edit form dispatches UPDATE_PLAYER", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" })],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Edit Alex" }));

    fireEvent.change(screen.getByRole("textbox", { name: "Player name" }), {
      target: { value: "Alexander" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save player" }));

    // Updated name should be visible
    expect(screen.getByText("Alexander")).toBeInTheDocument();
    // Form should be closed
    expect(screen.queryByRole("textbox", { name: "Player name" })).not.toBeInTheDocument();
  });

  it("coin adjustment form dispatches UPDATE_PLAYER with new coin amount", () => {
    const player = makePlayer({ id: "p1", name: "Alex", coins: 50 });
    const state = makeGameState({
      players: [player],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Edit Alex" }));

    // Find coin adjustment input
    const coinInput = screen.getByRole("spinbutton", { name: "Coin adjustment" });
    fireEvent.change(coinInput, { target: { value: "20" } });

    const reasonInput = screen.getByRole("textbox", { name: "Adjustment reason" });
    fireEvent.change(reasonInput, { target: { value: "Bonus" } });

    fireEvent.click(screen.getByRole("button", { name: "Apply coin adjustment" }));

    // Coin adjustment applied — player now has 70 coins
    expect(screen.getByText(/70 coins/)).toBeInTheDocument();
  });

  it("each card has a Delete button", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" })],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    expect(screen.getByRole("button", { name: "Delete Alex" })).toBeInTheDocument();
  });

  it("clicking Delete shows a confirmation prompt", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" })],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Delete Alex" }));
    expect(screen.getByRole("button", { name: "Confirm delete Alex" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel delete" })).toBeInTheDocument();
  });

  it("confirming delete removes the player", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" }), makePlayer({ id: "p2", name: "Maya" })],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Delete Alex" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete Alex" }));
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
  });

  it("cancelling delete hides the confirmation and keeps the player", () => {
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" })],
      parentSession: makeActiveSession(),
    });
    renderPlayerManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Delete Alex" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel delete" }));
    expect(screen.queryByRole("button", { name: "Confirm delete Alex" })).not.toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  describe("Add Player", () => {
    it("shows Add Player button", () => {
      renderPlayerManagementTab();
      expect(screen.getByRole("button", { name: "Add new player" })).toBeInTheDocument();
    });

    it("clicking Add Player button shows the add form", () => {
      renderPlayerManagementTab();
      fireEvent.click(screen.getByRole("button", { name: "Add new player" }));
      expect(screen.getByRole("textbox", { name: "Player name" })).toBeInTheDocument();
    });

    it("shows Cancel button inside the add form", () => {
      renderPlayerManagementTab();
      fireEvent.click(screen.getByRole("button", { name: "Add new player" }));
      expect(screen.getByRole("button", { name: "Cancel add player" })).toBeInTheDocument();
    });

    it("Cancel hides the add form", () => {
      renderPlayerManagementTab();
      fireEvent.click(screen.getByRole("button", { name: "Add new player" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel add player" }));
      expect(screen.queryByRole("textbox", { name: "Player name" })).not.toBeInTheDocument();
    });

    it("adding a player dispatches ADD_PLAYER and shows the new player", async () => {
      renderPlayerManagementTab();
      fireEvent.click(screen.getByRole("button", { name: "Add new player" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Player name" }), {
        target: { value: "Jordan" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Add Player" }));
      await waitFor(() => expect(screen.getByText("Jordan")).toBeInTheDocument());
    });

    it("hides the add form after a player is added", async () => {
      renderPlayerManagementTab();
      fireEvent.click(screen.getByRole("button", { name: "Add new player" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Player name" }), {
        target: { value: "Jordan" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Add Player" }));
      await waitFor(() =>
        expect(screen.queryByRole("textbox", { name: "Player name" })).not.toBeInTheDocument()
      );
    });

    it("shows empty state when there are no players", () => {
      renderPlayerManagementTab();
      expect(screen.getByText("No players yet.")).toBeInTheDocument();
    });

    it("empty state has an Add Your First Player button", () => {
      renderPlayerManagementTab();
      expect(screen.getByRole("button", { name: "Add first player" })).toBeInTheDocument();
    });

    it("Add Your First Player button opens the add form", () => {
      renderPlayerManagementTab();
      fireEvent.click(screen.getByRole("button", { name: "Add first player" }));
      expect(screen.getByRole("textbox", { name: "Player name" })).toBeInTheDocument();
    });

    it("empty state is not shown when players exist", () => {
      const state = makeGameState({
        players: [makePlayer({ id: "p1", name: "Alex" })],
        parentSession: makeActiveSession(),
      });
      renderPlayerManagementTab(state);
      expect(screen.queryByText("No players yet.")).not.toBeInTheDocument();
    });
  });
});
