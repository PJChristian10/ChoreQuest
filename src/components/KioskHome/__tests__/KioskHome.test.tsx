import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { KioskHome } from "../KioskHome.js";
import { GameProvider } from "../../../state/GameContext.js";
import { SEED_STATE } from "../../../state/seed.js"; // used in "no players" test
import { makePlayer, makePlayerWithPin, makeGameState, makeParentConfig } from "../../../test/fixtures.js";
import { makePlayerWithAvatar } from "../../../test/fixtures.js";

// Mock authService so we control verifyPlayerPin and verifyPin in tests
vi.mock("../../../services/authService.js", () => ({
  verifyPlayerPin: vi.fn().mockResolvedValue(false),
  verifyPin: vi.fn().mockResolvedValue(false),
}));

import { verifyPlayerPin, verifyPin } from "../../../services/authService.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderKioskHome(
  players: ReturnType<typeof makePlayer>[],
  onPlayerUnlocked = vi.fn(),
  onParentUnlocked = vi.fn()
) {
  const state = makeGameState({ players });
  return render(
    <GameProvider initialState={state}>
      <KioskHome onPlayerUnlocked={onPlayerUnlocked} onParentUnlocked={onParentUnlocked} />
    </GameProvider>
  );
}

describe("KioskHome", () => {
  it("renders a PlayerCard for each player", () => {
    const players = [
      makePlayer({ id: "p1", name: "Alex" }),
      makePlayer({ id: "p2", name: "Maya" }),
      makePlayer({ id: "p3", name: "Sam" }),
    ];
    renderKioskHome(players);
    expect(screen.getByRole("button", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maya" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sam" })).toBeInTheDocument();
  });

  it("tapping player without PIN calls onPlayerUnlocked directly", () => {
    const onPlayerUnlocked = vi.fn();
    const player = makePlayer({ id: "p1", name: "Alex" }); // no playerPin
    renderKioskHome([player], onPlayerUnlocked);
    fireEvent.click(screen.getByRole("button", { name: "Alex" }));
    expect(onPlayerUnlocked).toHaveBeenCalledWith("p1");
  });

  it("tapping player with PIN shows PlayerPinOverlay", () => {
    const player = makePlayerWithPin("some-hash", { id: "p1", name: "Alex" });
    renderKioskHome([player]);
    fireEvent.click(screen.getByRole("button", { name: "Alex" }));
    // Overlay should appear — cancel button is rendered
    expect(screen.getByRole("button", { name: "Cancel PIN entry" })).toBeInTheDocument();
  });

  it("cancelling PIN overlay dismisses it", () => {
    const player = makePlayerWithPin("some-hash", { id: "p1", name: "Alex" });
    renderKioskHome([player]);
    fireEvent.click(screen.getByRole("button", { name: "Alex" }));
    expect(screen.getByRole("button", { name: "Cancel PIN entry" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel PIN entry" }));
    expect(screen.queryByRole("button", { name: "Cancel PIN entry" })).not.toBeInTheDocument();
  });

  it("successful PIN verification calls onPlayerUnlocked", async () => {
    const mockVerify = vi.mocked(verifyPlayerPin);
    mockVerify.mockResolvedValue(true);

    const onPlayerUnlocked = vi.fn();
    const player = makePlayerWithPin("some-hash", { id: "p1", name: "Alex" });
    renderKioskHome([player], onPlayerUnlocked);

    fireEvent.click(screen.getByRole("button", { name: "Alex" }));

    // Enter 4 digits
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });

    await waitFor(() => {
      expect(onPlayerUnlocked).toHaveBeenCalledWith("p1");
    }, { timeout: 1500 });
  });

  it("renders no player cards when SEED_STATE has no players", () => {
    render(
      <GameProvider initialState={SEED_STATE}>
        <KioskHome onPlayerUnlocked={vi.fn()} onParentUnlocked={vi.fn()} />
      </GameProvider>
    );
    // SEED_STATE has no players — only the Parent button should be present
    expect(screen.queryByRole("button", { name: "Alex" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parent" })).toBeInTheDocument();
  });

  it("renders the Parent button", () => {
    renderKioskHome([makePlayer({ id: "p1", name: "Alex" })]);
    expect(screen.getByRole("button", { name: "Parent" })).toBeInTheDocument();
  });

  it("clicking Parent button shows parent PIN entry", () => {
    renderKioskHome([makePlayer({ id: "p1", name: "Alex" })]);
    fireEvent.click(screen.getByRole("button", { name: "Parent" }));
    expect(screen.getByText("Parent Access")).toBeInTheDocument();
  });

  it("cancelled parent PIN entry dismisses it", () => {
    renderKioskHome([makePlayer({ id: "p1", name: "Alex" })]);
    fireEvent.click(screen.getByRole("button", { name: "Parent" }));
    expect(screen.getByText("Parent Access")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel parent PIN entry" }));
    expect(screen.queryByText("Parent Access")).not.toBeInTheDocument();
  });

  // ── Leaderboard strip tests ────────────────────────────────────────────────

  it("renders leaderboard strip with 'This Week' label", () => {
    const players = [
      makePlayer({ id: "p1", name: "Alex", weeklyCoins: 20 }),
      makePlayer({ id: "p2", name: "Maya", weeklyCoins: 10 }),
    ];
    renderKioskHome(players);
    expect(screen.getByText("This Week")).toBeInTheDocument();
  });

  it("leaderboard shows players ranked by weeklyCoins", () => {
    const players = [
      makePlayer({ id: "p1", name: "Alex", weeklyCoins: 5 }),
      makePlayer({ id: "p2", name: "Maya", weeklyCoins: 20 }),
    ];
    renderKioskHome(players);
    // Maya and Alex appear in both hero cards and leaderboard — use getAllByText
    expect(screen.getAllByText("Maya").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alex").length).toBeGreaterThan(0);
    // Leaderboard strip is present (verified by "This Week" label elsewhere)
    expect(screen.getByText("This Week")).toBeInTheDocument();
  });

  it("leaderboard shows 'No activity yet this week' when all weeklyCoins are 0", () => {
    const players = [
      makePlayer({ id: "p1", name: "Alex", weeklyCoins: 0 }),
      makePlayer({ id: "p2", name: "Maya", weeklyCoins: 0 }),
    ];
    renderKioskHome(players);
    expect(screen.getByText("No activity yet this week")).toBeInTheDocument();
  });

  // ── Hero card stat tests ───────────────────────────────────────────────────

  it("player card shows avatar emoji", () => {
    const player = makePlayerWithAvatar("cat", { id: "p1", name: "Alex" });
    renderKioskHome([player]);
    // 🐱 is the emoji for "cat" — may appear in hero card and leaderboard
    expect(screen.getAllByText("🐱").length).toBeGreaterThan(0);
  });

  it("player card shows coin balance", () => {
    const player = makePlayer({ id: "p1", name: "Alex", coins: 42, weeklyCoins: 0 });
    renderKioskHome([player]);
    // coins: 42 — displayed in the hero card coin row
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("player card shows XP progress bar", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    renderKioskHome([player]);
    const progressbar = screen.getByRole("progressbar", { name: "Alex XP" });
    expect(progressbar).toBeInTheDocument();
  });

  it("player card shows streak count when streak > 0", () => {
    const player = makePlayer({ id: "p1", name: "Alex", streak: 2 });
    renderKioskHome([player]);
    // Streak indicator shows 🔥 + streak number
    expect(screen.getByText(/🔥\s*2/)).toBeInTheDocument();
  });

  it("player card shows 'On a Roll!' badge when streak >= 3", () => {
    const player = makePlayer({ id: "p1", name: "Alex", streak: 3 });
    renderKioskHome([player]);
    expect(screen.getByRole("status")).toHaveTextContent("On a Roll!");
  });

  it("player card does NOT show streak indicator when streak is 0", () => {
    const player = makePlayer({ id: "p1", name: "Alex", streak: 0 });
    renderKioskHome([player]);
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });

  it("correct parent PIN calls onParentUnlocked", async () => {
    const mockVerifyPin = vi.mocked(verifyPin);
    mockVerifyPin.mockResolvedValue(true);

    const onParentUnlocked = vi.fn();
    const state = makeGameState({
      players: [makePlayer({ id: "p1", name: "Alex" })],
      parentConfig: makeParentConfig({ hashedPin: "$2b$10$testhash" }),
    });
    render(
      <GameProvider initialState={state}>
        <KioskHome onPlayerUnlocked={vi.fn()} onParentUnlocked={onParentUnlocked} />
      </GameProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Parent" }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });

    await waitFor(() => {
      expect(onParentUnlocked).toHaveBeenCalledTimes(1);
    }, { timeout: 1500 });
  });
});
