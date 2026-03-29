/**
 * questArtUtils.ts
 *
 * Provides emoji-based illustration art for quest cards.
 * No API calls, no external assets — pure emoji + CSS gradients.
 *
 * Usage:
 *   const art = getQuestArt("Wash the dishes", "kitchen");
 *   // → { artKey: "dishes", emoji: "🍽️", gradient: "..." }
 */

import type { QuestCategory } from "../models/quest.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuestArt {
  /** Stable key stored on the Quest model */
  artKey: string;
  /** Emoji rendered in the card image area */
  emoji: string;
  /** CSS gradient for the card image background */
  gradient: string;
}

// ---------------------------------------------------------------------------
// Art definitions
// Each entry: [artKey, emoji, gradient (two stops, dark-navy tinted)]
// ---------------------------------------------------------------------------

const ART_DEFINITIONS: Record<string, [emoji: string, gradient: string]> = {
  // Kitchen
  dishes:       ["🍽️",  "135deg, #2a1a0e 0%, #3d2a14 100%"],
  cooking:      ["👨‍🍳",  "135deg, #2a1506 0%, #3d2208 100%"],
  dinner:       ["🥘",   "135deg, #281808 0%, #3c2510 100%"],
  lunch:        ["🥪",   "135deg, #1e2008 0%, #2e3010 100%"],
  breakfast:    ["🥞",   "135deg, #28200a 0%, #3c3010 100%"],
  trash:        ["🗑️",  "135deg, #0e1e14 0%, #162a1c 100%"],
  groceries:    ["🛒",   "135deg, #1a2010 0%, #253018 100%"],
  unload:       ["🫙",   "135deg, #1e2808 0%, #2c3c10 100%"],
  microwave:    ["📦",   "135deg, #1e1e1e 0%, #2c2c2c 100%"],
  counters:     ["🧽",   "135deg, #0a1e28 0%, #10303c 100%"],

  // Cleaning
  vacuum:       ["🧹",   "135deg, #0a1428 0%, #101e3c 100%"],
  sweep:        ["🧹",   "135deg, #0c1628 0%, #121e38 100%"],
  mop:          ["🪣",   "135deg, #0a1c2e 0%, #102840 100%"],
  wipe:         ["🧽",   "135deg, #0a1e30 0%, #102c44 100%"],
  dust:         ["🪣",   "135deg, #0c1830 0%, #142244 100%"],
  tidy:         ["📦",   "135deg, #101828 0%, #182438 100%"],
  bedroom:      ["🛏️",  "135deg, #101830 0%, #182440 100%"],
  bathroom:     ["🚿",   "135deg, #0a2030 0%, #103040 100%"],
  toilet:       ["🪠",   "135deg, #0a1e2c 0%, #102c3c 100%"],
  laundry:      ["👕",   "135deg, #0a1c30 0%, #102840 100%"],
  fold:         ["👔",   "135deg, #0c1e30 0%, #142c44 100%"],
  iron:         ["🧺",   "135deg, #0a1828 0%, #102438 100%"],
  windows:      ["🪟",   "135deg, #0e1e34 0%, #142840 100%"],
  organize:     ["🗂️",  "135deg, #10182c 0%, #18243c 100%"],

  // Pets
  feed_pet:     ["🐾",   "135deg, #0e2210 0%, #163418 100%"],
  walk_dog:     ["🦮",   "135deg, #0c2010 0%, #142e16 100%"],
  brush_pet:    ["🐕",   "135deg, #102410 0%, #183618 100%"],
  litter:       ["🐱",   "135deg, #0e200e 0%, #162e14 100%"],
  fish:         ["🐟",   "135deg, #0a1e28 0%, #10303c 100%"],
  hamster:      ["🐹",   "135deg, #1a1808 0%, #28260e 100%"],
  rabbit:       ["🐰",   "135deg, #1a1410 0%, #281e18 100%"],

  // School
  homework:     ["📝",   "135deg, #1a1040 0%, #281860 100%"],
  study:        ["📖",   "135deg, #18103c 0%, #261858 100%"],
  read:         ["📚",   "135deg, #161040 0%, #22185c 100%"],
  practice:     ["🎵",   "135deg, #1c0c40 0%, #2c1458 100%"],
  piano:        ["🎹",   "135deg, #14103c 0%, #201858 100%"],
  project:      ["💡",   "135deg, #1a1230 0%, #281c48 100%"],
  flashcards:   ["🃏",   "135deg, #1a0e3c 0%, #281558 100%"],
  backpack:     ["🎒",   "135deg, #1c1040 0%, #2c185c 100%"],

  // Garden
  water_plants: ["🌱",   "135deg, #0a2210 0%, #103418 100%"],
  mow:          ["🌿",   "135deg, #0c2410 0%, #143818 100%"],
  rake:         ["🍂",   "135deg, #1e1808 0%, #2c2410 100%"],
  weed:         ["🌾",   "135deg, #102610 0%, #183c18 100%"],
  plant:        ["🌷",   "135deg, #0e2414 0%, #163820 100%"],
  compost:      ["♻️",  "135deg, #0e2210 0%, #143418 100%"],
  shovel:       ["⛏️",  "135deg, #141c10 0%, #1e2c18 100%"],
  trim:         ["✂️",  "135deg, #0c2010 0%, #142e18 100%"],
  leaves:       ["🍁",   "135deg, #241408 0%, #382010 100%"],

  // Home / Generic
  home:         ["🏠",   "135deg, #1a1828 0%, #262438 100%"],
  mail:         ["📬",   "135deg, #181a2c 0%, #24263c 100%"],
  car:          ["🚗",   "135deg, #1a1820 0%, #262430 100%"],
  recycle:      ["♻️",  "135deg, #0e2010 0%, #163018 100%"],
  set_table:    ["🍴",   "135deg, #1e1808 0%, #2e2410 100%"],

  // Bonus / Special
  bonus:        ["⭐",   "135deg, #2a2000 0%, #3e3000 100%"],
  star:         ["🌟",   "135deg, #281e00 0%, #3c2c00 100%"],
  trophy:       ["🏆",   "135deg, #2c1c00 0%, #402800 100%"],
};

