import type { Player } from "../../models/player.js";
import { getAvatarEmoji } from "../../utils/avatarUtils.js";
import styles from "./RewardShopHeader.module.css";

interface RewardShopHeaderProps {
  player: Player;
  onBack: () => void;
}

export function RewardShopHeader({ player, onBack }: RewardShopHeaderProps): JSX.Element {
  const avatarEmoji = getAvatarEmoji(player.avatar ?? "");

  return (
    <header className={styles.header}>
      <button
        aria-label="Back to Quest Board"
        className={styles.backButton}
        onClick={onBack}
      >
        &#8592;
      </button>

      <div className={styles.playerInfo}>
        <span className={styles.avatar}>{avatarEmoji}</span>
        <span className={styles.playerName}>{player.name}</span>
      </div>

      <div
        className={styles.coinDisplay}
        aria-label={`${player.coins} coins`}
      >
        <span>&#9733;</span>
        <span data-testid="coin-balance">{player.coins}</span>
      </div>
    </header>
  );
}
