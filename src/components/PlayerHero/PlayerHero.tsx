import type { Player } from "../../models/player.js";
import { getLevelTitle, getXpProgress } from "../../utils/playerUtils.js";
import styles from "./PlayerHero.module.css";

interface PlayerHeroProps {
  player: Player;
  onExit?: () => void;
}

export function PlayerHero({ player, onExit }: PlayerHeroProps): JSX.Element {
  const progress = getXpProgress(player);
  const levelTitle = getLevelTitle(player.level);

  return (
    <div className={styles.hero}>
      <div
        className={styles.avatar}
        aria-label={`${player.name}'s avatar`}
      >
        {player.name[0]?.toUpperCase() ?? "?"}
      </div>

      <div className={styles.info}>
        <h2 className={styles.name}>{player.name}</h2>
        <span className={styles.levelTitle}>{levelTitle}</span>

        <div
          role="progressbar"
          aria-label="XP progress"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className={styles.xpTrack}
        >
          <div
            className={styles.xpFill}
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <span className={styles.xpLabel}>
          {progress.isMaxLevel
            ? "MAX LEVEL"
            : `${player.xp} / ${progress.levelEnd} XP`}
        </span>
      </div>

      <div className={styles.stats}>
        <span aria-label={`${player.coins} coins`}>
          {player.coins} 🪙
        </span>
        <span aria-label={`${player.streak} day streak`}>
          {player.streak} 🔥
        </span>
        {player.streak >= 3 && (
          <span role="status" className={styles.onARoll}>
            On a Roll!
          </span>
        )}
      </div>

      {onExit !== undefined && (
        <button
          type="button"
          className={styles.exitButton}
          onClick={onExit}
          aria-label="Exit to home"
        >
          Exit
        </button>
      )}
    </div>
  );
}
