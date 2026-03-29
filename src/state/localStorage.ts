import type { GameState } from "./types.js";
import type { QuestCategory } from "../models/quest.js";
import { getQuestArt } from "../utils/questArtUtils.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "chorequest_state";

// Required top-level keys that must be present for a valid GameState
const REQUIRED_KEYS: ReadonlyArray<keyof GameState> = [
  "players",
  "quests",
  "claims",
  "rewards",
  "redemptions",
  "parentConfig",
  "parentSession",
];

// ---------------------------------------------------------------------------
// saveState
// ---------------------------------------------------------------------------

export function saveState(state: GameState): boolean {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Date revival helpers
// ---------------------------------------------------------------------------

/** Parse a string that may be an ISO date string; returns a Date if it looks
 *  like an ISO string, otherwise returns the original value unchanged. */
function reviveDateString(value: unknown): unknown {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
}

/** Revive all Date fields in raw parsed data. Returns a new object with Date
 *  fields restored from ISO strings. This avoids a custom JSON.parse reviver
 *  that would be hard to reason about under strict TypeScript. */
function reviveDates(raw: Record<string, unknown>): GameState {
  // players[].badges[].awardedAt
  const players = Array.isArray(raw["players"])
    ? (raw["players"] as Array<Record<string, unknown>>).map((player) => ({
        ...player,
        badges: Array.isArray(player["badges"])
          ? (player["badges"] as Array<Record<string, unknown>>).map((badge) => ({
              ...badge,
              awardedAt: reviveDateString(badge["awardedAt"]),
            }))
          : player["badges"],
      }))
    : raw["players"];

  // quests[].createdAt + artKey migration
  const quests = Array.isArray(raw["quests"])
    ? (raw["quests"] as Array<Record<string, unknown>>).map((quest) => {
        const q: Record<string, unknown> = {
          ...quest,
          createdAt: quest["createdAt"] !== undefined
            ? reviveDateString(quest["createdAt"])
            : undefined,
        };
        if (!q["artKey"]) {
          const category = (q["category"] as QuestCategory) ?? "home";
          q["artKey"] = getQuestArt(String(q["title"] ?? ""), category).artKey;
        }
        return q;
      })
    : raw["quests"];

  // claims[].claimedAt, claims[].resolvedAt
  const claims = Array.isArray(raw["claims"])
    ? (raw["claims"] as Array<Record<string, unknown>>).map((claim) => ({
        ...claim,
        claimedAt: reviveDateString(claim["claimedAt"]),
        resolvedAt: claim["resolvedAt"] !== undefined
          ? reviveDateString(claim["resolvedAt"])
          : undefined,
      }))
    : raw["claims"];

  // rewards[].expiresAt
  const rewards = Array.isArray(raw["rewards"])
    ? (raw["rewards"] as Array<Record<string, unknown>>).map((reward) => ({
        ...reward,
        expiresAt: reward["expiresAt"] !== undefined
          ? reviveDateString(reward["expiresAt"])
          : undefined,
      }))
    : raw["rewards"];

  // redemptions[].redeemedAt, redemptions[].fulfilledAt
  const redemptions = Array.isArray(raw["redemptions"])
    ? (raw["redemptions"] as Array<Record<string, unknown>>).map((redemption) => ({
        ...redemption,
        redeemedAt: reviveDateString(redemption["redeemedAt"]),
        fulfilledAt: redemption["fulfilledAt"] !== undefined
          ? reviveDateString(redemption["fulfilledAt"])
          : undefined,
      }))
    : raw["redemptions"];

  // parentSession.createdAt, parentSession.lastActivityAt
  const rawSession = raw["parentSession"];
  const parentSession =
    rawSession !== null && typeof rawSession === "object"
      ? {
          ...(rawSession as Record<string, unknown>),
          createdAt: reviveDateString((rawSession as Record<string, unknown>)["createdAt"]),
          lastActivityAt: reviveDateString(
            (rawSession as Record<string, unknown>)["lastActivityAt"]
          ),
        }
      : rawSession;

  return {
    players,
    quests,
    claims,
    rewards,
    redemptions,
    parentConfig: raw["parentConfig"] as GameState["parentConfig"],
    parentSession,
  } as GameState;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function hasRequiredKeys(data: unknown): data is Record<string, unknown> {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return REQUIRED_KEYS.every((key) => key in obj);
}

// ---------------------------------------------------------------------------
// loadState
// ---------------------------------------------------------------------------

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);

    if (!hasRequiredKeys(parsed)) return null;

    return reviveDates(parsed);
  } catch {
    return null;
  }
}
