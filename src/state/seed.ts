import type { GameState } from "./types.js";
import type { Player } from "../models/player.js";
import type { Quest } from "../models/quest.js";
import type { Reward } from "../models/reward.js";
import { getQuestArt } from "../utils/questArtUtils.js";

// ---------------------------------------------------------------------------
// Seed players
// ---------------------------------------------------------------------------

const players: readonly Player[] = [
  {
    id: "player-alex",
    name: "Alex",
    xp: 350,
    lifetimeXP: 350,
    coins: 75,
    lifetimeCoins: 90,
    weeklyCoins: 45,
    level: 3,
    streak: 5,
    longestStreak: 12,
    lastActivityDate: "2026-03-18",
    badges: [],
  },
  {
    id: "player-maya",
    name: "Maya",
    xp: 145,
    lifetimeXP: 145,
    coins: 120,
    lifetimeCoins: 180,
    weeklyCoins: 30,
    level: 2,
    streak: 2,
    longestStreak: 5,
    lastActivityDate: "2026-03-18",
    badges: [],
  },
  {
    id: "player-sam",
    name: "Sam",
    xp: 30,
    lifetimeXP: 30,
    coins: 15,
    lifetimeCoins: 20,
    weeklyCoins: 5,
    level: 1,
    streak: 1,
    longestStreak: 2,
    lastActivityDate: "2026-03-17",
    badges: [],
  },
];

// ---------------------------------------------------------------------------
// Seed quests
// ---------------------------------------------------------------------------

const SEED_DATE = new Date("2026-01-01T00:00:00Z");

const quests: readonly Quest[] = [
  {
    id: "quest-wash-dishes",
    title: "Wash the Dishes",
    icon: "🍳",
    artKey: getQuestArt("Wash the Dishes", "kitchen").artKey,
    description: "",
    category: "kitchen",
    recurrence: "daily",
    difficulty: 1,
    xpReward: 15,
    coinReward: 10,
    isActive: true,
    createdBy: "seed",
    createdAt: SEED_DATE,
  },
  {
    id: "quest-set-table",
    title: "Set the Table",
    icon: "🥄",
    artKey: getQuestArt("Set the Table", "kitchen").artKey,
    description: "",
    category: "kitchen",
    recurrence: "daily",
    difficulty: 1,
    xpReward: 10,
    coinReward: 8,
    isActive: true,
    createdBy: "seed",
    createdAt: SEED_DATE,
  },
  {
    id: "quest-vacuum",
    title: "Vacuum the Living Room",
    icon: "🧹",
    artKey: getQuestArt("Vacuum the Living Room", "cleaning").artKey,
    description: "",
    category: "cleaning",
    recurrence: "weekly",
    difficulty: 2,
    xpReward: 40,
    coinReward: 25,
    isActive: true,
    createdBy: "seed",
    createdAt: SEED_DATE,
  },
  {
    id: "quest-trash",
    title: "Take Out the Trash",
    icon: "🗑️",
    artKey: getQuestArt("Take Out the Trash", "home").artKey,
    description: "",
    category: "home",
    recurrence: "weekly",
    difficulty: 2,
    xpReward: 30,
    coinReward: 20,
    isActive: true,
    createdBy: "seed",
    createdAt: SEED_DATE,
  },
  {
    id: "quest-feed-pets",
    title: "Feed the Pets",
    icon: "🐾",
    artKey: getQuestArt("Feed the Pets", "pets").artKey,
    description: "",
    category: "pets",
    recurrence: "daily",
    difficulty: 1,
    xpReward: 15,
    coinReward: 10,
    isActive: true,
    createdBy: "seed",
    createdAt: SEED_DATE,
  },
  {
    id: "quest-homework",
    title: "Complete Homework",
    icon: "📚",
    artKey: getQuestArt("Complete Homework", "school").artKey,
    description: "",
    category: "school",
    recurrence: "daily",
    difficulty: 2,
    xpReward: 25,
    coinReward: 15,
    isActive: true,
    createdBy: "seed",
    createdAt: SEED_DATE,
  },
  {
    id: "quest-garden",
    title: "Water the Garden",
    icon: "🌱",
    artKey: getQuestArt("Water the Garden", "garden").artKey,
    description: "",
    category: "garden",
    recurrence: "weekly",
    difficulty: 2,
    xpReward: 35,
    coinReward: 22,
    isActive: true,
    createdBy: "seed",
    createdAt: SEED_DATE,
  },
  {
    id: "quest-deep-clean",
    title: "Deep Clean Bedroom",
    icon: "✨",
    artKey: getQuestArt("Deep Clean Bedroom", "cleaning").artKey,
    description: "",
    category: "cleaning",
    recurrence: "one-time",
    difficulty: 3,
    xpReward: 75,
    coinReward: 50,
    isActive: true,
    createdBy: "seed",
    createdAt: SEED_DATE,
  },
];

// ---------------------------------------------------------------------------
// Seed rewards
// ---------------------------------------------------------------------------

const rewards: readonly Reward[] = [
  {
    id: "reward-screen-time",
    title: "Extra Screen Time (+1 hr)",
    icon: "📺",
    description: "Earn one extra hour of screen time",
    category: "screen_time",
    coinCost: 50,
    stock: -1,
    isActive: true,
  },
  {
    id: "reward-pick-dinner",
    title: "Pick Tonight's Dinner",
    icon: "🍽️",
    description: "You choose what the family has for dinner tonight",
    category: "food_treats",
    coinCost: 80,
    stock: -1,
    isActive: true,
  },
  {
    id: "reward-stay-up",
    title: "Stay Up 30 Minutes Late",
    icon: "🌙",
    description: "Stay up an extra 30 minutes past bedtime",
    category: "privileges",
    coinCost: 100,
    stock: -1,
    isActive: true,
  },
  {
    id: "reward-movie-night",
    title: "Movie Night Pick",
    icon: "🎬",
    description: "Choose the movie for family movie night",
    category: "activities",
    coinCost: 120,
    stock: -1,
    isActive: true,
  },
  {
    id: "reward-ice-cream",
    title: "Ice Cream Outing",
    icon: "🍦",
    description: "A trip to get ice cream",
    category: "food_treats",
    coinCost: 150,
    stock: 3,
    isActive: true,
  },
  {
    id: "reward-skip-chore",
    title: "Skip One Chore",
    icon: "🎫",
    description: "Skip one assigned chore, no questions asked",
    category: "privileges",
    coinCost: 200,
    stock: 1,
    isActive: true,
  },
];

// ---------------------------------------------------------------------------
// SEED_STATE
// ---------------------------------------------------------------------------

// Empty initial state — no players triggers the setup wizard on first load.
// The players/quests/rewards/rewards constants above are kept for use in
// tests and fixtures only.
export const SEED_STATE: GameState = {
  players: [],
  quests: [],
  claims: [],
  rewards: [],
  redemptions: [],
  parentConfig: null,
  parentSession: null,
};
