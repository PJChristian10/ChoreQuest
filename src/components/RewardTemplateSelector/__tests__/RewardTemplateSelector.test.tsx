import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RewardTemplateSelector } from "../RewardTemplateSelector.js";
import type { RewardTemplate } from "../../../data/templates.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTemplate(overrides: Partial<RewardTemplate> = {}): RewardTemplate {
  return {
    id: "extra-screen-time-30",
    title: "Extra Screen Time (30 min)",
    icon: "📱",
    description: "Earn 30 extra minutes.",
    coinCost: 40,
    category: "screen_time",
    stock: -1,
    defaultSelected: true,
    ...overrides,
  };
}

// One per tier
const BUDGET_A  = makeTemplate({ id: "r-budget-a",  title: "Special Dessert",     coinCost: 50,  category: "food_treats"   });
const BUDGET_B  = makeTemplate({ id: "r-budget-b",  title: "Screen Time 30 min",  coinCost: 40,  category: "screen_time"   });
const MID_A     = makeTemplate({ id: "r-mid-a",     title: "Movie Night Pick",     coinCost: 90,  category: "activities"    });
const MID_B     = makeTemplate({ id: "r-mid-b",     title: "Stay Up Late",         coinCost: 150, category: "privileges"    });
const PREMIUM_A = makeTemplate({ id: "r-premium-a", title: "Small Toy or Book",    coinCost: 200, category: "physical_items" });
const PREMIUM_B = makeTemplate({ id: "r-premium-b", title: "Screen Time 1 Hour",   coinCost: 200, category: "screen_time"   });

const ALL_TEMPLATES: readonly RewardTemplate[] = [
  BUDGET_A, BUDGET_B, MID_A, MID_B, PREMIUM_A, PREMIUM_B,
];

