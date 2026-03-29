import { describe, it, expect } from "vitest";
import {
  getQuestTemplates,
  getRewardTemplates,
  instantiateQuestTemplate,
  instantiateRewardTemplate,
  instantiateSelectedQuests,
  instantiateSelectedRewards,
} from "../templateService.js";
import type { QuestTemplate, RewardTemplate } from "../../data/templates.js";
import { QUEST_TEMPLATES, REWARD_TEMPLATES } from "../../data/templates.js";

// ---------------------------------------------------------------------------
// Local fixtures
// ---------------------------------------------------------------------------

function makeQuestTemplate(overrides: Partial<QuestTemplate> = {}): QuestTemplate {
  return {
    id: "make-bed",
    title: "Make Your Bed",
    icon: "🛏️",
    description: "Straighten your sheets and pillows every morning.",
    xpReward: 10,
    coinReward: 8,
    difficulty: 1,
    category: "cleaning",
    recurrence: "daily",
    defaultSelected: true,
    ...overrides,
  };
}

function makeRewardTemplate(overrides: Partial<RewardTemplate> = {}): RewardTemplate {
  return {
    id: "extra-screen-time-30",
    title: "Extra Screen Time (30 min)",
    icon: "📱",
    description: "Earn 30 extra minutes of screen time today.",
    coinCost: 40,
    category: "screen_time",
    stock: -1,
    defaultSelected: true,
    ...overrides,
  };
}

const NOW = new Date("2026-03-28T12:00:00Z");

// ---------------------------------------------------------------------------
// getQuestTemplates
// ---------------------------------------------------------------------------

