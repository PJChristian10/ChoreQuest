import type { Player } from "../../models/player.js";
import { getAvatarEmoji } from "../../utils/avatarUtils.js";
import { getLevelTitle } from "../../utils/playerUtils.js";
import styles from "./PlayerCard.module.css";

interface PlayerCardProps {
  player: Player;
  onSelect: (playerId: string) => void;
}

export function PlayerCard({ player, onSelect }: PlayerCardProps): JSX.Element {
  const avatarEmoji = getAvatarEmoji(player.avatar ?? "");
  const levelTitle = getLevelTitle(player.level);

  return (
    <button
      aria-label={player.name}
      className={styles.card}
      onClick={() => onSelect(player.id)}
    >
      <span className={styles.avatar}>{avatarEmoji}</span>
      <span className={styles.name}>{player.name}</span>
      <span className={styles.levelTitle}>{levelTitle}</span>
    </button>
  );
}
