/**
 * questArtUtils.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  getQuestArt,
  getQuestArtByKey,
  getArtOptionsForCategory,
  getAllArtOptions,
} from "../questArtUtils.js";

// ---------------------------------------------------------------------------
// getQuestArt — keyword matching
// ---------------------------------------------------------------------------

describe("getQuestArt — keyword matching", () => {
  it("matches 'Wash the dishes' → dishes", () => {
    const art = getQuestArt("Wash the dishes", "kitchen");
    expect(art.artKey).toBe("dishes");
    expect(art.emoji).toBe("🍽️");
  });

  it("matches 'Take out the trash' → trash", () => {
    expect(getQuestArt("Take out the trash", "kitchen").artKey).toBe("trash");
  });

  it("matches 'Unload the dishwasher' → unload", () => {
    expect(getQuestArt("Unload the dishwasher", "kitchen").artKey).toBe("unload");
  });

  it("matches 'Load the dishwasher' → unload", () => {
    expect(getQuestArt("Load the dishwasher", "kitchen").artKey).toBe("unload");
  });

  it("matches 'Vacuum the living room' → vacuum", () => {
    expect(getQuestArt("Vacuum the living room", "cleaning").artKey).toBe("vacuum");
  });

  it("matches 'Sweep the kitchen floor' → sweep", () => {
    expect(getQuestArt("Sweep the kitchen floor", "cleaning").artKey).toBe("sweep");
  });

  it("matches 'Clean the bathroom' → bathroom", () => {
    expect(getQuestArt("Clean the bathroom", "cleaning").artKey).toBe("bathroom");
  });

  it("matches 'Scrub the toilet' → toilet", () => {
    expect(getQuestArt("Scrub the toilet", "cleaning").artKey).toBe("toilet");
  });

  it("matches 'Feed the dog' → feed_pet", () => {
    expect(getQuestArt("Feed the dog", "pets").artKey).toBe("feed_pet");
  });

  it("matches 'Walk the dog' → walk_dog", () => {
    expect(getQuestArt("Walk the dog", "pets").artKey).toBe("walk_dog");
  });

  it("matches 'Clean the litter box' → litter", () => {
    expect(getQuestArt("Clean the litter box", "pets").artKey).toBe("litter");
  });

  it("matches 'Do your homework' → homework", () => {
    expect(getQuestArt("Do your homework", "school").artKey).toBe("homework");
  });

  it("matches 'Practice piano' → piano", () => {
    expect(getQuestArt("Practice piano", "school").artKey).toBe("piano");
  });

  it("matches 'Water the plants' → water_plants", () => {
    expect(getQuestArt("Water the plants", "garden").artKey).toBe("water_plants");
  });

  it("matches 'Mow the lawn' → mow", () => {
    expect(getQuestArt("Mow the lawn", "garden").artKey).toBe("mow");
  });

  it("matches case-insensitively", () => {
    expect(getQuestArt("VACUUM THE RUG", "cleaning").artKey).toBe("vacuum");
    expect(getQuestArt("feed the Cat", "pets").artKey).toBe("feed_pet");
  });
});

// ---------------------------------------------------------------------------
// getQuestArt — category fallbacks
// ---------------------------------------------------------------------------

describe("getQuestArt — category fallbacks", () => {
  it("falls back to category default for unknown title", () => {
    expect(getQuestArt("Do something unusual", "kitchen").artKey).toBe("dishes");
    expect(getQuestArt("Do something unusual", "cleaning").artKey).toBe("vacuum");
    expect(getQuestArt("Do something unusual", "pets").artKey).toBe("feed_pet");
    expect(getQuestArt("Do something unusual", "school").artKey).toBe("homework");
    expect(getQuestArt("Do something unusual", "garden").artKey).toBe("water_plants");
    expect(getQuestArt("Do something unusual", "home").artKey).toBe("home");
    expect(getQuestArt("Do something unusual", "bonus").artKey).toBe("bonus");
  });

  it("always returns a valid emoji", () => {
    const art = getQuestArt("", "kitchen");
    expect(art.emoji).toBeTruthy();
    expect(art.emoji.length).toBeGreaterThan(0);
  });

  it("always returns a gradient string", () => {
    const art = getQuestArt("", "kitchen");
    expect(art.gradient).toContain("deg");
  });
});

// ---------------------------------------------------------------------------
// getQuestArtByKey
// ---------------------------------------------------------------------------

describe("getQuestArtByKey", () => {
  it("returns correct art for a known artKey", () => {
    const art = getQuestArtByKey("vacuum", "cleaning");
    expect(art.artKey).toBe("vacuum");
    expect(art.emoji).toBe("🧹");
  });

  it("falls back to category default for an unknown key", () => {
    const art = getQuestArtByKey("nonexistent_key_xyz", "kitchen");
    expect(art.artKey).toBe("dishes");
  });

  it("falls back gracefully for empty string key", () => {
    const art = getQuestArtByKey("", "pets");
    expect(art.artKey).toBe("feed_pet");
  });
});

// ---------------------------------------------------------------------------
// getArtOptionsForCategory
// ---------------------------------------------------------------------------

describe("getArtOptionsForCategory", () => {
  it("returns a non-empty array for every category", () => {
    const categories = ["kitchen", "cleaning", "pets", "school", "garden", "home", "bonus"] as const;
    for (const cat of categories) {
      const options = getArtOptionsForCategory(cat);
      expect(options.length).toBeGreaterThan(0);
    }
  });

  it("returns objects with artKey, emoji, gradient", () => {
    const options = getArtOptionsForCategory("kitchen");
    for (const opt of options) {
      expect(opt.artKey).toBeTruthy();
      expect(opt.emoji).toBeTruthy();
      expect(opt.gradient).toBeTruthy();
    }
  });

  it("all returned artKeys are unique within a category", () => {
    const options = getArtOptionsForCategory("cleaning");
    const keys = options.map((o) => o.artKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------------
// getAllArtOptions
// ---------------------------------------------------------------------------

describe("getAllArtOptions", () => {
  it("returns more options than any single category", () => {
    const all = getAllArtOptions();
    const kitchen = getArtOptionsForCategory("kitchen");
    expect(all.length).toBeGreaterThan(kitchen.length);
  });

  it("returns at least 30 options", () => {
    expect(getAllArtOptions().length).toBeGreaterThanOrEqual(30);
  });

  it("all options have valid structure", () => {
    for (const opt of getAllArtOptions()) {
      expect(typeof opt.artKey).toBe("string");
      expect(typeof opt.emoji).toBe("string");
      expect(typeof opt.gradient).toBe("string");
    }
  });
});