const noop = () => {};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("RewardTemplateSelector — rendering", () => {
  it("renders a card for every template", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText("Special Dessert")).toBeTruthy();
    expect(screen.getByText("Screen Time 30 min")).toBeTruthy();
    expect(screen.getByText("Movie Night Pick")).toBeTruthy();
    expect(screen.getByText("Stay Up Late")).toBeTruthy();
    expect(screen.getByText("Small Toy or Book")).toBeTruthy();
    expect(screen.getByText("Screen Time 1 Hour")).toBeTruthy();
  });

  it("renders the icon for each card", () => {
    render(
      <RewardTemplateSelector
        templates={[makeTemplate({ icon: "🎬", title: "Movie" })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText("🎬")).toBeTruthy();
  });

  it("renders the coin cost on each card", () => {
    render(
      <RewardTemplateSelector
        templates={[makeTemplate({ coinCost: 75, title: "Dinner Choice" })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText(/75/)).toBeTruthy();
  });

  it("renders a category badge on each card", () => {
    render(
      <RewardTemplateSelector
        templates={[makeTemplate({ category: "activities", title: "Park Trip", coinCost: 60 })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    // Category badge renders the category label
    expect(screen.getByText(/activities/i)).toBeTruthy();
  });

  it("renders selection count in the header", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["r-budget-a", "r-mid-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText(/2 of 6 selected/i)).toBeTruthy();
  });

  it("renders Select All and Clear All buttons", () => {
    render(
      <RewardTemplateSelector
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

  it("renders the age hint banner", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText(/younger kids/i)).toBeTruthy();
  });

  it("age hint banner mentions the coin threshold", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText(/150 coins/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Selected state
// ---------------------------------------------------------------------------

describe("RewardTemplateSelector — selected state", () => {
  it("selected card has aria-pressed true", () => {
    render(
      <RewardTemplateSelector
        templates={[BUDGET_A]}
        selectedIds={new Set(["r-budget-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    const card = screen.getByRole("button", { name: /special dessert/i });
    expect(card.getAttribute("aria-pressed")).toBe("true");
  });

  it("unselected card has aria-pressed false", () => {
    render(
      <RewardTemplateSelector
        templates={[BUDGET_A]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    const card = screen.getByRole("button", { name: /special dessert/i });
    expect(card.getAttribute("aria-pressed")).toBe("false");
  });

  it("multiple cards can be selected simultaneously", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["r-budget-a", "r-premium-a"])}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(
      screen.getByRole("button", { name: /special dessert/i }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /small toy/i }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /movie night/i }).getAttribute("aria-pressed"),
    ).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe("RewardTemplateSelector — interactions", () => {
  it("clicking a card calls onToggle with the template id", () => {
    const onToggle = vi.fn();
    render(
      <RewardTemplateSelector
        templates={[BUDGET_A]}
        selectedIds={new Set()}
        onToggle={onToggle}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /special dessert/i }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("r-budget-a");
  });

  it("clicking a selected card still calls onToggle with the template id", () => {
    const onToggle = vi.fn();
    render(
      <RewardTemplateSelector
        templates={[BUDGET_A]}
        selectedIds={new Set(["r-budget-a"])}
        onToggle={onToggle}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /special dessert/i }));
    expect(onToggle).toHaveBeenCalledWith("r-budget-a");
  });

  it("Select All button calls onSelectAll", () => {
    const onSelectAll = vi.fn();
    render(
      <RewardTemplateSelector
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
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set(["r-budget-a"])}
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
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={onToggle}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /movie night/i }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("r-mid-a");
  });
});

// ---------------------------------------------------------------------------
// Tier grouping
// ---------------------------------------------------------------------------

describe("RewardTemplateSelector — tier group headings", () => {
  it("renders a Budget tier heading", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /budget/i })).toBeTruthy();
  });

  it("renders a Mid-tier heading", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /mid.tier/i })).toBeTruthy();
  });

  it("renders a Premium tier heading", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /premium/i })).toBeTruthy();
  });

  it("omits a tier heading when no templates belong to that tier", () => {
    // Only budget templates — no Mid-tier or Premium headings
    render(
      <RewardTemplateSelector
        templates={[BUDGET_A, BUDGET_B]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.queryByRole("heading", { name: /mid.tier/i })).toBeNull();
    expect(screen.queryByRole("heading", { name: /premium/i })).toBeNull();
  });

  it("tier headings appear in Budget → Mid-tier → Premium order in the document", () => {
    render(
      <RewardTemplateSelector
        templates={[PREMIUM_A, MID_A, BUDGET_A]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((el) => el.textContent ?? "");

    const budgetIdx  = headings.findIndex((h) => /budget/i.test(h));
    const midIdx     = headings.findIndex((h) => /mid.tier/i.test(h));
    const premiumIdx = headings.findIndex((h) => /premium/i.test(h));

    expect(budgetIdx).not.toBe(-1);
    expect(midIdx).not.toBe(-1);
    expect(premiumIdx).not.toBe(-1);
    expect(budgetIdx).toBeLessThan(midIdx);
    expect(midIdx).toBeLessThan(premiumIdx);
  });

  it("each tier renders a subtitle note", () => {
    render(
      <RewardTemplateSelector
        templates={ALL_TEMPLATES}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByText(/few days/i)).toBeTruthy();
    expect(screen.getByText(/1.2 weeks/i)).toBeTruthy();
    expect(screen.getByText(/milestone/i)).toBeTruthy();
  });

  it("budget template appears under the Budget heading in the document", () => {
    render(
      <RewardTemplateSelector
        templates={[BUDGET_A, MID_A]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    const allText = document.body.textContent ?? "";
    const budgetPos  = allText.search(/budget/i);
    const midPos     = allText.search(/mid.tier/i);
    const dessertPos = allText.indexOf("Special Dessert");
    const moviePos   = allText.indexOf("Movie Night Pick");

    expect(dessertPos).toBeGreaterThan(budgetPos);
    expect(dessertPos).toBeLessThan(midPos);
    expect(moviePos).toBeGreaterThan(midPos);
  });

  it("boundary: coinCost exactly 75 goes into Budget tier", () => {
    render(
      <RewardTemplateSelector
        templates={[makeTemplate({ id: "r-75", title: "Boundary 75", coinCost: 75 })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /budget/i })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /mid.tier/i })).toBeNull();
  });

  it("boundary: coinCost exactly 76 goes into Mid-tier", () => {
    render(
      <RewardTemplateSelector
        templates={[makeTemplate({ id: "r-76", title: "Boundary 76", coinCost: 76 })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /mid.tier/i })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /budget/i })).toBeNull();
  });

  it("boundary: coinCost exactly 199 goes into Mid-tier", () => {
    render(
      <RewardTemplateSelector
        templates={[makeTemplate({ id: "r-199", title: "Boundary 199", coinCost: 199 })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /mid.tier/i })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /premium/i })).toBeNull();
  });

  it("boundary: coinCost exactly 200 goes into Premium tier", () => {
    render(
      <RewardTemplateSelector
        templates={[makeTemplate({ id: "r-200", title: "Boundary 200", coinCost: 200 })]}
        selectedIds={new Set()}
        onToggle={noop}
        onSelectAll={noop}
        onClearAll={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /premium/i })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /mid.tier/i })).toBeNull();
  });
});
