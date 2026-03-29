import type { Quest } from "../models/quest";

export interface QuestFilterOptions {
  category: string;   // "all" or a specific category string
  recurrence: string; // "all" | "daily" | "weekly" | "one-time" | "bonus"
  difficulty: string; // "all" | "1" | "2" | "3"  (string to match <select> values)
}

export type QuestSortKey =
  | "default"
  | "xp-desc"
  | "xp-asc"
  | "coins-desc"
  | "difficulty-asc"
  | "difficulty-desc";

export interface QuestFilterSortOptions extends QuestFilterOptions {
  sortBy: QuestSortKey;
}

export const DEFAULT_FILTER_SORT: QuestFilterSortOptions = {
  category: "all",
  recurrence: "all",
  difficulty: "all",
  sortBy: "default",
};

/**
 * AND-combine all active filters. "all" means that dimension is not filtered.
 * Returns a new array — never mutates the input.
 */
export function filterQuests(
  quests: readonly Quest[],
  options: QuestFilterOptions
): readonly Quest[] {
  return quests.filter((quest) => {
    if (options.category !== "all" && quest.category !== options.category) {
      return false;
    }
    if (options.recurrence !== "all" && quest.recurrence !== options.recurrence) {
      return false;
    }
    if (options.difficulty !== "all") {
      const diffNum = parseInt(options.difficulty, 10);
      if (quest.difficulty !== diffNum) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Sort a quest list by the given key. "default" preserves original order.
 * Returns a new array — never mutates the input.
 * For equal values, uses quest.id as a stable tie-breaker.
 */
export function sortQuests(
  quests: readonly Quest[],
  sortBy: QuestSortKey
): readonly Quest[] {
  if (sortBy === "default") {
    return [...quests];
  }

  return [...quests].sort((a, b) => {
    let diff = 0;

    switch (sortBy) {
      case "xp-desc":
        diff = b.xpReward - a.xpReward;
        break;
      case "xp-asc":
        diff = a.xpReward - b.xpReward;
        break;
      case "coins-desc":
        diff = b.coinReward - a.coinReward;
        break;
      case "difficulty-asc":
        diff = a.difficulty - b.difficulty;
        break;
      case "difficulty-desc":
        diff = b.difficulty - a.difficulty;
        break;
    }

    if (diff !== 0) return diff;
    // Stable tie-breaker by id
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Filter then sort — the canonical pipeline.
 * Returns a new array — never mutates the input.
 */
export function applyFiltersAndSort(
  quests: readonly Quest[],
  options: QuestFilterSortOptions
): readonly Quest[] {
  const filtered = filterQuests(quests, options);
  return sortQuests(filtered, options.sortBy);
}

/**
 * Extract sorted unique category strings from a quest list.
 * Returns a new array in ascending alphabetical order.
 */
export function getUniqueCategories(quests: readonly Quest[]): string[] {
  const categorySet = new Set<string>();
  for (const quest of quests) {
    categorySet.add(quest.category);
  }
  return [...categorySet].sort((a, b) => a.localeCompare(b));
}
