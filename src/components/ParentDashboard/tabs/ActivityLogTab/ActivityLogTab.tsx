import { useGameState } from "../../../../state/GameContext.js";
import type { QuestClaim } from "../../../../models/quest.js";
import type { RewardRedemption } from "../../../../models/reward.js";
import styles from "./ActivityLogTab.module.css";

type LogEntry = {
  id: string;
  timestamp: Date;
  actorName: string;
  action: string;
  detail: string;
  value?: string;
};

function buildClaimEntry(
  claim: QuestClaim,
  playerName: string,
  questTitle: string,
  xpReward: number,
  coinReward: number
): LogEntry {
  return {
    id: `claim-${claim.id}`,
    timestamp: claim.claimedAt,
    actorName: playerName,
    action: "completed quest",
    detail: questTitle,
    value: `+${xpReward} XP, +${coinReward} coins`,
  };
}

function buildRedemptionEntry(
  redemption: RewardRedemption,
  playerName: string,
  rewardTitle: string,
  coinCost: number
): LogEntry {
  return {
    id: `redemption-${redemption.id}`,
    timestamp: redemption.redeemedAt,
    actorName: playerName,
    action: "redeemed reward",
    detail: rewardTitle,
    value: `-${coinCost} coins`,
  };
}

export function ActivityLogTab(): JSX.Element {
  const state = useGameState();

  const entries: LogEntry[] = [];

  for (const claim of state.claims) {
    const player = state.players.find((p) => p.id === claim.playerId);
    const quest = state.quests.find((q) => q.id === claim.questId);
    if (player !== undefined && quest !== undefined) {
      entries.push(
        buildClaimEntry(claim, player.name, quest.title, quest.xpReward, quest.coinReward)
      );
    }
  }

  for (const redemption of state.redemptions) {
    const player = state.players.find((p) => p.id === redemption.playerId);
    const reward = state.rewards.find((r) => r.id === redemption.rewardId);
    if (player !== undefined && reward !== undefined) {
      entries.push(
        buildRedemptionEntry(redemption, player.name, reward.title, reward.coinCost)
      );
    }
  }

  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (entries.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Activity Log</h2>
        <p data-testid="empty-log" className={styles.emptyState}>
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Activity Log</h2>
      <ul className={styles.logList}>
        {entries.map((entry) => (
          <li key={entry.id} data-testid="log-entry" className={styles.logEntry}>
            <span className={styles.entryActor}>{entry.actorName}</span>
            <span className={styles.entryAction}>{entry.action}</span>
            <span className={styles.entryDetail}>{entry.detail}</span>
            {entry.value !== undefined && (
              <span className={styles.entryDetail}>{entry.value}</span>
            )}
            <span className={styles.entryTime}>
              {entry.timestamp.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