// Category fallbacks — used when no keyword matches
const CATEGORY_FALLBACKS: Record<QuestCategory, string> = {
  kitchen:  "dishes",
  cleaning: "vacuum",
  pets:     "feed_pet",
  school:   "homework",
  garden:   "water_plants",
  home:     "home",
  bonus:    "bonus",
};

// ---------------------------------------------------------------------------
// Keyword → artKey mapping
// Order matters: more specific phrases before single words
// ---------------------------------------------------------------------------

const KEYWORD_MAP: Array<[pattern: RegExp, artKey: string]> = [
  // Kitchen — specific first
  [/unload.*(dish|washer)/i,     "unload"],
  [/load.*(dish|washer)/i,       "unload"],
  [/(wash|rinse|clean).*(dish|plate|cup|bowl)/i, "dishes"],
  [/dishwasher/i,                "dishes"],
  [/(take out|empty|trash|garbage|bin|rubbish)/i, "trash"],
  [/(cook|bake|roast|grill|fry)/i, "cooking"],
  [/(dinner|supper)/i,           "dinner"],
  [/(lunch|sandwich)/i,          "lunch"],
  [/(breakfast|pancake|waffle|egg)/i, "breakfast"],
  [/groceri|grocery|shop.*(food|store)/i, "groceries"],
  [/microwave|reheat/i,          "microwave"],
  [/(wipe|clean).*(counter|surface|stove|stovetop|hob)/i, "counters"],

  // Cleaning — specific room/fixture patterns BEFORE generic wipe/scrub/clean
  [/(vacuum|hoover)/i,           "vacuum"],
  [/sweep/i,                     "sweep"],
  [/mop/i,                       "mop"],
  [/(wipe|clean).*(mirror|glass)/i, "windows"],
  [/window/i,                    "windows"],
  [/(bedroom|bed room|make.*bed|bed.*made)/i, "bedroom"],
  [/(bathroom|bath room|shower|tub)/i, "bathroom"],
  [/toilet|loo/i,                "toilet"],
  [/(clean|scoop|change|empty).*(litter|cat box)/i, "litter"],
  [/(wipe|scrub|clean)/i,        "wipe"],
  [/dust/i,                      "dust"],
  [/(tidy|declutter|pick up|put away)/i, "tidy"],
  [/laundry|washing machine|washer|dryer/i, "laundry"],
  [/(fold|folding).*(clothes|laundry|towel|shirt)/i, "fold"],
  [/iron/i,                      "iron"],
  [/(organiz|sort|tidy).*(drawer|closet|wardrobe|shelf|shelves)/i, "organize"],

  // Pets
  [/(feed|feeding).*(dog|cat|pet|fish|hamster|rabbit|bird)/i, "feed_pet"],
  [/(fill|change|clean).*(water bowl|bowl|dish).*(pet|dog|cat)/i, "feed_pet"],
  [/(walk|walking|take out).*(dog|puppy)/i, "walk_dog"],
  [/(brush|groom).*(dog|cat|pet)/i, "brush_pet"],
  [/(clean|scoop|change|empty).*(litter|cat box)/i, "litter"],
  [/fish.*tank|aquarium|feed.*fish/i, "fish"],
  [/hamster|gerbil|guinea pig/i, "hamster"],
  [/rabbit|bunny/i,              "rabbit"],

  // School
  [/(homework|home work)/i,      "homework"],
  [/(study|studying|revise|revision)/i, "study"],
  [/(read|reading).*(book|chapter|page)/i, "read"],
  [/(piano|guitar|violin|drums)/i, "piano"],
  [/(piano|guitar|violin|drums|instrument|practice).*(music|song)/i, "piano"],
  [/(music|instrument).*(practice|lesson)/i, "practice"],
  [/practice/i,                  "practice"],
  [/(school|science|history|math|maths).*(project|assignment)/i, "project"],
  [/flashcard|flash card/i,      "flashcards"],
  [/backpack|bag.*(school|pack)/i, "backpack"],

  // Garden
  [/(water|watering).*(plant|flower|garden|pot|herb)/i, "water_plants"],
  [/mow|lawn|grass/i,            "mow"],
  [/rake/i,                      "rake"],
  [/weed|weeding/i,              "weed"],
  [/(plant|planting|transplant)/i, "plant"],
  [/compost/i,                   "compost"],
  [/(shovel|dig|digging)/i,      "shovel"],
  [/(trim|prune|hedge|clip)/i,   "trim"],
  [/leaves|leaf blower/i,        "leaves"],

  // Home / Generic
  [/(set|clear|lay).*(table|dinner table)/i, "set_table"],
  [/(get|collect|bring in).*(mail|post|newspaper)/i, "mail"],
  [/(wash|clean|vacuum).*(car|vehicle)/i, "car"],
  [/(recycl|sorting.*recycl)/i,  "recycle"],
];

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Returns the best-match QuestArt for a given quest title and category.
 * Falls back to category default if no keyword matches.
 */
