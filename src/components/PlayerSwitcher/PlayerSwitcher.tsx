import type { Player } from "../../models/player.js";
import styles from "./PlayerSwitcher.module.css";

interface PlayerSwitcherProps {
  players: readonly Player[];
  activePlayerId: string | null;
  onSelect: (playerId: string) => void;
}

export function PlayerSwitcher({
  players,
  activePlayerId,
  onSelect,
}: PlayerSwitcherProps): JSX.Element {
  return (
    <nav aria-label="Switch player" className={styles.nav}>
      <p className={styles.label}>Switch Player</p>
      <div className={styles.buttons}>
        {players.map((player) => {
          const isActive = player.id === activePlayerId;
          return (
            <button
              key={player.id}
              aria-pressed={isActive}
              onClick={() => onSelect(player.id)}
              style={{ minHeight: "var(--touch-min)" }}
              className={isActive ? `${styles.button} ${styles.buttonActive}` : styles.button}
            >
              {player.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
