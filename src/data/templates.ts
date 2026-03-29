/**
 * data/templates.ts
 *
 * Static starter templates for quests and rewards.
 * Shown during the setup wizard so new parents can quickly
 * populate their family with sensible defaults.
 *
 * No executable logic — pure data, analogous to seed.ts.
 */

import type { QuestCategory, QuestRecurrence, QuestDifficulty } from "../models/quest.js";
import type { RewardCategory } from "../models/reward.js";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface QuestTemplate {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly xpReward: number;
  readonly coinReward: number;
  readonly difficulty: QuestDifficulty;
  readonly category: QuestCategory;
  readonly recurrence: QuestRecurrence;
  readonly defaultSelected: boolean;
}

export interface RewardTemplate {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly coinCost: number;
  readonly category: RewardCategory;
  readonly stock: number;
  readonly defaultSelected: boolean;
}

// ---------------------------------------------------------------------------
// Quest templates (15)
// ---------------------------------------------------------------------------

export const QUEST_TEMPLATES: readonly QuestTemplate[] = [
  // ── Daily habits ──────────────────────────────────────────────────────────
  {
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
  },
  {
    id: "brush-teeth",
    title: "Brush Teeth",
    icon: "🦷",
    description: "Brush your teeth for at least two minutes.",
    xpReward: 10,
    coinReward: 8,
    difficulty: 1,
    category: "home",
    recurrence: "daily",
    defaultSelected: true,
  },
  {
    id: "set-table",
    title: "Set the Table",
    icon: "🍽️",
    description: "Place plates, cups, and utensils for the whole family.",
    xpReward: 10,
    coinReward: 8,
    difficulty: 1,
    category: "kitchen",
    recurrence: "daily",
    defaultSelected: true,
  },
  {
    id: "clear-table",
    title: "Clear the Table",
    // FIX: was 🧹 (duplicate of vacuum-room)
    icon: "🥣",
    description: "Bring dishes to the sink and wipe down the table after meals.",
    xpReward: 10,
    coinReward: 8,
    difficulty: 1,
    category: "kitchen",
    recurrence: "daily",
    defaultSelected: true,
  },
  {
    id: "do-homework",
    title: "Do Homework",
    icon: "📚",
    description: "Finish all assigned homework before screen time.",
    xpReward: 25,
    coinReward: 20,
    difficulty: 2,
    category: "school",
    recurrence: "daily",
    defaultSelected: true,
  },
  {
    id: "read-book",
    title: "Read for 20 Minutes",
    icon: "📖",
    description: "Read a book or e-book of your choice for at least 20 minutes.",
    xpReward: 15,
    coinReward: 10,
    difficulty: 1,
    category: "school",
    recurrence: "daily",
    defaultSelected: true,
  },
  {
    id: "feed-pet",
    title: "Feed the Pet",
    icon: "🐾",
    description: "Refill food and water bowls for the family pet.",
    xpReward: 15,
    coinReward: 10,
    difficulty: 1,
    category: "pets",
    recurrence: "daily",
    defaultSelected: true,
  },
  {
    id: "wash-dishes",
    title: "Wash the Dishes",
    icon: "🫧",
    description: "Wash, rinse, and dry all dishes in the sink.",
    xpReward: 20,
    coinReward: 15,
    difficulty: 2,
    category: "kitchen",
    recurrence: "daily",
    defaultSelected: false,
  },
  // ── Weekly chores ─────────────────────────────────────────────────────────
  {
    id: "vacuum-room",
    title: "Vacuum Your Room",
    icon: "🧹",
    description: "Vacuum all carpet and rugs in your bedroom.",
    xpReward: 30,
    coinReward: 22,
    difficulty: 2,
    category: "cleaning",
    recurrence: "weekly",
    defaultSelected: true,
  },
  {
    id: "take-out-trash",
    title: "Take Out the Trash",
    icon: "🗑️",
    description: "Empty all trash cans and bring the bins to the curb.",
    xpReward: 20,
    coinReward: 15,
    difficulty: 2,
    category: "home",
    recurrence: "weekly",
    defaultSelected: false,
  },
  {
    id: "fold-laundry",
    title: "Fold Laundry",
    icon: "👕",
    description: "Fold and put away a basket of clean laundry.",
    xpReward: 30,
    coinReward: 22,
    difficulty: 2,
    category: "cleaning",
    recurrence: "weekly",
    defaultSelected: false,
  },
  {
    id: "clean-bathroom",
    title: "Clean the Bathroom",
    icon: "🚿",
    description: "Scrub the sink, wipe the mirror, and clean the toilet.",
    xpReward: 40,
    coinReward: 30,
    difficulty: 3,
    category: "cleaning",
    recurrence: "weekly",
    defaultSelected: false,
  },
  {
    id: "water-plants",
    title: "Water the Plants",
    icon: "🌱",
    description: "Water all indoor and outdoor plants that need it.",
    xpReward: 15,
    coinReward: 10,
    difficulty: 1,
    category: "garden",
    recurrence: "weekly",
    defaultSelected: false,
  },
  {
    id: "walk-dog",
    title: "Walk the Dog",
    icon: "🐕",
    description: "Take the dog for a 15-minute walk around the neighborhood.",
    xpReward: 20,
    coinReward: 15,
    difficulty: 2,
    category: "pets",
    // FIX: was "daily" — should be "weekly" per our table
    recurrence: "weekly",
    defaultSelected: false,
  },
  // ── Bonus / one-time ──────────────────────────────────────────────────────
  {
    id: "clean-garage",
    title: "Help Clean the Garage",
    icon: "🏠",
    description: "Help sort, sweep, and organize the garage.",
    xpReward: 60,
    coinReward: 50,
    difficulty: 3,
    category: "home",
    recurrence: "one-time",
    defaultSelected: false,
  },
];

