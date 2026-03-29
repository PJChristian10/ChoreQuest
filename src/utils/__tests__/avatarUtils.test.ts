import { describe, it, expect } from "vitest";
import { AVATAR_OPTIONS, getAvatarEmoji } from "../avatarUtils.js";

describe("AVATAR_OPTIONS", () => {
  it("has exactly 12 entries", () => {
    expect(AVATAR_OPTIONS).toHaveLength(12);
  });

  it("all avatar keys in AVATAR_OPTIONS are unique", () => {
    const keys = AVATAR_OPTIONS.map((a) => a.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

describe("getAvatarEmoji", () => {
  it('returns correct emoji for a known key ("dragon" → "🐲")', () => {
    expect(getAvatarEmoji("dragon")).toBe("🐲");
  });

  it('returns "👤" for an unknown key', () => {
    expect(getAvatarEmoji("unknown-key")).toBe("👤");
  });
});
