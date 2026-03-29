export const AVATAR_OPTIONS = [
  { key: "cat",       emoji: "🐱" },
  { key: "dog",       emoji: "🐶" },
  { key: "lion",      emoji: "🦁" },
  { key: "frog",      emoji: "🐸" },
  { key: "panda",     emoji: "🐼" },
  { key: "fox",       emoji: "🦊" },
  { key: "bear",      emoji: "🐻" },
  { key: "tiger",     emoji: "🐯" },
  { key: "butterfly", emoji: "🦋" },
  { key: "unicorn",   emoji: "🦄" },
  { key: "dragon",    emoji: "🐲" },
  { key: "eagle",     emoji: "🦅" },
] as const;

export type AvatarKey = typeof AVATAR_OPTIONS[number]["key"];

/** Returns the emoji for a given avatar key, or "👤" if key is not recognised. */
export function getAvatarEmoji(key: string): string {
  return AVATAR_OPTIONS.find((a) => a.key === key)?.emoji ?? "👤";
}
