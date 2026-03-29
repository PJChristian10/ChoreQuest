import { describe, it, expect } from "vitest";
import type { Quest } from "../../models/quest";
import {
  filterQuests,
  sortQuests,
  applyFiltersAndSort,
  getUniqueCategories,
  DEFAULT_FILTER_SORT,
} from "../questFilters";

const Q1: Quest = {
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
};
const Q2: Quest = {
  id: "q2",
  title: "Vacuum",
  icon: "🧹",
  category: "Cleaning",
  recurrence: "weekly",
  difficulty: 2,
  xpReward: 40,
  coinReward: 25,
  status: "available",
  isActive: true,
};
const Q3: Quest = {
  id: "q3",
  title: "Feed Pets",
  icon: "🐾",
  category: "Pets",
  recurrence: "daily",
  difficulty: 1,
  xpReward: 15,
  coinReward: 10,
  status: "available",
  isActive: true,
};
const Q4: Quest = {
  id: "q4",
  title: "Deep Clean",
  icon: "✨",
  category: "Cleaning",
  recurrence: "one-time",
  difficulty: 3,
  xpReward: 75,
  coinReward: 50,
  status: "available",
  isActive: true,
};
const Q5: Quest = {
  id: "q5",
  title: "Water Garden",
  icon: "🌱",
  category: "Garden",
  recurrence: "weekly",
  difficulty: 2,
  xpReward: 35,
  coinReward: 22,
  status: "available",
  isActive: true,
};
const ALL: readonly Quest[] = [Q1, Q2, Q3, Q4, Q5];

describe("filterQuests", () => {
  it("returns all quests when all filters are 'all'", () => {
    const result = filterQuests(ALL, { category: "all", recurrence: "all", difficulty: "all" });
    expect(result).toEqual(ALL);
  });

  it("filters by category — only Kitchen quests returned", () => {
    const result = filterQuests(ALL, { category: "Kitchen", recurrence: "all", difficulty: "all" });
    expect(result).toEqual([Q1]);
  });

  it("filters by recurrence — only daily quests returned", () => {
    const result = filterQuests(ALL, { category: "all", recurrence: "daily", difficulty: "all" });
    expect(result).toEqual([Q1, Q3]);
  });

  it("filters by difficulty — only difficulty 2 quests returned", () => {
    const result = filterQuests(ALL, { category: "all", recurrence: "all", difficulty: "2" });
    expect(result).toEqual([Q2, Q5]);
  });

  it("AND-combines category + recurrence — Cleaning weekly only", () => {
    const result = filterQuests(ALL, { category: "Cleaning", recurrence: "weekly", difficulty: "all" });
    expect(result).toEqual([Q2]);
  });

  it("AND-combines all three filters — Cleaning weekly difficulty 2 only", () => {
    const result = filterQuests(ALL, { category: "Cleaning", recurrence: "weekly", difficulty: "2" });
    expect(result).toEqual([Q2]);
  });

  it("returns empty array when no quests match the filters", () => {
    const result = filterQuests(ALL, { category: "Kitchen", recurrence: "weekly", difficulty: "all" });
    expect(result).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input: Quest[] = [...ALL];
    filterQuests(input, { category: "Kitchen", recurrence: "all", difficulty: "all" });
    expect(input).toEqual([...ALL]);
  });
});

describe("sortQuests", () => {
  it("'default' returns quests in original order", () => {
    const result = sortQuests(ALL, "default");
    expect(result).toEqual([Q1, Q2, Q3, Q4, Q5]);
  });

  it("'xp-desc' orders by xpReward descending (75, 40, 35, 15, 15)", () => {
    const result = sortQuests(ALL, "xp-desc");
    expect(result.map((q) => q.xpReward)).toEqual([75, 40, 35, 15, 15]);
  });

  it("'xp-asc' orders by xpReward ascending (15, 15, 35, 40, 75)", () => {
    const result = sortQuests(ALL, "xp-asc");
    expect(result.map((q) => q.xpReward)).toEqual([15, 15, 35, 40, 75]);
  });

  it("'coins-desc' orders by coinReward descending (50, 25, 22, 10, 10)", () => {
    const result = sortQuests(ALL, "coins-desc");
    expect(result.map((q) => q.coinReward)).toEqual([50, 25, 22, 10, 10]);
  });

  it("'difficulty-asc' orders by difficulty ascending (1,1 then 2,2 then 3)", () => {
    const result = sortQuests(ALL, "difficulty-asc");
    expect(result.map((q) => q.difficulty)).toEqual([1, 1, 2, 2, 3]);
  });

  it("'difficulty-desc' orders by difficulty descending (3 then 2,2 then 1,1)", () => {
    const result = sortQuests(ALL, "difficulty-desc");
    expect(result.map((q) => q.difficulty)).toEqual([3, 2, 2, 1, 1]);
  });

  it("does not mutate the input array", () => {
    const input: Quest[] = [...ALL];
    sortQuests(input, "xp-desc");
    expect(input).toEqual([...ALL]);
  });
});

describe("applyFiltersAndSort", () => {
  it("filter then sort: Kitchen daily filtered then sorted xp-desc", () => {
    // Q1 is Kitchen+daily, Q3 is Pets+daily — only Q1 matches Kitchen
    const result = applyFiltersAndSort(ALL, {
      category: "Kitchen",
      recurrence: "daily",
      difficulty: "all",
      sortBy: "xp-desc",
    });
    expect(result).toEqual([Q1]);
  });

  it("all 'all' + default returns all quests in original order", () => {
    const result = applyFiltersAndSort(ALL, DEFAULT_FILTER_SORT);
    expect(result).toEqual([Q1, Q2, Q3, Q4, Q5]);
  });
});

describe("getUniqueCategories", () => {
  it("extracts unique categories from quests", () => {
    const result = getUniqueCategories(ALL);
    expect(result).toContain("Kitchen");
    expect(result).toContain("Cleaning");
    expect(result).toContain("Pets");
    expect(result).toContain("Garden");
    expect(result).toHaveLength(4);
  });

  it("returns categories in sorted alphabetical order", () => {
    const result = getUniqueCategories(ALL);
    expect(result).toEqual(["Cleaning", "Garden", "Kitchen", "Pets"]);
  });

  it("returns empty array for empty input", () => {
    const result = getUniqueCategories([]);
    expect(result).toEqual([]);
  });
});
