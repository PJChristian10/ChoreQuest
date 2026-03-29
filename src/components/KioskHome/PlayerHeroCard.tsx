import type { Player } from "../../models/player.js";
import { getAvatarEmoji } from "../../utils/avatarUtils.js";
import { getLevelTitle, getXpProgress } from "../../utils/playerUtils.js";
import styles from "./PlayerHeroCard.module.css";

interface PlayerHeroCardProps {
  readonly player: Player;
  readonly onClick: () => void;
}

export function PlayerHeroCard({ player, onClick }: PlayerHeroCardProps): JSX.Element {
  const avatarEmoji = getAvatarEmoji(player.avatar ?? "");
  const levelTitle = getLevelTitle(player.level);
  const progress = getXpProgress(player);
  const hasAvatar = player.avatar !== undefined && player.avatar !== "";
  const showStreak = player.streak > 0;
  const showOnARoll = player.streak >= 3;

  return (
    <button
      aria-label={player.name}
      className={styles.card}
      onClick={onClick}
    >
      {hasAvatar ? (
        <span className={styles.avatarEmoji}>{avatarEmoji}</span>
      ) : (
        <span className={styles.avatarFallback} aria-hidden="true">
          {player.name.charAt(0).toUpperCase()}
        </span>
      )}

      <span className={styles.name}>{player.name}</span>
      <span className={styles.levelTitle}>{levelTitle}</span>

      <div className={styles.xpBarWrapper}>
        <div
          role="progressbar"
          aria-label={`${player.name} XP`}
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className={styles.xpBarFill}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <span className={styles.xpLabel}>
        {progress.isMaxLevel
          ? "MAX LEVEL"
          : `${progress.current - progress.levelStart} / ${progress.levelEnd - progress.levelStart} XP`}
      </span>

      <div className={styles.coinRow}>
        <span>🪙</span>
        <span>{player.coins}</span>
      </div>

      {showStreak && (
        <div className={styles.streakRow}>
          <span>{`🔥 ${player.streak}`}</span>
          {showOnARoll && (
            <span role="status" className={styles.onARoll}>
              On a Roll!
            </span>
          )}
        </div>
      )}

      {player.weeklyCoins > 0 && (
        <span className={styles.weeklyCoins}>{player.weeklyCoins} this week</span>
      )}
    </button>
  );
}
