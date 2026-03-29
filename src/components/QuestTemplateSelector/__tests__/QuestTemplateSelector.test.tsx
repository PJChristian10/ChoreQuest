import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QuestTemplateSelector } from "../QuestTemplateSelector.js";
import type { QuestTemplate } from "../../../data/templates.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTemplate(overrides: Partial<QuestTemplate> = {}): QuestTemplate {
  return {
    id: "make-bed",
    title: "Make Your Bed",
    icon: "🛏️",
    description: "Straighten your sheets.",
    xpReward: 10,
    coinReward: 8,
    difficulty: 1,
    category: "cleaning",
    recurrence: "daily",
    defaultSelected: true,
    ...overrides,
  };
}

const DAILY_A  = makeTemplate({ id: "t-daily-a",   title: "Make Your Bed",     recurrence: "daily"    });
const DAILY_B  = makeTemplate({ id: "t-daily-b",   title: "Brush Teeth",       recurrence: "daily"    });
const WEEKLY_A = makeTemplate({ id: "t-weekly-a",  title: "Vacuum Your Room",  recurrence: "weekly",  difficulty: 2, xpReward: 30, coinReward: 22 });
const ONETIME  = makeTemplate({ id: "t-onetime",   title: "Clean the Garage",  recurrence: "one-time", difficulty: 3 });

const ALL_TEMPLATES: readonly QuestTemplate[] = [DAILY_A, DAILY_B, WEEKLY_A, ONETIME];

