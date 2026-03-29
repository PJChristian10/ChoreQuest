import type { Quest } from "../models/quest.js";
import type { Reward } from "../models/reward.js";
import type { QuestTemplate, RewardTemplate } from "../data/templates.js";
import { QUEST_TEMPLATES, REWARD_TEMPLATES } from "../data/templates.js";
import { getQuestArt } from "../utils/questArtUtils.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// getQuestTemplates
// ---------------------------------------------------------------------------

export function getQuestTemplates(): readonly QuestTemplate[] {
  return QUEST_TEMPLATES;
}

// ---------------------------------------------------------------------------
// getRewardTemplates
// ---------------------------------------------------------------------------

export function getRewardTemplates(): readonly RewardTemplate[] {
  return REWARD_TEMPLATES;
}

// ---------------------------------------------------------------------------
// instantiateQuestTemplate
// ---------------------------------------------------------------------------

export function instantiateQuestTemplate(
  template: QuestTemplate,
  createdBy: string,
  now: Date,
): Quest {
  if (createdBy.trim().length === 0) {
    throw new Error(
      `instantiateQuestTemplate: createdBy must not be empty.`,
    );
  }

  return {
    id: generateId(),
    title: template.title,
    icon: template.icon,
    description: template.description,
    xpReward: template.xpReward,
    coinReward: template.coinReward,
    difficulty: template.difficulty,
    category: template.category,
    recurrence: template.recurrence,
    artKey: getQuestArt(template.title, template.category).artKey,
    isActive: true,
    createdBy,
    createdAt: now,
  };
}

// ---------------------------------------------------------------------------
// instantiateRewardTemplate
//
// Note: The Reward model has no createdAt field; the `now` parameter is
// accepted for API consistency and forwards-compatibility.
// ---------------------------------------------------------------------------

export function instantiateRewardTemplate(
  template: RewardTemplate,
  _now: Date,
): Reward {
  return {
    id: generateId(),
    title: template.title,
    icon: template.icon,
    description: template.description,
    coinCost: template.coinCost,
    category: template.category,
    stock: template.stock,
    isActive: true,
  };
}

// ---------------------------------------------------------------------------
// instantiateSelectedQuests
// ---------------------------------------------------------------------------

export function instantiateSelectedQuests(
  selectedIds: Set<string>,
  createdBy: string,
  now: Date,
): Quest[] {
  if (selectedIds.size === 0) return [];

  const templateMap = new Map(QUEST_TEMPLATES.map((t) => [t.id, t]));

  for (const id of selectedIds) {
    if (!templateMap.has(id)) {
      throw new Error(
        `instantiateSelectedQuests: unknown template id "${id}". No matching quest template found.`,
      );
    }
  }

  return [...selectedIds].map((id) =>
    instantiateQuestTemplate(templateMap.get(id)!, createdBy, now),
  );
}

// ---------------------------------------------------------------------------
// instantiateSelectedRewards
// ---------------------------------------------------------------------------

export function instantiateSelectedRewards(
  selectedIds: Set<string>,
  now: Date,
): Reward[] {
  if (selectedIds.size === 0) return [];

  const templateMap = new Map(REWARD_TEMPLATES.map((t) => [t.id, t]));

  for (const id of selectedIds) {
    if (!templateMap.has(id)) {
      throw new Error(
        `instantiateSelectedRewards: unknown template id "${id}". No matching reward template found.`,
      );
    }
  }

  return [...selectedIds].map((id) =>
    instantiateRewardTemplate(templateMap.get(id)!, now),
  );
}