// ---------------------------------------------------------------------------
// Reward templates (14)
// ---------------------------------------------------------------------------
// Coin economy reference (from our design session):
//   Budget  (≤ 75 coins)  — reachable in a few days of daily quests
//   Mid     (76–199 coins) — ~1–2 weeks of consistent effort
//   Premium (200+ coins)   — meaningful milestone rewards
// ---------------------------------------------------------------------------

export const REWARD_TEMPLATES: readonly RewardTemplate[] = [
  // ── Screen time ───────────────────────────────────────────────────────────
  {
    id: "extra-screen-time-30",
    title: "Extra Screen Time (30 min)",
    icon: "📱",
    description: "Earn 30 extra minutes of screen time today.",
    // FIX: was 20 — aligned to our economy table (budget tier)
    coinCost: 40,
    category: "screen_time",
    stock: -1,
    defaultSelected: true,
  },
  {
    id: "extra-screen-time-1hr",
    title: "Extra Screen Time (1 hour)",
    icon: "🖥️",
    description: "Earn a full extra hour of screen time today.",
    coinCost: 200,
    category: "screen_time",
    stock: -1,
    defaultSelected: false,
  },
  // ── Food & treats ─────────────────────────────────────────────────────────
  {
    id: "special-dessert",
    title: "Special Dessert",
    icon: "🍦",
    description: "Pick any dessert after dinner tonight.",
    // FIX: was 15 — aligned to budget tier
    coinCost: 50,
    category: "food_treats",
    stock: -1,
    defaultSelected: true,
  },
  {
    id: "choose-dinner",
    title: "Choose Dinner",
    icon: "🍕",
    description: "Pick what the family has for dinner tonight.",
    coinCost: 75,
    category: "food_treats",
    stock: -1,
    defaultSelected: true,
  },
  {
    id: "restaurant-choice",
    title: "Pick the Restaurant",
    icon: "🍔",
    description: "Choose which restaurant the family goes to for dinner.",
    coinCost: 175,
    category: "food_treats",
    stock: -1,
    defaultSelected: false,
  },
  // ── Activities ────────────────────────────────────────────────────────────
  {
    id: "park-trip",
    title: "Trip to the Park",
    icon: "🏞️",
    description: "Spend an afternoon at your favorite park.",
    coinCost: 60,
    category: "activities",
    stock: -1,
    // FIX: was true — not in our defaults list
    defaultSelected: false,
  },
  {
    id: "movie-night",
    title: "Movie Night Pick",
    icon: "🎬",
    description: "Choose the movie for family movie night.",
    coinCost: 90,
    category: "activities",
    stock: -1,
    defaultSelected: true,
  },
  {
    id: "friend-playdate",
    title: "Invite a Friend Over",
    icon: "👫",
    description: "Have a friend come over to play for the afternoon.",
    coinCost: 160,
    category: "activities",
    stock: -1,
    defaultSelected: false,
  },
  {
    id: "family-game-night",
    title: "Choose the Game",
    icon: "🎲",
    description: "Pick which board game or card game the family plays tonight.",
    coinCost: 50,
    category: "activities",
    stock: -1,
    defaultSelected: false,
  },
  // ── Privileges ────────────────────────────────────────────────────────────
  {
    id: "stay-up-late",
    title: "Stay Up 30 Minutes Late",
    icon: "🌙",
    description: "Push bedtime back by 30 minutes tonight.",
    coinCost: 60,
    category: "privileges",
    stock: -1,
    defaultSelected: true,
  },
  {
    id: "skip-chore",
    title: "Skip One Chore",
    icon: "🙈",
    description: "Get a free pass to skip one chore of your choice.",
    coinCost: 150,
    category: "privileges",
    stock: -1,
    defaultSelected: false,
  },
  {
    id: "no-bedtime-routine",
    title: "No Bedtime Routine Night",
    icon: "😴",
    description: "Skip the usual bedtime routine steps for one night.",
    coinCost: 100,
    category: "privileges",
    stock: -1,
    defaultSelected: false,
  },
  // ── Physical items ────────────────────────────────────────────────────────
  {
    id: "small-toy",
    title: "Small Toy or Book",
    icon: "🧸",
    description: "Choose a small toy or book (up to $5) from the store.",
    coinCost: 200,
    category: "physical_items",
    stock: -1,
    defaultSelected: false,
  },
  {
    id: "art-supplies",
    title: "Art Supplies",
    icon: "🎨",
    description: "Get a new set of markers, colored pencils, or craft supplies.",
    coinCost: 175,
    category: "physical_items",
    stock: -1,
    defaultSelected: false,
  },
];

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export const DEFAULT_QUEST_IDS: ReadonlySet<string> = new Set(
  QUEST_TEMPLATES.filter((q) => q.defaultSelected).map((q) => q.id)
);

export const DEFAULT_REWARD_IDS: ReadonlySet<string> = new Set(
  REWARD_TEMPLATES.filter((r) => r.defaultSelected).map((r) => r.id)
);
