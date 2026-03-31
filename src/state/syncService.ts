/**
 * syncService.ts
 *
 * All Supabase I/O lives here. The rest of the app never imports from
 * @supabase/supabase-js directly.
 *
 * Three public concerns:
 *  1. loadFromSupabase — initial load on mount
 *  2. syncAction       — targeted write after each dispatched action
 *  3. pushMigration    — one-time bulk upsert when migrating from localStorage
 *  4. subscribeToFamily — realtime channel for cross-device sync
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient.js";
import type { GameState, GameAction } from "./types.js";
import {
  rowToPlayer, playerToRow,
  rowToQuest, questToRow,
  rowToClaim, claimToRow,
  rowToReward, rewardToRow,
  rowToRedemption, redemptionToRow,
  rowToParentConfig, parentConfigToRow,
  type PlayerRow,
  type QuestRow,
  type QuestClaimRow,
  type RewardRow,
  type RewardRedemptionRow,
  type ParentConfigRow,
} from "./mappers.js";

// ---------------------------------------------------------------------------
// loadFromSupabase
// ---------------------------------------------------------------------------

/**
 * Fetches all family data from Supabase in parallel and assembles a GameState.
 * Returns null if the family has no data yet (first run) or if Supabase is
 * unreachable — callers treat null as "stay on localStorage".
 */
