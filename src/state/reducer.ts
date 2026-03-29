import type { GameState, GameAction } from "./types.js";
import { claimQuest, approveQuest, denyQuest } from "../services/questService.js";
import { redeemReward, fulfillRedemption } from "../services/rewardService.js";
import { updateStreak } from "../services/streakService.js";
import { resetWeekly } from "../services/leaderboardService.js";
import { isSessionActive } from "../services/authService.js";

// ---------------------------------------------------------------------------
// INITIAL_STATE
// ---------------------------------------------------------------------------

export const INITIAL_STATE: GameState = {
  players: [],
  quests: [],
  claims: [],
  rewards: [],
  redemptions: [],
  parentConfig: null,
  parentSession: null,
};

// ---------------------------------------------------------------------------
// gameReducer — pure function, all updates are immutable
// ---------------------------------------------------------------------------

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // -----------------------------------------------------------------------
    // LOAD_STATE — replace entire state with payload
    // -----------------------------------------------------------------------
    case "LOAD_STATE":
      return action.payload;

    // -----------------------------------------------------------------------
    // CLAIM_QUEST
    // -----------------------------------------------------------------------
    case "CLAIM_QUEST": {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (quest === undefined) return state;

      const player = state.players.find((p) => p.id === action.playerId);
      if (player === undefined) return state;

      try {
        const { quest: updatedQuest, claim } = claimQuest(quest, player);
        return {
          ...state,
          quests: state.quests.map((q) => (q.id === action.questId ? updatedQuest : q)),
          claims: [...state.claims, claim],
        };
      } catch {
        return state;
      }
    }

    // -----------------------------------------------------------------------
    // APPROVE_QUEST
    // -----------------------------------------------------------------------
    case "APPROVE_QUEST": {
      if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) return state;
      const claim = state.claims.find((c) => c.id === action.claimId);
      if (claim === undefined) return state;

      const quest = state.quests.find((q) => q.id === claim.questId);
      if (quest === undefined) return state;

      if (quest.status !== "awaiting_approval") return state;

      const player = state.players.find((p) => p.id === claim.playerId);
      if (player === undefined) return state;

      try {
        const { player: approvedPlayer, quest: approvedQuest, claim: updatedClaim } =
          approveQuest(claim, quest, player);

        // questService doesn't update weeklyCoins — we add it here
        const playerWithWeeklyCoins = {
          ...approvedPlayer,
          weeklyCoins: player.weeklyCoins + quest.coinReward,
        };

        // Update streak using the date derived from action.now
        const activityDate = action.now.toISOString().slice(0, 10);
        const { player: finalPlayer } = updateStreak(playerWithWeeklyCoins, activityDate);

        // Determine final quest state based on recurrence
        const finalQuest =
          approvedQuest.recurrence === "daily" || approvedQuest.recurrence === "weekly"
            ? { ...approvedQuest, status: "available" as const }
            : { ...approvedQuest, isActive: false };

        return {
          ...state,
          players: state.players.map((p) => (p.id === finalPlayer.id ? finalPlayer : p)),
          quests: state.quests.map((q) => (q.id === finalQuest.id ? finalQuest : q)),
          claims: state.claims.map((c) => (c.id === updatedClaim.id ? updatedClaim : c)),
        };
      } catch {
        return state;
      }
    }

    // -----------------------------------------------------------------------
    // DENY_QUEST
    // -----------------------------------------------------------------------
    case "DENY_QUEST": {
      if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) return state;
      const claim = state.claims.find((c) => c.id === action.claimId);
      if (claim === undefined) return state;

      const quest = state.quests.find((q) => q.id === claim.questId);
      if (quest === undefined) return state;

      try {
        const { quest: updatedQuest, claim: updatedClaim } = denyQuest(claim, quest);
        return {
          ...state,
          quests: state.quests.map((q) => (q.id === updatedQuest.id ? updatedQuest : q)),
          claims: state.claims.map((c) => (c.id === updatedClaim.id ? updatedClaim : c)),
        };
      } catch {
        return state;
      }
    }

    // -----------------------------------------------------------------------
    // REDEEM_REWARD
    // -----------------------------------------------------------------------
    case "REDEEM_REWARD": {
      const reward = state.rewards.find((r) => r.id === action.rewardId);
      if (reward === undefined) return state;

      const player = state.players.find((p) => p.id === action.playerId);
      if (player === undefined) return state;

      try {
        const { player: updatedPlayer, reward: updatedReward, redemption } =
          redeemReward(reward, player);
        return {
          ...state,
          players: state.players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
          rewards: state.rewards.map((r) => (r.id === updatedReward.id ? updatedReward : r)),
          redemptions: [...state.redemptions, redemption],
        };
      } catch {
        return state;
      }
    }

    // -----------------------------------------------------------------------
    // FULFILL_REDEMPTION
    // -----------------------------------------------------------------------
    case "FULFILL_REDEMPTION": {
      if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) return state;
      const redemption = state.redemptions.find((r) => r.id === action.redemptionId);
      if (redemption === undefined) return state;

      if (redemption.status === "fulfilled") return state;

      try {
        const { redemption: updatedRedemption } = fulfillRedemption(redemption);
        return {
          ...state,
          redemptions: state.redemptions.map((r) =>
            r.id === updatedRedemption.id ? updatedRedemption : r
          ),
        };
      } catch {
        return state;
      }
    }

    // -----------------------------------------------------------------------
    // RESET_WEEKLY
    // -----------------------------------------------------------------------
    case "RESET_WEEKLY": {
      try {
        const { players: updatedPlayers } = resetWeekly(state.players, action.bonusAmount);
        return {
          ...state,
          players: updatedPlayers,
        };
      } catch {
        return state;
      }
    }

    // -----------------------------------------------------------------------
    // SET_PARENT_SESSION
    // -----------------------------------------------------------------------
    case "SET_PARENT_SESSION":
      return { ...state, parentSession: action.session };

    // -----------------------------------------------------------------------
    // TOUCH_SESSION
    // -----------------------------------------------------------------------
    case "TOUCH_SESSION": {
      if (state.parentSession === null) return state;
      return {
        ...state,
        parentSession: { ...state.parentSession, lastActivityAt: action.now },
      };
    }

    // -----------------------------------------------------------------------
    // END_SESSION
    // -----------------------------------------------------------------------
    case "END_SESSION": {
      if (state.parentSession === null) return state;
      return {
        ...state,
        parentSession: { ...state.parentSession, isActive: false },
      };
    }

    // -----------------------------------------------------------------------
    // SET_PARENT_CONFIG
    // -----------------------------------------------------------------------
    case "SET_PARENT_CONFIG": {
      // Initial setup (no existing parentConfig) does not require a session.
      // Re-configuration after setup requires an active parent session.
      if (state.parentConfig !== null) {
        if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) return state;
      }
      return { ...state, parentConfig: action.config };
    }

    // -----------------------------------------------------------------------
    // ADD_PLAYER — append a fully-formed player (caller handles PIN hashing)
    // -----------------------------------------------------------------------
    case "ADD_PLAYER":
      return {
        ...state,
        players: [...state.players, action.player],
      };

    // -----------------------------------------------------------------------
    // ADD_QUEST — append a new quest
    // -----------------------------------------------------------------------
    case "ADD_QUEST":
      return {
        ...state,
        quests: [...state.quests, action.quest],
      };

    // -----------------------------------------------------------------------
    // UPDATE_QUEST — replace an existing quest by id
    // -----------------------------------------------------------------------
    case "UPDATE_QUEST": {
      const exists = state.quests.some((q) => q.id === action.quest.id);
      if (!exists) return state;
      return {
        ...state,
        quests: state.quests.map((q) => (q.id === action.quest.id ? action.quest : q)),
      };
    }

    // -----------------------------------------------------------------------
    // DELETE_QUEST — remove a quest by id
    // -----------------------------------------------------------------------
    case "DELETE_QUEST": {
      const exists = state.quests.some((q) => q.id === action.questId);
      if (!exists) return state;
      return {
        ...state,
        quests: state.quests.filter((q) => q.id !== action.questId),
      };
    }

    // -----------------------------------------------------------------------
    // ADD_REWARD — append a new reward
    // -----------------------------------------------------------------------
    case "ADD_REWARD":
      return {
        ...state,
        rewards: [...state.rewards, action.reward],
      };

    // -----------------------------------------------------------------------
    // DELETE_REWARD — remove a reward by id
    // -----------------------------------------------------------------------
    case "DELETE_REWARD": {
      const exists = state.rewards.some((r) => r.id === action.rewardId);
      if (!exists) return state;
      return {
        ...state,
        rewards: state.rewards.filter((r) => r.id !== action.rewardId),
      };
    }

    // -----------------------------------------------------------------------
    // UPDATE_PLAYER — replace an existing player by id
    // -----------------------------------------------------------------------
    case "UPDATE_PLAYER": {
      const exists = state.players.some((p) => p.id === action.player.id);
      if (!exists) return state;
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.player.id ? action.player : p)),
      };
    }

    // -----------------------------------------------------------------------
    // DELETE_PLAYER — remove a player and their associated claims/redemptions
    // -----------------------------------------------------------------------
    case "DELETE_PLAYER": {
      if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) return state;
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.playerId),
        claims: state.claims.filter((c) => c.playerId !== action.playerId),
        redemptions: state.redemptions.filter((r) => r.playerId !== action.playerId),
      };
    }

    // -----------------------------------------------------------------------
    // ADD_QUESTS_BATCH — append quests, skipping any whose id already exists
    // -----------------------------------------------------------------------
    case "ADD_QUESTS_BATCH": {
      const existingIds = new Set(state.quests.map((q) => q.id));
      const incoming = action.payload.quests.filter((q) => !existingIds.has(q.id));
      if (incoming.length === 0) return state;
      return { ...state, quests: [...state.quests, ...incoming] };
    }

    // -----------------------------------------------------------------------
    // ADD_REWARDS_BATCH — append rewards, skipping any whose id already exists
    // -----------------------------------------------------------------------
    case "ADD_REWARDS_BATCH": {
      const existingIds = new Set(state.rewards.map((r) => r.id));
      const incoming = action.payload.rewards.filter((r) => !existingIds.has(r.id));
      if (incoming.length === 0) return state;
      return { ...state, rewards: [...state.rewards, ...incoming] };
    }

    // -----------------------------------------------------------------------
    // Unknown action — return state unchanged, never throw
    // -----------------------------------------------------------------------
    default:
      return state;
  }
}