describe("getQuestTemplates", () => {
  it("returns an array", () => {
    expect(Array.isArray(getQuestTemplates())).toBe(true);
  });

  it("returns 15 quest templates", () => {
    expect(getQuestTemplates()).toHaveLength(15);
  });

  it("returns the same reference as QUEST_TEMPLATES", () => {
    expect(getQuestTemplates()).toBe(QUEST_TEMPLATES);
  });

  it("each template has all required fields with correct types", () => {
    for (const t of getQuestTemplates()) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.title).toBe("string");
      expect(typeof t.icon).toBe("string");
      expect(typeof t.description).toBe("string");
      expect(typeof t.xpReward).toBe("number");
      expect(typeof t.coinReward).toBe("number");
      expect([1, 2, 3]).toContain(t.difficulty);
      expect(typeof t.category).toBe("string");
      expect(typeof t.recurrence).toBe("string");
      expect(typeof t.defaultSelected).toBe("boolean");
    }
  });

  it("all template ids are unique", () => {
    const ids = getQuestTemplates().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// getRewardTemplates
// ---------------------------------------------------------------------------

describe("getRewardTemplates", () => {
  it("returns an array", () => {
    expect(Array.isArray(getRewardTemplates())).toBe(true);
  });

  it("returns 14 reward templates", () => {
    expect(getRewardTemplates()).toHaveLength(14);
  });

  it("returns the same reference as REWARD_TEMPLATES", () => {
    expect(getRewardTemplates()).toBe(REWARD_TEMPLATES);
  });

  it("each template has all required fields with correct types", () => {
    for (const t of getRewardTemplates()) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.title).toBe("string");
      expect(typeof t.icon).toBe("string");
      expect(typeof t.description).toBe("string");
      expect(typeof t.coinCost).toBe("number");
      expect(typeof t.category).toBe("string");
      expect(typeof t.stock).toBe("number");
      expect(typeof t.defaultSelected).toBe("boolean");
    }
  });

  it("all template ids are unique", () => {
    const ids = getRewardTemplates().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// instantiateQuestTemplate
// ---------------------------------------------------------------------------

describe("instantiateQuestTemplate", () => {
  it("returns a quest with a non-empty id", () => {
    const quest = instantiateQuestTemplate(makeQuestTemplate(), "parent", NOW);
    expect(quest.id).toBeTruthy();
  });

  it("generates a unique id on each call", () => {
    const template = makeQuestTemplate();
    const q1 = instantiateQuestTemplate(template, "parent", NOW);
    const q2 = instantiateQuestTemplate(template, "parent", NOW);
    expect(q1.id).not.toBe(q2.id);
  });

  it("sets isActive to true", () => {
    const quest = instantiateQuestTemplate(makeQuestTemplate(), "parent", NOW);
    expect(quest.isActive).toBe(true);
  });

  it("sets createdAt to the provided now date", () => {
    const quest = instantiateQuestTemplate(makeQuestTemplate(), "parent", NOW);
    expect(quest.createdAt).toBe(NOW);
  });

  it("sets createdBy to the provided string", () => {
    const quest = instantiateQuestTemplate(makeQuestTemplate(), "setup-wizard", NOW);
    expect(quest.createdBy).toBe("setup-wizard");
  });

  it("copies title, icon, description from template", () => {
    const template = makeQuestTemplate({
      title: "Feed the Cat",
      icon: "🐈",
      description: "Put food in the bowl.",
    });
    const quest = instantiateQuestTemplate(template, "parent", NOW);
    expect(quest.title).toBe("Feed the Cat");
    expect(quest.icon).toBe("🐈");
    expect(quest.description).toBe("Put food in the bowl.");
  });

  it("copies xpReward and coinReward from template", () => {
    const template = makeQuestTemplate({ xpReward: 25, coinReward: 20 });
    const quest = instantiateQuestTemplate(template, "parent", NOW);
    expect(quest.xpReward).toBe(25);
    expect(quest.coinReward).toBe(20);
  });

  it("copies difficulty from template", () => {
    const template = makeQuestTemplate({ difficulty: 3 });
    const quest = instantiateQuestTemplate(template, "parent", NOW);
    expect(quest.difficulty).toBe(3);
  });

  it("copies category from template", () => {
    const template = makeQuestTemplate({ category: "pets" });
    const quest = instantiateQuestTemplate(template, "parent", NOW);
    expect(quest.category).toBe("pets");
  });

  it("copies recurrence from template", () => {
    const template = makeQuestTemplate({ recurrence: "weekly" });
    const quest = instantiateQuestTemplate(template, "parent", NOW);
    expect(quest.recurrence).toBe("weekly");
  });

  it("sets artKey to a non-empty string", () => {
    const quest = instantiateQuestTemplate(
      makeQuestTemplate({ title: "Make Your Bed", category: "cleaning" }),
      "parent",
      NOW,
    );
    expect(typeof quest.artKey).toBe("string");
    expect(quest.artKey.length).toBeGreaterThan(0);
  });

  it("derives a sensible artKey — bedroom quest maps to bedroom art", () => {
    const quest = instantiateQuestTemplate(
      makeQuestTemplate({ title: "Clean Your Bedroom", category: "cleaning" }),
      "parent",
      NOW,
    );
    expect(quest.artKey).toBe("bedroom");
  });

  it("derives artKey via category fallback when no keyword matches", () => {
    // "Make Your Bed" → contains "bed" → matches bedroom pattern
    // Use a generic title that won't hit any keyword
    const quest = instantiateQuestTemplate(
      makeQuestTemplate({ title: "A Completely Generic Task", category: "garden" }),
      "parent",
      NOW,
    );
    // Garden fallback is "water_plants"
    expect(quest.artKey).toBe("water_plants");
  });

  it("does not mutate the template object", () => {
    const template = makeQuestTemplate();
    const snapshot = { ...template };
    instantiateQuestTemplate(template, "parent", NOW);
    expect(template).toEqual(snapshot);
  });

  it("throws when createdBy is an empty string", () => {
    expect(() =>
      instantiateQuestTemplate(makeQuestTemplate(), "", NOW),
    ).toThrow();
  });

  it("error message mentions createdBy", () => {
    expect(() =>
      instantiateQuestTemplate(makeQuestTemplate(), "", NOW),
    ).toThrow(/createdBy/i);
  });
});

// ---------------------------------------------------------------------------
// instantiateRewardTemplate
// ---------------------------------------------------------------------------

describe("instantiateRewardTemplate", () => {
  it("returns a reward with a non-empty id", () => {
    const reward = instantiateRewardTemplate(makeRewardTemplate(), NOW);
    expect(reward.id).toBeTruthy();
  });

  it("generates a unique id on each call", () => {
    const template = makeRewardTemplate();
    const r1 = instantiateRewardTemplate(template, NOW);
    const r2 = instantiateRewardTemplate(template, NOW);
    expect(r1.id).not.toBe(r2.id);
  });

  it("sets isActive to true", () => {
    const reward = instantiateRewardTemplate(makeRewardTemplate(), NOW);
    expect(reward.isActive).toBe(true);
  });

  it("copies title from template", () => {
    const reward = instantiateRewardTemplate(
      makeRewardTemplate({ title: "Ice Cream Outing" }),
      NOW,
    );
    expect(reward.title).toBe("Ice Cream Outing");
  });

  it("copies icon from template", () => {
    const reward = instantiateRewardTemplate(
      makeRewardTemplate({ icon: "🍦" }),
      NOW,
    );
    expect(reward.icon).toBe("🍦");
  });

  it("copies description from template", () => {
    const reward = instantiateRewardTemplate(
      makeRewardTemplate({ description: "A trip for ice cream." }),
      NOW,
    );
    expect(reward.description).toBe("A trip for ice cream.");
  });

  it("copies coinCost from template", () => {
    const reward = instantiateRewardTemplate(makeRewardTemplate({ coinCost: 75 }), NOW);
    expect(reward.coinCost).toBe(75);
  });

  it("copies category from template", () => {
    const reward = instantiateRewardTemplate(
      makeRewardTemplate({ category: "activities" }),
      NOW,
    );
    expect(reward.category).toBe("activities");
  });

  it("copies stock: -1 (unlimited) from template", () => {
    const reward = instantiateRewardTemplate(makeRewardTemplate({ stock: -1 }), NOW);
    expect(reward.stock).toBe(-1);
  });

  it("copies finite stock from template", () => {
    const reward = instantiateRewardTemplate(makeRewardTemplate({ stock: 3 }), NOW);
    expect(reward.stock).toBe(3);
  });

  it("does not mutate the template object", () => {
    const template = makeRewardTemplate();
    const snapshot = { ...template };
    instantiateRewardTemplate(template, NOW);
    expect(template).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// instantiateSelectedQuests
// ---------------------------------------------------------------------------

describe("instantiateSelectedQuests", () => {
  it("returns an empty array for an empty set", () => {
    expect(instantiateSelectedQuests(new Set(), "parent", NOW)).toHaveLength(0);
  });

  it("returns one quest for a single-id set", () => {
    const quests = instantiateSelectedQuests(new Set(["make-bed"]), "parent", NOW);
    expect(quests).toHaveLength(1);
  });

  it("returns multiple quests matching the count of selected ids", () => {
    const quests = instantiateSelectedQuests(
      new Set(["make-bed", "brush-teeth", "do-homework"]),
      "parent",
      NOW,
    );
    expect(quests).toHaveLength(3);
  });

  it("each returned quest has isActive: true", () => {
    const quests = instantiateSelectedQuests(
      new Set(["make-bed", "vacuum-room"]),
      "parent",
      NOW,
    );
    for (const q of quests) {
      expect(q.isActive).toBe(true);
    }
  });

  it("each returned quest has createdBy set to the provided string", () => {
    const quests = instantiateSelectedQuests(new Set(["make-bed"]), "setup-wizard", NOW);
    expect(quests[0]!.createdBy).toBe("setup-wizard");
  });

  it("each returned quest has createdAt set to now", () => {
    const quests = instantiateSelectedQuests(new Set(["make-bed"]), "parent", NOW);
    expect(quests[0]!.createdAt).toBe(NOW);
  });

  it("quest title matches the corresponding template", () => {
    const quests = instantiateSelectedQuests(new Set(["make-bed"]), "parent", NOW);
    const template = QUEST_TEMPLATES.find((t) => t.id === "make-bed")!;
    expect(quests[0]!.title).toBe(template.title);
  });

  it("quest rewards match the corresponding template", () => {
    const quests = instantiateSelectedQuests(new Set(["do-homework"]), "parent", NOW);
    const template = QUEST_TEMPLATES.find((t) => t.id === "do-homework")!;
    expect(quests[0]!.xpReward).toBe(template.xpReward);
    expect(quests[0]!.coinReward).toBe(template.coinReward);
  });

  it("each returned quest has a unique id", () => {
    const quests = instantiateSelectedQuests(
      new Set(["make-bed", "brush-teeth", "do-homework"]),
      "parent",
      NOW,
    );
    const ids = quests.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("throws for an unknown template id", () => {
    expect(() =>
      instantiateSelectedQuests(new Set(["nonexistent-quest"]), "parent", NOW),
    ).toThrow();
  });

  it("throws even when only one id in the set is unknown", () => {
    expect(() =>
      instantiateSelectedQuests(new Set(["make-bed", "ghost-id"]), "parent", NOW),
    ).toThrow();
  });

  it("error message includes the unknown id", () => {
    expect(() =>
      instantiateSelectedQuests(new Set(["totally-unknown"]), "parent", NOW),
    ).toThrow(/totally-unknown/);
  });

  it("throws when createdBy is empty (propagated from instantiateQuestTemplate)", () => {
    expect(() =>
      instantiateSelectedQuests(new Set(["make-bed"]), "", NOW),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// instantiateSelectedRewards
// ---------------------------------------------------------------------------

describe("instantiateSelectedRewards", () => {
  it("returns an empty array for an empty set", () => {
    expect(instantiateSelectedRewards(new Set(), NOW)).toHaveLength(0);
  });

  it("returns one reward for a single-id set", () => {
    const rewards = instantiateSelectedRewards(new Set(["extra-screen-time-30"]), NOW);
    expect(rewards).toHaveLength(1);
  });

  it("returns multiple rewards matching the count of selected ids", () => {
    const rewards = instantiateSelectedRewards(
      new Set(["extra-screen-time-30", "special-dessert", "movie-night"]),
      NOW,
    );
    expect(rewards).toHaveLength(3);
  });

  it("each returned reward has isActive: true", () => {
    const rewards = instantiateSelectedRewards(
      new Set(["extra-screen-time-30", "stay-up-late"]),
      NOW,
    );
    for (const r of rewards) {
      expect(r.isActive).toBe(true);
    }
  });

  it("reward title matches the corresponding template", () => {
    const rewards = instantiateSelectedRewards(new Set(["special-dessert"]), NOW);
    const template = REWARD_TEMPLATES.find((t) => t.id === "special-dessert")!;
    expect(rewards[0]!.title).toBe(template.title);
  });

  it("reward coinCost matches the corresponding template", () => {
    const rewards = instantiateSelectedRewards(new Set(["choose-dinner"]), NOW);
    const template = REWARD_TEMPLATES.find((t) => t.id === "choose-dinner")!;
    expect(rewards[0]!.coinCost).toBe(template.coinCost);
  });

  it("each returned reward has a unique id", () => {
    const rewards = instantiateSelectedRewards(
      new Set(["extra-screen-time-30", "special-dessert", "movie-night"]),
      NOW,
    );
    const ids = rewards.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("throws for an unknown template id", () => {
    expect(() =>
      instantiateSelectedRewards(new Set(["nonexistent-reward"]), NOW),
    ).toThrow();
  });

  it("throws even when only one id in the set is unknown", () => {
    expect(() =>
      instantiateSelectedRewards(
        new Set(["extra-screen-time-30", "ghost-reward"]),
        NOW,
      ),
    ).toThrow();
  });

  it("error message includes the unknown id", () => {
    expect(() =>
      instantiateSelectedRewards(new Set(["mystery-reward"]), NOW),
    ).toThrow(/mystery-reward/);
  });
});