export function getQuestArt(title: string, category: QuestCategory): QuestArt {
  // Try keyword matching on the title
  for (const [pattern, artKey] of KEYWORD_MAP) {
    if (pattern.test(title)) {
      return buildArt(artKey);
    }
  }
  // Fall back to category default
  return buildArt(CATEGORY_FALLBACKS[category] ?? "home");
}

/**
 * Returns QuestArt for a known artKey (used when loading from persisted Quest model).
 * Falls back gracefully if the key is no longer valid.
 */
export function getQuestArtByKey(artKey: string, category: QuestCategory): QuestArt {
  if (artKey in ART_DEFINITIONS) {
    return buildArt(artKey);
  }
  return buildArt(CATEGORY_FALLBACKS[category] ?? "home");
}

/**
 * Returns all available art options for a given category,
 * used by ArtPicker to show override choices.
 */
export function getArtOptionsForCategory(category: QuestCategory): QuestArt[] {
  const keys = ART_OPTION_KEYS_BY_CATEGORY[category] ?? [];
  return keys.map(buildArt);
}

/**
 * Returns all art options across all categories (for "any" picker).
 */
export function getAllArtOptions(): QuestArt[] {
  return Object.keys(ART_DEFINITIONS).map(buildArt);
}

// ---------------------------------------------------------------------------
// Category → available art keys (for the ArtPicker grid)
// ---------------------------------------------------------------------------

const ART_OPTION_KEYS_BY_CATEGORY: Record<QuestCategory, string[]> = {
  kitchen:  ["dishes", "cooking", "dinner", "lunch", "breakfast", "trash", "groceries", "unload", "microwave", "counters"],
  cleaning: ["vacuum", "sweep", "mop", "wipe", "dust", "tidy", "bedroom", "bathroom", "toilet", "laundry", "fold", "iron", "windows", "organize"],
  pets:     ["feed_pet", "walk_dog", "brush_pet", "litter", "fish", "hamster", "rabbit"],
  school:   ["homework", "study", "read", "practice", "piano", "project", "flashcards", "backpack"],
  garden:   ["water_plants", "mow", "rake", "weed", "plant", "compost", "shovel", "trim", "leaves"],
  home:     ["home", "mail", "car", "recycle", "set_table"],
  bonus:    ["bonus", "star", "trophy"],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildArt(artKey: string): QuestArt {
  const def = ART_DEFINITIONS[artKey];
  if (!def) {
    return { artKey: "home", emoji: "🏠", gradient: "135deg, #1a1828 0%, #262438 100%" };
  }
  const [emoji, gradient] = def;
  return { artKey, emoji, gradient };
}