export async function loadFromSupabase(familyId: string): Promise<GameState | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [
      { data: playerRows, error: e1 },
      { data: questRows,  error: e2 },
      { data: claimRows,  error: e3 },
      { data: rewardRows, error: e4 },
      { data: redemptionRows, error: e5 },
      { data: configRow,  error: e6 },
    ] = await Promise.all([
      client.from("players").select("*").eq("family_id", familyId),
      client.from("quests").select("*").eq("family_id", familyId),
      client.from("quest_claims").select("*").eq("family_id", familyId),
      client.from("rewards").select("*").eq("family_id", familyId),
      client.from("reward_redemptions").select("*").eq("family_id", familyId),
      client.from("parent_config").select("*").eq("family_id", familyId).maybeSingle(),
    ]);

    if (e1 || e2 || e3 || e4 || e5 || e6) {
      console.error("[ChoreQuest:loadFromSupabase] Query error(s):", {
        players: e1, quests: e2, claims: e3,
        rewards: e4, redemptions: e5, parentConfig: e6,
      });
      return null;
    }

    // If there are no rows at all, treat as first-run (no migration needed)
    const isEmpty =
      (playerRows ?? []).length === 0 &&
      (questRows ?? []).length === 0 &&
      configRow === null;
    if (isEmpty) return null;

    return {
      players:      (playerRows as PlayerRow[] ?? []).map(rowToPlayer),
      quests:       (questRows as QuestRow[] ?? []).map(rowToQuest),
      claims:       (claimRows as QuestClaimRow[] ?? []).map(rowToClaim),
      rewards:      (rewardRows as RewardRow[] ?? []).map(rowToReward),
      redemptions:  (redemptionRows as RewardRedemptionRow[] ?? []).map(rowToRedemption),
      parentConfig: configRow ? rowToParentConfig(configRow as ParentConfigRow) : null,
      parentSession: null,
    };
  } catch (err) {
    console.error("[ChoreQuest:loadFromSupabase] Unexpected exception:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// syncAction
// ---------------------------------------------------------------------------

/**
 * Writes only the rows touched by `action` to Supabase.
 * `nextState` is the state AFTER the action has been applied by the reducer —
 * it is the source of truth for what to persist.
 *
 * Errors are silently swallowed; localStorage is the offline fallback.
 */
export async function syncAction(
  action: GameAction,
  nextState: GameState,
  familyId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    switch (action.type) {
      // ── Player mutations ──────────────────────────────────────────────────
      case "ADD_PLAYER": {
        await client.from("players").insert(playerToRow(action.player, familyId));
        break;
      }
      case "UPDATE_PLAYER": {
        const p = nextState.players.find((x) => x.id === action.player.id);
        if (p) await client.from("players").upsert(playerToRow(p, familyId));
        break;
      }
      case "DELETE_PLAYER": {
        await client.from("players").delete().eq("id", action.playerId);
        break;
      }

      // ── Quest mutations ───────────────────────────────────────────────────
      case "ADD_QUEST": {
        await client.from("quests").insert(questToRow(action.quest, familyId));
        break;
      }
      case "UPDATE_QUEST": {
        await client.from("quests").upsert(questToRow(action.quest, familyId));
        break;
      }
      case "DELETE_QUEST": {
        await client.from("quests").delete().eq("id", action.questId);
        break;
      }

      // ── Quest claim flow ──────────────────────────────────────────────────
      case "CLAIM_QUEST": {
        // New claim is appended to the end of claims array
        const newClaim = nextState.claims[nextState.claims.length - 1];
        if (newClaim) {
          await client.from("quest_claims").insert(claimToRow(newClaim, familyId));
        }
        // Quest isActive may have changed (one-time quests deactivate on claim)
        const quest = nextState.quests.find((q) => q.id === action.questId);
        if (quest) await client.from("quests").upsert(questToRow(quest, familyId));
        break;
      }
      case "APPROVE_QUEST": {
        const claim = nextState.claims.find((c) => c.id === action.claimId);
        if (!claim) break;
        await client.from("quest_claims").upsert(claimToRow(claim, familyId));
        // Player XP/coins/streak updated
        const player = nextState.players.find((p) => p.id === claim.playerId);
        if (player) await client.from("players").upsert(playerToRow(player, familyId));
        // Quest may have become inactive (one-time)
        const quest = nextState.quests.find((q) => q.id === claim.questId);
        if (quest) await client.from("quests").upsert(questToRow(quest, familyId));
        break;
      }
      case "DENY_QUEST": {
        const claim = nextState.claims.find((c) => c.id === action.claimId);
        if (claim) await client.from("quest_claims").upsert(claimToRow(claim, familyId));
        break;
      }

      // ── Reward mutations ──────────────────────────────────────────────────
      case "ADD_QUESTS_BATCH": {
        if (action.payload.quests.length > 0) {
          await client.from("quests").insert(
            action.payload.quests.map((q) => questToRow(q, familyId))
          );
        }
        break;
      }
      case "ADD_REWARDS_BATCH": {
        if (action.payload.rewards.length > 0) {
          await client.from("rewards").insert(
            action.payload.rewards.map((r) => rewardToRow(r, familyId))
          );
        }
        break;
      }

      case "ADD_REWARD": {
        await client.from("rewards").insert(rewardToRow(action.reward, familyId));
        break;
      }
      case "DELETE_REWARD": {
        await client.from("rewards").delete().eq("id", action.rewardId);
        break;
      }

      // ── Reward redemption flow ────────────────────────────────────────────
      case "REDEEM_REWARD": {
        const newRedemption = nextState.redemptions[nextState.redemptions.length - 1];
        if (newRedemption) {
          await client.from("reward_redemptions").insert(
            redemptionToRow(newRedemption, familyId)
          );
        }
        // Player coins deducted
        const player = nextState.players.find((p) => p.id === action.playerId);
        if (player) await client.from("players").upsert(playerToRow(player, familyId));
        // Reward stock may have decreased
        const reward = nextState.rewards.find((r) => r.id === action.rewardId);
        if (reward) await client.from("rewards").upsert(rewardToRow(reward, familyId));
        break;
      }
      case "FULFILL_REDEMPTION": {
        const redemption = nextState.redemptions.find((r) => r.id === action.redemptionId);
        if (redemption) {
          await client.from("reward_redemptions").upsert(
            redemptionToRow(redemption, familyId)
          );
        }
        break;
      }

      // ── Weekly reset ──────────────────────────────────────────────────────
      case "RESET_WEEKLY": {
        if (nextState.players.length > 0) {
          await client
            .from("players")
            .upsert(nextState.players.map((p) => playerToRow(p, familyId)));
        }
        break;
      }

      // ── Parent config ─────────────────────────────────────────────────────
      case "SET_PARENT_CONFIG": {
        await client.from("parent_config").upsert(
          parentConfigToRow(action.config, familyId)
        );
        break;
      }

      // ── Ephemeral — no Supabase write needed ──────────────────────────────
      case "SET_PARENT_SESSION":
      case "TOUCH_SESSION":
      case "END_SESSION":
      case "LOAD_STATE":
        break;
    }
  } catch (err) {
    // Sync failure is non-fatal; localStorage holds state until reconnect
    console.error(`[ChoreQuest:syncAction] Failed to sync action "${action.type}":`, err);
  }
}

// ---------------------------------------------------------------------------
// pushMigration
// ---------------------------------------------------------------------------

/**
 * One-time bulk upsert: pushes the entire current GameState into Supabase.
 * Called when the app connects for the first time with existing localStorage data.
 */
export async function pushMigration(
  state: GameState,
  familyId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const ops: PromiseLike<unknown>[] = [];

  if (state.players.length > 0) {
    ops.push(
      client.from("players").upsert(state.players.map((p) => playerToRow(p, familyId)))
    );
  }
  if (state.quests.length > 0) {
    ops.push(
      client.from("quests").upsert(state.quests.map((q) => questToRow(q, familyId)))
    );
  }
  if (state.claims.length > 0) {
    ops.push(
      client.from("quest_claims").upsert(state.claims.map((c) => claimToRow(c, familyId)))
    );
  }
  if (state.rewards.length > 0) {
    ops.push(
      client.from("rewards").upsert(state.rewards.map((r) => rewardToRow(r, familyId)))
    );
  }
  if (state.redemptions.length > 0) {
    ops.push(
      client.from("reward_redemptions").upsert(
        state.redemptions.map((r) => redemptionToRow(r, familyId))
      )
    );
  }
  if (state.parentConfig !== null) {
    ops.push(
      client
        .from("parent_config")
        .upsert(parentConfigToRow(state.parentConfig, familyId))
    );
  }

  try {
    await Promise.all(ops);
  } catch (err) {
    console.error("[ChoreQuest:pushMigration] Migration failed:", err);
    throw err; // re-throw so GameContext's outer try/catch can log it too
  }
}

// ---------------------------------------------------------------------------
// subscribeToFamily
// ---------------------------------------------------------------------------

/**
 * Opens a Supabase Realtime channel that fires `onChange` whenever any row
 * in the family's tables is inserted, updated, or deleted.
 *
 * The caller is responsible for calling `supabase.removeChannel(channel)` on
 * unmount.
 */
export function subscribeToFamily(
  familyId: string,
  onChange: () => void
): RealtimeChannel {
  const client = getSupabaseClient()!;
  const filter = (table: string) =>
    ({ event: "*", schema: "public", table, filter: `family_id=eq.${familyId}` } as const);

  return client
    .channel(`chorequest-family-${familyId}`)
    .on("postgres_changes", filter("players"), onChange)
    .on("postgres_changes", filter("quests"), onChange)
    .on("postgres_changes", filter("quest_claims"), onChange)
    .on("postgres_changes", filter("rewards"), onChange)
    .on("postgres_changes", filter("reward_redemptions"), onChange)
    .on("postgres_changes", filter("parent_config"), onChange)
    .subscribe((_, err) => {
      if (err) {
        console.error("[ChoreQuest:subscribeToFamily] Subscription error:", err);
      }
    });
}
