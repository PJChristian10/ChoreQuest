import type { Player } from "../models/player.js";
import type { Quest, QuestClaim } from "../models/quest.js";
import type { Reward, RewardRedemption } from "../models/reward.js";
import type { ParentConfig, ParentSession } from "../models/auth.js";

// ---------------------------------------------------------------------------
// GameState
// ---------------------------------------------------------------------------

export interface GameState {
  readonly players: readonly Player[];
  readonly quests: readonly Quest[];
  readonly claims: readonly QuestClaim[];
  readonly rewards: readonly Reward[];
  readonly redemptions: readonly RewardRedemption[];
  readonly parentConfig: ParentConfig | null;
  readonly parentSession: ParentSession | null;
}

// ---------------------------------------------------------------------------
// GameAction — discriminated union
// ---------------------------------------------------------------------------

export type GameAction =
  | { readonly type: "LOAD_STATE"; readonly payload: GameState }
  | { readonly type: "CLAIM_QUEST"; readonly questId: string; readonly playerId: string }
  | { readonly type: "APPROVE_QUEST"; readonly claimId: string; readonly now: Date }
  | { readonly type: "DENY_QUEST"; readonly claimId: string }
  | { readonly type: "REDEEM_REWARD"; readonly rewardId: string; readonly playerId: string }
  | { readonly type: "FULFILL_REDEMPTION"; readonly redemptionId: string; readonly now: Date }
  | { readonly type: "RESET_WEEKLY"; readonly bonusAmount: number }
  | { readonly type: "SET_PARENT_SESSION"; readonly session: ParentSession | null }
  | { readonly type: "TOUCH_SESSION"; readonly now: Date }
  | { readonly type: "END_SESSION" }
  | { readonly type: "SET_PARENT_CONFIG"; readonly config: ParentConfig }
  | { readonly type: "ADD_PLAYER"; readonly player: Player }
  | { readonly type: "ADD_QUEST"; readonly quest: Quest }
  | { readonly type: "UPDATE_QUEST"; readonly quest: Quest }
  | { readonly type: "DELETE_QUEST"; readonly questId: string }
  | { readonly type: "ADD_REWARD"; readonly reward: Reward }
  | { readonly type: "DELETE_REWARD"; readonly rewardId: string }
  | { readonly type: "UPDATE_PLAYER"; readonly player: Player }
  | { readonly type: "DELETE_PLAYER"; readonly playerId: string }
  | { readonly type: "ADD_QUESTS_BATCH"; readonly payload: { readonly quests: readonly Quest[] } }
  | { readonly type: "ADD_REWARDS_BATCH"; readonly payload: { readonly rewards: readonly Reward[] } };