const noop = () => {};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("QuestTemplateSelector — rendering", () => {
  it("renders a card for every template", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText("Make Your Bed")).toBeTruthy();
    expect(screen.getByText("Brush Teeth")).toBeTruthy();
    expect(screen.getByText("Vacuum Your Room")).toBeTruthy();
    expect(screen.getByText("Clean the Garage")).toBeTruthy();
  });

  it("renders the icon for each card", () => {
    render(
      <QuestTemplateSelector
        templates={[makeTemplate({ icon: "🧹", title: "Sweep" })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText("🧹")).toBeTruthy();
  });

  it("renders XP reward on each card", () => {
    render(
      <QuestTemplateSelector
        templates={[makeTemplate({ xpReward: 25, title: "Do Homework" })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText(/25.*XP/i)).toBeTruthy();
  });

  it("renders coin reward on each card", () => {
    render(
      <QuestTemplateSelector
        templates={[makeTemplate({ coinReward: 20 })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText(/20/)).toBeTruthy();
  });

  it("renders difficulty as an accessible image with aria-label", () => {
    render(
      <QuestTemplateSelector
        templates={[makeTemplate({ difficulty: 2, title: "Vacuum" })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("img", { name: /difficulty.*2.*3/i })).toBeTruthy();
  });

  it("renders a recurrence badge on each card", () => {
    render(
      <QuestTemplateSelector
        templates={[makeTemplate({ recurrence: "weekly", title: "Sweep" })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    // "Weekly" appears in both the group heading and the card badge — check at least one exists
    expect(screen.getAllByText("Weekly").length).toBeGreaterThan(0);
  });

  it("renders selection count in the header", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["t-daily-a", "t-weekly-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText(/2 of 4 selected/i)).toBeTruthy();
  });

  it("renders Select All and Clear All buttons", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("button", { name: /select all/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /clear all/i })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Selected state
// ---------------------------------------------------------------------------

describe("QuestTemplateSelector — selected state", () => {
  it("selected card shows a checkmark", () => {
    render(
      <QuestTemplateSelector
        templates={[DAILY_A]}
        selectedIds={new Set(["t-daily-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    const card = screen.getByRole("button", { name: /make your bed/i });
    expect(card.getAttribute("aria-pressed")).toBe("true");
  });

  it("unselected card does not show as pressed", () => {
    render(
      <QuestTemplateSelector
        templates={[DAILY_A]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    const card = screen.getByRole("button", { name: /make your bed/i });
    expect(card.getAttribute("aria-pressed")).toBe("false");
  });

  it("multiple cards can be selected simultaneously", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["t-daily-a", "t-weekly-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(
      screen.getByRole("button", { name: /make your bed/i }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /vacuum your room/i }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /brush teeth/i }).getAttribute("aria-pressed"),
    ).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe("QuestTemplateSelector — interactions", () => {
  it("clicking a card calls onToggle with the template id", () => {
    const onToggle = vi.fn();
    render(
      <QuestTemplateSelector
        templates={[DAILY_A]}
        selectedIds={new Set()}
        onToggle={onToggle}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /make your bed/i }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("t-daily-a");
  });

  it("clicking a selected card still calls onToggle with the template id", () => {
    const onToggle = vi.fn();
    render(
      <QuestTemplateSelector
        templates={[DAILY_A]}
        selectedIds={new Set(["t-daily-a"])}
        onToggle={onToggle}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /make your bed/i }));
    expect(onToggle).toHaveBeenCalledWith("t-daily-a");
  });

  it("Select All button calls onSelectAll", () => {
    const onSelectAll = vi.fn();
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={onSelectAll}
        onClearAll={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /select all/i }));
    expect(onSelectAll).toHaveBeenCalledOnce();
  });

  it("Clear All button calls onClearAll", () => {
    const onClearAll = vi.fn();
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["t-daily-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={onClearAll}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it("each card only calls onToggle once per click", () => {
    const onToggle = vi.fn();
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={onToggle}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /brush teeth/i }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("t-daily-b");
  });
});

// ---------------------------------------------------------------------------
// Warning
// ---------------------------------------------------------------------------

describe("QuestTemplateSelector — minimum-selection warning", () => {
  it("shows warning when selectedIds.size is below the default minSelection of 3", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["t-daily-a", "t-daily-b"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("shows warning when nothing is selected", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("hides warning when selectedIds.size equals minSelection", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["t-daily-a", "t-daily-b", "t-weekly-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("hides warning when selectedIds.size exceeds minSelection", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["t-daily-a", "t-daily-b", "t-weekly-a", "t-onetime"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("respects a custom minSelection prop", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["t-daily-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
        minSelection={1}
      />,
    );
    // 1 selected >= minSelection of 1 → no warning
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("warning message mentions the required minimum count", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
        minSelection={5}
      />,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/5/);
  });
});

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

describe("QuestTemplateSelector — group headings", () => {
  it("renders a Daily group heading", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: "Daily" })).toBeTruthy();
  });

  it("renders a Weekly group heading", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: "Weekly" })).toBeTruthy();
  });

  it("renders a One-time group heading when one-time templates are present", () => {
    render(
      <QuestTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: "One-time" })).toBeTruthy();
  });

  it("omits a group heading when no templates belong to that recurrence", () => {
    // Only daily templates — no Weekly or One-time headings
    render(
      <QuestTemplateSelector
        templates={[DAILY_A, DAILY_B]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.queryByText("Weekly")).toBeNull();
    expect(screen.queryByText("One-time")).toBeNull();
  });

  it("group headings appear in Daily → Weekly → One-time order in the document", () => {
    render(
      <QuestTemplateSelector
        templates={[ONETIME, WEEKLY_A, DAILY_A]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    // Find all group headings (they use role="heading" at level 3)
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((el) => el.textContent ?? "");

    const dailyIdx   = headings.indexOf("Daily");
    const weeklyIdx  = headings.indexOf("Weekly");
    const onetimeIdx = headings.indexOf("One-time");

    expect(dailyIdx).not.toBe(-1);
    expect(weeklyIdx).not.toBe(-1);
    expect(onetimeIdx).not.toBe(-1);
    expect(dailyIdx).toBeLessThan(weeklyIdx);
    expect(weeklyIdx).toBeLessThan(onetimeIdx);
  });

  it("each template appears under its correct group", () => {
    render(
      <QuestTemplateSelector
        templates={[DAILY_A, WEEKLY_A]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    // "Make Your Bed" (daily) should appear after the Daily heading
    // and before the Weekly heading in DOM order.
    const allText = document.body.textContent ?? "";
    const dailyHeadingPos  = allText.indexOf("Daily");
    const weeklyHeadingPos = allText.indexOf("Weekly");
    const makeBedPos       = allText.indexOf("Make Your Bed");
    const vacuumPos        = allText.indexOf("Vacuum Your Room");

    expect(makeBedPos).toBeGreaterThan(dailyHeadingPos);
    expect(makeBedPos).toBeLessThan(weeklyHeadingPos);
    expect(vacuumPos).toBeGreaterThan(weeklyHeadingPos);
  });
});
