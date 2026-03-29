import type { Player } from "../../models/player.js";
import { rankPlayers } from "../../services/leaderboardService.js";
import { getAvatarEmoji } from "../../utils/avatarUtils.js";
import styles from "./LeaderboardStrip.module.css";

interface LeaderboardStripProps {
  readonly players: readonly Player[];
}

function getRankDisplay(rank: number): { type: "emoji"; value: string } | { type: "number"; value: number } {
  if (rank === 1) return { type: "emoji", value: "🥇" };
  if (rank === 2) return { type: "emoji", value: "🥈" };
  if (rank === 3) return { type: "emoji", value: "🥉" };
  return { type: "number", value: rank };
}

export function LeaderboardStrip({ players }: LeaderboardStripProps): JSX.Element {
  const allZero = players.every((p) => p.weeklyCoins === 0);
  const { entries } = rankPlayers(players);

  return (
    <aside className={styles.strip} aria-label="Weekly leaderboard">
      <span className={styles.label}>This Week</span>

      {allZero ? (
        <span className={styles.emptyMessage}>No activity yet this week</span>
      ) : (
        <div className={styles.entries}>
          {entries.map(({ player, rank, weeklyCoins }) => {
            const rankDisplay = getRankDisplay(rank);
            const avatarEmoji = getAvatarEmoji(player.avatar ?? "");

            return (
              <div key={player.id} className={styles.entry}>
                {rankDisplay.type === "emoji" ? (
                  <span className={styles.rankBadge}>{rankDisplay.value}</span>
                ) : (
                  <span className={styles.rankNumber}>{rankDisplay.value}</span>
                )}
                <span className={styles.entryAvatar}>{avatarEmoji}</span>
                <span className={styles.entryName}>{player.name}</span>
                <span className={styles.entryCoins}>{weeklyCoins}🪙</span>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
