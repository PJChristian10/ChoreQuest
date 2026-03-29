import { useGameState, useGameDispatch } from "../../../../state/GameContext.js";
import { isSessionActive } from "../../../../services/authService.js";
import type { GameAction } from "../../../../state/types.js";
import { getAvatarEmoji } from "../../../../utils/avatarUtils.js";
import styles from "./PendingApprovalsTab.module.css";

interface PendingApprovalsTabProps {
  onSessionExpired: () => void;
}

export function PendingApprovalsTab({ onSessionExpired }: PendingApprovalsTabProps): JSX.Element {
  const state = useGameState();
  const dispatch = useGameDispatch();

  function guardedDispatch(action: GameAction) {
    if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) {
      onSessionExpired();
      return;
    }
    dispatch(action);
  }

  const pendingItems = state.quests
    .filter((q) => q.status === "awaiting_approval")
    .map((quest) => {
      const claim = state.claims.find((c) => c.questId === quest.id && !c.voided);
      const player = claim !== undefined
        ? state.players.find((p) => p.id === claim.playerId)
        : undefined;
      return { quest, claim, player };
    })
    .filter(
      (item): item is { quest: typeof item.quest; claim: NonNullable<typeof item.claim>; player: NonNullable<typeof item.player> } =>
        item.claim !== undefined && item.player !== undefined
    );

  if (pendingItems.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Pending Approvals</h2>
        <p data-testid="empty-approvals" className={styles.emptyState}>
          No pending approvals
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Pending Approvals</h2>
      <ul className={styles.approvalList}>
        {pendingItems.map(({ quest, claim, player }) => (
          <li
            key={claim.id}
            data-testid="pending-approval-item"
            className={styles.approvalItem}
          >
            <div className={styles.itemHeader}>
              <span>{getAvatarEmoji(player.avatar ?? "")}</span>
              <span className={styles.playerName}>{player.name}</span>
            </div>

            <span className={styles.questTitle}>{quest.title}</span>

            <div className={styles.rewards}>
              <span className={styles.rewardBadge}>{quest.xpReward} XP</span>
              <span className={styles.rewardBadge}>{quest.coinReward} coins</span>
            </div>

            <div className={styles.actions}>
              <button
                aria-label={`Approve ${quest.title} for ${player.name}`}
                className={styles.approveButton}
                onClick={() =>
                  guardedDispatch({
                    type: "APPROVE_QUEST",
                    claimId: claim.id,
                    now: new Date(),
                  })
                }
              >
                Approve
              </button>

              <button
                aria-label={`Deny ${quest.title} for ${player.name}`}
                className={styles.denyButton}
                onClick={() =>
                  guardedDispatch({
                    type: "DENY_QUEST",
                    claimId: claim.id,
                  })
                }
              >
                Deny
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
