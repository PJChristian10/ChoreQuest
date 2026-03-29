import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { LevelPath } from "../LevelPath.js";
import { makePlayer } from "../../../test/fixtures.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPath(players = [makePlayer()]) {
  return render(<LevelPath players={players} />);
}

// ---------------------------------------------------------------------------
// Rendering — 10 nodes
// ---------------------------------------------------------------------------

describe("LevelPath — node rendering", () => {
  it("renders buttons for all 10 levels", () => {
    renderPath([]);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(10);
  });

  it("renders aria-labels for each level title", () => {
    renderPath([]);
    expect(screen.getByRole("button", { name: /Level 1: Apprentice/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Level 5: Knight/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Level 10: Grand Master/i })).toBeDefined();
  });

  it("renders the strip as a nav with the correct aria-label", () => {
    renderPath([]);
    expect(
      screen.getByRole("navigation", { name: /level progression path/i })
    ).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Node states
// ---------------------------------------------------------------------------

describe("LevelPath — node states", () => {
  it("marks node 4 as active when a player is at level 4", () => {
    const player = makePlayer({ level: 4 });
    renderPath([player]);
    // Active node shows the level number inside the circle
    const btn = screen.getByRole("button", { name: /Level 4: Ranger/i });
    expect(btn.className).toMatch(/node_active/);
  });

  it("shows player avatar above their current level node", () => {
    const player = makePlayer({ id: "p1", level: 4, avatar: "cat" });
    renderPath([player]);
    // Avatar emoji for "cat" is 🐱
    expect(screen.getByLabelText(/Players at level 4/i)).toBeDefined();
    expect(screen.getByLabelText("p1" in {} ? "" : player.name)).toBeDefined();
  });

  it("marks nodes 1–3 as completed when all players are past level 3", () => {
    const player = makePlayer({ level: 4 });
    renderPath([player]);
    [1, 2, 3].forEach((lvl) => {
      const btn = screen.getByRole("button", { name: new RegExp(`Level ${lvl}:`, "i") });
      expect(btn.className).toMatch(/node_completed/);
    });
  });

  it("marks a node as locked when no player has reached it", () => {
    const player = makePlayer({ level: 2 });
    renderPath([player]);
    const btn = screen.getByRole("button", { name: /Level 7: Guardian/i });
    expect(btn.className).toMatch(/node_locked/);
  });

  it("marks all nodes as locked when players array is empty", () => {
    renderPath([]);
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn.className).toMatch(/node_locked/);
    });
  });
});

// ---------------------------------------------------------------------------
// Multiple players at the same level
// ---------------------------------------------------------------------------

describe("LevelPath — multiple players at the same level", () => {
  it("shows both players' avatars when they share a level", () => {
    const p1 = makePlayer({ id: "p1", name: "Alex", level: 3, avatar: "cat" });
    const p2 = makePlayer({ id: "p2", name: "Maya", level: 3, avatar: "dog" });
    renderPath([p1, p2]);
    const avatarRow = screen.getByLabelText(/Players at level 3/i);
    expect(avatarRow.querySelectorAll("span")).toHaveLength(2);
  });

  it("renders each player name as title attribute on their avatar bubble", () => {
    const p1 = makePlayer({ id: "p1", name: "Alex", level: 3, avatar: "cat" });
    const p2 = makePlayer({ id: "p2", name: "Maya", level: 3, avatar: "dog" });
    renderPath([p1, p2]);
    expect(screen.getByTitle("Alex")).toBeDefined();
    expect(screen.getByTitle("Maya")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tooltip — tap to open
// ---------------------------------------------------------------------------

describe("LevelPath — tooltip", () => {
  it("shows no tooltip initially", () => {
    renderPath([]);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows a tooltip with title and perk when a node is tapped", () => {
    renderPath([]);
    fireEvent.click(screen.getByRole("button", { name: /Level 3: Scout/i }));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("Scout");
    expect(tooltip.textContent).toContain("Medium difficulty quests unlocked");
  });

  it("tooltip contains the XP threshold for the level", () => {
    renderPath([]);
    fireEvent.click(screen.getByRole("button", { name: /Level 5: Knight/i }));
    expect(screen.getByRole("tooltip").textContent).toContain("900");
  });

  it("tapping the same node a second time closes the tooltip", () => {
    renderPath([]);
    const btn = screen.getByRole("button", { name: /Level 2: Squire/i });
    fireEvent.click(btn);
    expect(screen.getByRole("tooltip")).toBeDefined();
    fireEvent.click(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("tapping a different node switches the tooltip to the new node", () => {
    renderPath([]);
    fireEvent.click(screen.getByRole("button", { name: /Level 1: Apprentice/i }));
    expect(screen.getByRole("tooltip").textContent).toContain("Apprentice");
    fireEvent.click(screen.getByRole("button", { name: /Level 6: Champion/i }));
    expect(screen.getByRole("tooltip").textContent).toContain("Champion");
    expect(screen.getByRole("tooltip").textContent).not.toContain("Apprentice");
  });
});

// ---------------------------------------------------------------------------
// Tooltip — auto-dismiss after 3 seconds
// ---------------------------------------------------------------------------

describe("LevelPath — tooltip auto-dismiss", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("tooltip disappears after 3 seconds", () => {
    renderPath([]);
    fireEvent.click(screen.getByRole("button", { name: /Level 4: Ranger/i }));
    expect(screen.getByRole("tooltip")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("tooltip is still visible before 3 seconds have elapsed", () => {
    renderPath([]);
    fireEvent.click(screen.getByRole("button", { name: /Level 4: Ranger/i }));

    act(() => {
      vi.advanceTimersByTime(2999);
    });

    expect(screen.getByRole("tooltip")).toBeDefined();
  });
});
