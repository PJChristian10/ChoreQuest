import { describe, it, expect, beforeEach } from "vitest";
import {
  claimQuest,
  approveQuest,
  denyQuest,
  calculateLevel,
} from "../questService.js";
import type { Quest } from "../../models/quest.js";
import type { Player } from "../../models/player.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "quest-1",
    title: "Wash the Dishes",
    icon: "dish",
    xpReward: 50,
    coinReward: 10,
    difficulty: 1,
    recurrence: "daily",
    category: "kitchen",
    status: "available",
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Alice",
    xp: 0,
    lifetimeXP: 0,
    coins: 0,
    lifetimeCoins: 0,
    level: 1,
    streak: 0,
    badges: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateLevel — pure leveling function
// ---------------------------------------------------------------------------

describe("calculateLevel", () => {
  it("returns level 1 at 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("returns level 1 just below 100 XP", () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it("returns level 2 at exactly 100 XP (Squire threshold)", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("returns level 3 at exactly 250 XP (Scout threshold)", () => {
    expect(calculateLevel(250)).toBe(3);
  });

  it("returns level 4 at exactly 500 XP (Ranger threshold)", () => {
    expect(calculateLevel(500)).toBe(4);
  });

  it("returns level 5 at exactly 900 XP (Knight threshold)", () => {
    expect(calculateLevel(900)).toBe(5);
  });

  it("returns level 6 at exactly 1400 XP (Champion threshold)", () => {
    expect(calculateLevel(1400)).toBe(6);
  });

  it("returns level 7 at exactly 2000 XP (Guardian threshold)", () => {
    expect(calculateLevel(2000)).toBe(7);
  });

  it("returns level 8 at exactly 2800 XP (Warlord threshold)", () => {
    expect(calculateLevel(2800)).toBe(8);
  });

  it("returns level 9 at exactly 3800 XP (Legend threshold)", () => {
    expect(calculateLevel(3800)).toBe(9);
  });

  it("returns level 10 at exactly 5000 XP (Grand Master threshold)", () => {
    expect(calculateLevel(5000)).toBe(10);
  });

  it("returns level 10 for XP beyond Grand Master threshold", () => {
    expect(calculateLevel(99999)).toBe(10);
  });

  it("returns level 1 for negative XP (guard against bad data)", () => {
    expect(calculateLevel(-1)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// claimQuest
// ---------------------------------------------------------------------------

describe("claimQuest", () => {
  let availableQuest: Quest;
  let player: Player;

  beforeEach(() => {
    availableQuest = makeQuest({ status: "available" });
    player = makePlayer();
  });

  it("returns a quest with status awaiting_approval", () => {
    const { quest } = claimQuest(availableQuest, player);
    expect(quest.status).toBe("awaiting_approval");
  });

  it("preserves all other quest fields unchanged", () => {
    const { quest } = claimQuest(availableQuest, player);
    expect(quest.id).toBe(availableQuest.id);
    expect(quest.title).toBe(availableQuest.title);
    expect(quest.xpReward).toBe(availableQuest.xpReward);
    expect(quest.coinReward).toBe(availableQuest.coinReward);
  });

  it("does NOT mutate the original quest object", () => {
    claimQuest(availableQuest, player);
    expect(availableQuest.status).toBe("available");
  });

  it("returns a QuestClaim linking the quest id to the player id", () => {
    const { claim } = claimQuest(availableQuest, player);
    expect(claim.questId).toBe(availableQuest.id);
    expect(claim.playerId).toBe(player.id);
  });

  it("returns a claim with voided: false", () => {
    const { claim } = claimQuest(availableQuest, player);
    expect(claim.voided).toBe(false);
  });

  it("returns a claim with a non-empty id", () => {
    const { claim } = claimQuest(availableQuest, player);
    expect(claim.id).toBeTruthy();
  });

  it("returns a claim with a claimedAt Date", () => {
    const { claim } = claimQuest(availableQuest, player);
    expect(claim.claimedAt).toBeInstanceOf(Date);
  });

  it("generates unique claim ids on successive calls", () => {
    const { claim: claim1 } = claimQuest(availableQuest, player);
    const { claim: claim2 } = claimQuest(availableQuest, player);
    expect(claim1.id).not.toBe(claim2.id);
  });

  it("throws when quest is already awaiting_approval", () => {
    const claimedQuest = makeQuest({ status: "awaiting_approval" });
    expect(() => claimQuest(claimedQuest, player)).toThrow();
  });

  it("throws when quest is approved", () => {
    const approvedQuest = makeQuest({ status: "approved" });
    expect(() => claimQuest(approvedQuest, player)).toThrow();
  });

  it("throws when quest is expired", () => {
    const expiredQuest = makeQuest({ status: "expired" });
    expect(() => claimQuest(expiredQuest, player)).toThrow();
  });

  it("throws when quest is denied", () => {
    const deniedQuest = makeQuest({ status: "denied" });
    expect(() => claimQuest(deniedQuest, player)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// approveQuest
// ---------------------------------------------------------------------------

describe("approveQuest", () => {
  let quest: Quest;
  let player: Player;

  beforeEach(() => {
    quest = makeQuest({ status: "awaiting_approval", xpReward: 50, coinReward: 10 });
    player = makePlayer({ id: "player-1", xp: 80, coins: 20, lifetimeCoins: 100 });
  });

  function makeClaim(playerId = "player-1", questId = "quest-1") {
    return {
      id: "claim-1",
      questId,
      playerId,
      claimedAt: new Date(),
      voided: false,
    };
  }

  it("returns a quest with status approved", () => {
    const claim = makeClaim();
    const { quest: updatedQuest } = approveQuest(claim, quest, player);
    expect(updatedQuest.status).toBe("approved");
  });

  it("awards XP to the player", () => {
    const claim = makeClaim();
    const { player: updatedPlayer } = approveQuest(claim, quest, player);
    expect(updatedPlayer.xp).toBe(130); // 80 + 50
  });

  it("awards coins to the player spendable balance", () => {
    const claim = makeClaim();
    const { player: updatedPlayer } = approveQuest(claim, quest, player);
    expect(updatedPlayer.coins).toBe(30); // 20 + 10
  });

  it("adds coins to lifetimeCoins (never decreases)", () => {
    const claim = makeClaim();
    const { player: updatedPlayer } = approveQuest(claim, quest, player);
    expect(updatedPlayer.lifetimeCoins).toBe(110); // 100 + 10
  });

  it("does NOT mutate the original player object", () => {
    const claim = makeClaim();
    approveQuest(claim, quest, player);
    expect(player.xp).toBe(80);
    expect(player.coins).toBe(20);
    expect(player.lifetimeCoins).toBe(100);
  });

  it("does NOT mutate the original quest object", () => {
    const claim = makeClaim();
    approveQuest(claim, quest, player);
    expect(quest.status).toBe("awaiting_approval");
  });

  it("triggers level-up when XP crosses a threshold", () => {
    // 80 XP + 30 XP = 110 XP → crosses 100 XP threshold → level 2
    const levelUpQuest = makeQuest({ status: "awaiting_approval", xpReward: 30 });
    const claim = makeClaim();
    const { player: updatedPlayer } = approveQuest(claim, levelUpQuest, player);
    expect(updatedPlayer.xp).toBe(110);
    expect(updatedPlayer.level).toBe(2);
  });

  it("does NOT level up when XP stays below threshold", () => {
    // 80 XP + 10 XP = 90 XP → still below 100 XP threshold
    const smallQuest = makeQuest({ status: "awaiting_approval", xpReward: 10 });
    const claim = makeClaim();
    const { player: updatedPlayer } = approveQuest(claim, smallQuest, player);
    expect(updatedPlayer.xp).toBe(90);
    expect(updatedPlayer.level).toBe(1);
  });

  it("can level up multiple tiers at once", () => {
    // Player at 0 XP receives 500 XP → jumps to level 4 (Ranger)
    const bigQuest = makeQuest({ status: "awaiting_approval", xpReward: 500 });
    const freshPlayer = makePlayer({ xp: 0, level: 1 });
    const claim = makeClaim("player-1", "quest-1");
    const { player: updatedPlayer } = approveQuest(claim, bigQuest, freshPlayer);
    expect(updatedPlayer.xp).toBe(500);
    expect(updatedPlayer.level).toBe(4);
  });

  it("awards rewards to the matching player, not a different player", () => {
    // claim references player-1, but we pass player-2 — should throw
    const claim = makeClaim("player-2");
    const wrongPlayer = makePlayer({ id: "player-1" });
    expect(() => approveQuest(claim, quest, wrongPlayer)).toThrow();
  });

  it("throws when the claim is voided", () => {
    const voidedClaim = { ...makeClaim(), voided: true };
    expect(() => approveQuest(voidedClaim, quest, player)).toThrow();
  });

  it("throws when the quest is not in awaiting_approval status", () => {
    const availableQuest = makeQuest({ status: "available" });
    const claim = makeClaim();
    expect(() => approveQuest(claim, availableQuest, player)).toThrow();
  });

  it("throws when the claim questId does not match the quest id", () => {
    const mismatchedClaim = makeClaim("player-1", "wrong-quest-id");
    expect(() => approveQuest(mismatchedClaim, quest, player)).toThrow();
  });

  it("preserves all other player fields (name, streak, badges)", () => {
    const playerWithBadges = makePlayer({
      id: "player-1",
      name: "Alice",
      xp: 80,
      coins: 20,
      lifetimeCoins: 100,
      streak: 5,
      badges: [{ id: "badge-1", name: "First Quest", awardedAt: new Date() }],
    });
    const claim = makeClaim();
    const { player: updatedPlayer } = approveQuest(claim, quest, playerWithBadges);
    expect(updatedPlayer.name).toBe("Alice");
    expect(updatedPlayer.streak).toBe(5);
    expect(updatedPlayer.badges).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// denyQuest
// ---------------------------------------------------------------------------

describe("denyQuest", () => {
  function makeClaim(questId = "quest-1", playerId = "player-1") {
    return {
      id: "claim-1",
      questId,
      playerId,
      claimedAt: new Date(),
      voided: false,
    };
  }

  it("returns a quest with status available", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = makeClaim();
    const { quest: updatedQuest } = denyQuest(claim, quest);
    expect(updatedQuest.status).toBe("available");
  });

  it("returns a voided claim", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = makeClaim();
    const { claim: updatedClaim } = denyQuest(claim, quest);
    expect(updatedClaim.voided).toBe(true);
  });

  it("does NOT mutate the original quest object", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = makeClaim();
    denyQuest(claim, quest);
    expect(quest.status).toBe("awaiting_approval");
  });

  it("does NOT mutate the original claim object", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = makeClaim();
    denyQuest(claim, quest);
    expect(claim.voided).toBe(false);
  });

  it("preserves all other quest fields", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = makeClaim();
    const { quest: updatedQuest } = denyQuest(claim, quest);
    expect(updatedQuest.id).toBe(quest.id);
    expect(updatedQuest.title).toBe(quest.title);
    expect(updatedQuest.xpReward).toBe(quest.xpReward);
  });

  it("throws when the quest is not in awaiting_approval status", () => {
    const availableQuest = makeQuest({ status: "available" });
    const claim = makeClaim();
    expect(() => denyQuest(claim, availableQuest)).toThrow();
  });

  it("throws when the claim is already voided", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const voidedClaim = { ...makeClaim(), voided: true };
    expect(() => denyQuest(voidedClaim, quest)).toThrow();
  });

  it("throws when claim questId does not match quest id", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const mismatchedClaim = makeClaim("wrong-quest-id");
    expect(() => denyQuest(mismatchedClaim, quest)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// calculateLevel — sub-threshold boundaries (PRD §5.2.2 gap coverage)
// One-below each level threshold — only level 2 (99 XP) was previously tested.
// ---------------------------------------------------------------------------

describe("calculateLevel — sub-threshold boundaries (PRD §5.2.2)", () => {
  it("returns level 2 at 249 XP (one below Scout threshold of 250)", () => {
    expect(calculateLevel(249)).toBe(2);
  });

  it("returns level 3 at 499 XP (one below Ranger threshold of 500)", () => {
    expect(calculateLevel(499)).toBe(3);
  });

  it("returns level 4 at 899 XP (one below Knight threshold of 900)", () => {
    expect(calculateLevel(899)).toBe(4);
  });

  it("returns level 5 at 1399 XP (one below Champion threshold of 1400)", () => {
    expect(calculateLevel(1399)).toBe(5);
  });

  it("returns level 6 at 1999 XP (one below Guardian threshold of 2000)", () => {
    expect(calculateLevel(1999)).toBe(6);
  });

  it("returns level 7 at 2799 XP (one below Warlord threshold of 2800)", () => {
    expect(calculateLevel(2799)).toBe(7);
  });

  it("returns level 8 at 3799 XP (one below Legend threshold of 3800)", () => {
    expect(calculateLevel(3799)).toBe(8);
  });

  it("returns level 9 at 4999 XP (one below Grand Master threshold of 5000)", () => {
    expect(calculateLevel(4999)).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// claimQuest — isActive guard (PRD §7.1)
// ---------------------------------------------------------------------------

describe("claimQuest — inactive quest guard (PRD §7.1 Quest.isActive)", () => {
  it("throws when quest isActive is false", () => {
    const inactiveQuest = makeQuest({ status: "available", isActive: false });
    const player = makePlayer();
    expect(() => claimQuest(inactiveQuest, player)).toThrow();
  });

  it("succeeds when quest isActive is true", () => {
    const activeQuest = makeQuest({ status: "available", isActive: true });
    const player = makePlayer();
    const { quest } = claimQuest(activeQuest, player);
    expect(quest.status).toBe("awaiting_approval");
  });

  it("succeeds when isActive is undefined (not set — defaults to active)", () => {
    const quest = makeQuest({ status: "available" }); // isActive not set
    const player = makePlayer();
    const { quest: updated } = claimQuest(quest, player);
    expect(updated.status).toBe("awaiting_approval");
  });
});

// ---------------------------------------------------------------------------
// approveQuest — PRD §7.1 model fields and edge cases
// ---------------------------------------------------------------------------

describe("approveQuest — PRD §7.1 model fields and edge cases", () => {
  function makeClaim(playerId = "player-1", questId = "quest-1") {
    return { id: "claim-1", questId, playerId, claimedAt: new Date(), voided: false };
  }

  it("increments lifetimeXP by xpReward (PRD §7.1 Player.lifetimeXP)", () => {
    const player = makePlayer({ id: "player-1", xp: 50, lifetimeXP: 200, level: 3 });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 75 });
    const { player: updated } = approveQuest(makeClaim(), quest, player);
    expect(updated.lifetimeXP).toBe(275); // 200 + 75
  });

  it("lifetimeXP and xp both increase by xpReward", () => {
    const player = makePlayer({ id: "player-1", xp: 80, lifetimeXP: 80 });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 50 });
    const { player: updated } = approveQuest(makeClaim(), quest, player);
    expect(updated.xp).toBe(130);
    expect(updated.lifetimeXP).toBe(130);
  });

  it("does NOT mutate original player.lifetimeXP", () => {
    const player = makePlayer({ id: "player-1", lifetimeXP: 300 });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 50 });
    approveQuest(makeClaim(), quest, player);
    expect(player.lifetimeXP).toBe(300);
  });

  it("returned claim carries xpAwarded snapshot equal to quest.xpReward (PRD §7.1)", () => {
    const player = makePlayer({ id: "player-1" });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 75, coinReward: 15 });
    const { claim: updatedClaim } = approveQuest(makeClaim(), quest, player);
    expect(updatedClaim.xpAwarded).toBe(75);
  });

  it("returned claim carries coinsAwarded snapshot equal to quest.coinReward (PRD §7.1)", () => {
    const player = makePlayer({ id: "player-1" });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 75, coinReward: 15 });
    const { claim: updatedClaim } = approveQuest(makeClaim(), quest, player);
    expect(updatedClaim.coinsAwarded).toBe(15);
  });

  it("returned claim includes resolvedAt timestamp (PRD §7.1)", () => {
    const before = new Date();
    const player = makePlayer({ id: "player-1" });
    const quest = makeQuest({ status: "awaiting_approval" });
    const { claim: updatedClaim } = approveQuest(makeClaim(), quest, player);
    expect(updatedClaim.resolvedAt).toBeInstanceOf(Date);
    expect(updatedClaim.resolvedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("level 10 Grand Master stays capped at level 10 after further XP awards (PRD §5.2.2)", () => {
    const grandMaster = makePlayer({ id: "player-1", xp: 5000, lifetimeXP: 5000, level: 10 });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 500 });
    const { player: updated } = approveQuest(makeClaim(), quest, grandMaster);
    expect(updated.level).toBe(10);
    expect(updated.xp).toBe(5500); // xp still accumulates past cap
  });

  it("quest with 0 xpReward does not change player xp or level", () => {
    const player = makePlayer({ id: "player-1", xp: 50, lifetimeXP: 50, level: 1 });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 0, coinReward: 5 });
    const { player: updated } = approveQuest(makeClaim(), quest, player);
    expect(updated.xp).toBe(50);
    expect(updated.level).toBe(1);
  });

  it("quest with 0 coinReward does not change player coins or lifetimeCoins", () => {
    const player = makePlayer({ id: "player-1", coins: 30, lifetimeCoins: 50 });
    const quest = makeQuest({ status: "awaiting_approval", xpReward: 10, coinReward: 0 });
    const { player: updated } = approveQuest(makeClaim(), quest, player);
    expect(updated.coins).toBe(30);
    expect(updated.lifetimeCoins).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// denyQuest — resolvedAt and claim audit integrity (PRD §7.1)
// ---------------------------------------------------------------------------

describe("denyQuest — resolvedAt and claim audit integrity (PRD §7.1)", () => {
  it("voided claim includes a resolvedAt timestamp", () => {
    const before = new Date();
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = { id: "c1", questId: "quest-1", playerId: "player-1", claimedAt: new Date(), voided: false };
    const { claim: voided } = denyQuest(claim, quest);
    expect(voided.resolvedAt).toBeInstanceOf(Date);
    expect(voided.resolvedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("voided claim preserves id, questId, playerId, and claimedAt", () => {
    const claimedAt = new Date("2026-01-15T10:00:00Z");
    const quest = makeQuest({ status: "awaiting_approval" });
    const claim = { id: "claim-xyz", questId: "quest-1", playerId: "player-2", claimedAt, voided: false };
    const { claim: voided } = denyQuest(claim, quest);
    expect(voided.id).toBe("claim-xyz");
    expect(voided.questId).toBe("quest-1");
    expect(voided.playerId).toBe("player-2");
    expect(voided.claimedAt).toBe(claimedAt);
    expect(voided.voided).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Quest workflow — PRD §5.1.2 and §5.1.3 multi-step scenarios
// ---------------------------------------------------------------------------

describe("quest workflow — PRD §5.1.2 and §5.1.3 business rule scenarios", () => {
  it("denied quest is returned to available and can be re-claimed by the same child (PRD §5.1.2)", () => {
    const quest = makeQuest({ status: "awaiting_approval" });
    const player = makePlayer();
    const originalClaim = { id: "c1", questId: "quest-1", playerId: "player-1", claimedAt: new Date(), voided: false };

    const { quest: available } = denyQuest(originalClaim, quest);
    expect(available.status).toBe("available");

    const { quest: reClaimed, claim: newClaim } = claimQuest(available, player);
    expect(reClaimed.status).toBe("awaiting_approval");
    expect(newClaim.voided).toBe(false);
    expect(newClaim.playerId).toBe("player-1");
  });

  it("two different children can each independently claim the same quest (PRD §5.1.3)", () => {
    const sharedQuest = makeQuest({ status: "available" });
    const alice = makePlayer({ id: "player-1", name: "Alice" });
    const bob = makePlayer({ id: "player-2", name: "Bob" });

    const { claim: aliceClaim } = claimQuest(sharedQuest, alice);
    const { claim: bobClaim } = claimQuest(sharedQuest, bob);

    expect(aliceClaim.playerId).toBe("player-1");
    expect(bobClaim.playerId).toBe("player-2");
    expect(aliceClaim.questId).toBe(bobClaim.questId);
    expect(aliceClaim.id).not.toBe(bobClaim.id);
  });

  it("each child's approval awards XP and coins only to their own profile (PRD §5.1.3)", () => {
    const sharedQuest = makeQuest({ status: "available", xpReward: 40, coinReward: 8 });
    const alice = makePlayer({ id: "player-1", name: "Alice", xp: 0, lifetimeXP: 0, coins: 0, lifetimeCoins: 0 });
    const bob   = makePlayer({ id: "player-2", name: "Bob",   xp: 0, lifetimeXP: 0, coins: 0, lifetimeCoins: 0 });

    const { claim: aliceClaim, quest: alicePending } = claimQuest(sharedQuest, alice);
    const { claim: bobClaim,   quest: bobPending }   = claimQuest(sharedQuest, bob);

    const { player: aliceRewarded } = approveQuest(aliceClaim, alicePending, alice);
    const { player: bobRewarded }   = approveQuest(bobClaim,   bobPending,   bob);

    expect(aliceRewarded.id).toBe("player-1");
    expect(aliceRewarded.xp).toBe(40);
    expect(aliceRewarded.coins).toBe(8);

    expect(bobRewarded.id).toBe("player-2");
    expect(bobRewarded.xp).toBe(40);
    expect(bobRewarded.coins).toBe(8);
  });

  it("complete claim → approve flow awards correct XP, coins, level, and snapshots the claim", () => {
    const quest = makeQuest({ status: "available", xpReward: 100, coinReward: 20 });
    const player = makePlayer({ id: "player-1", xp: 0, lifetimeXP: 0, coins: 0, lifetimeCoins: 0, level: 1 });

    const { quest: pending, claim } = claimQuest(quest, player);
    expect(pending.status).toBe("awaiting_approval");

    const { player: rewarded, quest: approved, claim: resolved } = approveQuest(claim, pending, player);

    expect(approved.status).toBe("approved");
    expect(rewarded.xp).toBe(100);
    expect(rewarded.lifetimeXP).toBe(100);
    expect(rewarded.coins).toBe(20);
    expect(rewarded.lifetimeCoins).toBe(20);
    expect(rewarded.level).toBe(2); // 100 XP → Squire
    expect(resolved.xpAwarded).toBe(100);
    expect(resolved.coinsAwarded).toBe(20);
    expect(resolved.resolvedAt).toBeInstanceOf(Date);
  });
});
