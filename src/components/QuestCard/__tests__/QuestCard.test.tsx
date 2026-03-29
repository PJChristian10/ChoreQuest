import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QuestCard } from "../index";
import type { Quest, QuestClaim } from "../../../models/quest";

afterEach(() => {
  cleanup();
});

const BASE_QUEST: Quest = {
  id: "q1",
  title: "Wash the Dishes",
  icon: "🍳",
  artKey: "dishes",
  description: "",
  xpReward: 15,
  coinReward: 10,
  difficulty: 2,
  recurrence: "daily",
  category: "kitchen",
  isActive: true,
  createdBy: "seed",
  createdAt: new Date("2026-01-01T00:00:00Z"),
} as Quest;

// Minimal claim stubs — deriveStatus only reads claim.status
const pendingClaim = { status: "pending" } as unknown as QuestClaim;
const approvedClaim = { status: "approved" } as unknown as QuestClaim;
const deniedClaim = { status: "denied" } as unknown as QuestClaim;

// ── Rendering ─────────────────────────────────────────────────────────────────

describe("QuestCard rendering", () => {
  it("renders the quest title", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    expect(screen.getByText("Wash the Dishes")).toBeTruthy();
  });

  it("renders the quest category", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    expect(screen.getByText("Kitchen")).toBeTruthy();
  });

  it("renders the XP reward", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    expect(screen.getByText(/15.*XP/i)).toBeTruthy();
  });

  it("renders the coin reward", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    expect(screen.getByText(/\+10/)).toBeTruthy();
  });

  it("renders difficulty as an accessible image", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    expect(
      screen.getByRole("img", { name: /difficulty.*2.*3/i })
    ).toBeTruthy();
  });

  it("renders the art emoji for the quest", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    // artKey "dishes" → emoji "🍽️"
    expect(screen.getByText("🍽️")).toBeTruthy();
  });
});

// ── Available status ──────────────────────────────────────────────────────────

describe("QuestCard available status", () => {
  it("shows a Claim Quest button", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    expect(screen.getByRole("button", { name: /claim quest/i })).toBeTruthy();
  });

  it("Claim Quest button has minimum 60px height", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    const button = screen.getByRole("button", { name: /claim quest/i });
    expect(button).toHaveStyle({ minHeight: "60px" });
  });

  it("Claim Quest button has minimum 60px width", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    const button = screen.getByRole("button", { name: /claim quest/i });
    expect(button).toHaveStyle({ minWidth: "60px" });
  });

  it("calls onClaim with the quest id when Claim Quest is clicked", () => {
    const onClaim = vi.fn();
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} onClaim={onClaim} />);
    fireEvent.click(screen.getByRole("button", { name: /claim quest/i }));
    expect(onClaim).toHaveBeenCalledWith("q1");
  });

  it("does not throw when onClaim is not provided and button is clicked", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: /claim quest/i }));
    }).not.toThrow();
  });

  it("Claim Quest button is not disabled for an active available quest", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={null} />);
    const button = screen.getByRole("button", { name: /claim quest/i });
    expect(button).not.toBeDisabled();
  });
});

// ── awaiting_approval status ──────────────────────────────────────────────────

describe("QuestCard awaiting_approval status", () => {
  it("shows Awaiting Approval text", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={pendingClaim} />);
    expect(screen.getByText(/awaiting approval/i)).toBeTruthy();
  });

  it("shows a lock icon with accessible label", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={pendingClaim} />);
    expect(
      screen.getByRole("img", { name: /awaiting approval/i })
    ).toBeTruthy();
  });

  it("does not show Claim Quest button when awaiting approval", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={pendingClaim} />);
    expect(
      screen.queryByRole("button", { name: /claim quest/i })
    ).toBeNull();
  });
});

// ── approved status ───────────────────────────────────────────────────────────

describe("QuestCard approved status", () => {
  it("shows Complete text", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={approvedClaim} />);
    expect(screen.getByText(/complete/i)).toBeTruthy();
  });

  it("shows a checkmark icon with accessible label", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={approvedClaim} />);
    expect(
      screen.getByRole("img", { name: /quest complete/i })
    ).toBeTruthy();
  });

  it("does not show Claim Quest button when approved", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={approvedClaim} />);
    expect(
      screen.queryByRole("button", { name: /claim quest/i })
    ).toBeNull();
  });
});

// ── inactive quest ────────────────────────────────────────────────────────────

describe("QuestCard inactive quest", () => {
  it("Claim Quest button is disabled when isActive is false", () => {
    const inactiveQuest = { ...BASE_QUEST, isActive: false } as Quest;
    render(<QuestCard quest={inactiveQuest} activeClaim={null} disabled={true} />);
    const button = screen.getByRole("button", { name: /claim quest/i });
    expect(button).toBeDisabled();
  });
});

// ── denied status ─────────────────────────────────────────────────────────────

describe("QuestCard denied status", () => {
  it("shows Try Again button when status is denied", () => {
    render(<QuestCard quest={BASE_QUEST} activeClaim={deniedClaim} />);
    expect(screen.getByRole("button", { name: /re-claim quest/i })).toBeTruthy();
  });
});
