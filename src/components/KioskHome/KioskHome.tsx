import { useState, useMemo } from "react";
import { useGameState } from "../../state/GameContext.js";
import type { Player } from "../../models/player.js";
import { PlayerHeroCard } from "./PlayerHeroCard.js";
import { LeaderboardStrip } from "./LeaderboardStrip.js";
import { PlayerPinOverlay } from "../PlayerPinOverlay/PlayerPinOverlay.js";
import { ParentPinEntry } from "../ParentPinEntry/ParentPinEntry.js";
import { verifyPlayerPin, verifyPin as verifyParentPin } from "../../services/authService.js";
import { TitleBanner } from "../TitleBanner/TitleBanner.js";
import { LevelPath } from "../LevelPath/LevelPath.js";
import styles from "./KioskHome.module.css";

interface KioskHomeProps {
  onPlayerUnlocked: (playerId: string) => void;
  onParentUnlocked: () => void;
}

// Deterministic star positions (seeded, not random) so they're stable across renders
const STAR_POSITIONS: readonly { top: number; left: number; size: number; delay: number }[] = [
  { top: 5, left: 10, size: 2, delay: 0 },
  { top: 12, left: 25, size: 3, delay: 0.5 },
  { top: 8, left: 45, size: 2, delay: 1.0 },
  { top: 15, left: 60, size: 3, delay: 0.3 },
  { top: 3, left: 75, size: 2, delay: 1.5 },
  { top: 20, left: 85, size: 2, delay: 0.8 },
  { top: 7, left: 92, size: 3, delay: 0.2 },
  { top: 25, left: 5, size: 2, delay: 1.2 },
  { top: 30, left: 18, size: 2, delay: 0.6 },
  { top: 18, left: 35, size: 3, delay: 1.8 },
  { top: 35, left: 50, size: 2, delay: 0.9 },
  { top: 22, left: 70, size: 2, delay: 1.3 },
  { top: 10, left: 82, size: 3, delay: 0.4 },
  { top: 40, left: 12, size: 2, delay: 1.7 },
  { top: 28, left: 30, size: 2, delay: 0.1 },
  { top: 45, left: 55, size: 3, delay: 1.1 },
  { top: 32, left: 78, size: 2, delay: 0.7 },
  { top: 50, left: 22, size: 2, delay: 1.6 },
  { top: 42, left: 67, size: 3, delay: 0.3 },
  { top: 55, left: 90, size: 2, delay: 1.4 },
] as const;

export function KioskHome({ onPlayerUnlocked, onParentUnlocked }: KioskHomeProps): JSX.Element {
  const state = useGameState();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showParentPin, setShowParentPin] = useState(false);

  const stars = useMemo(() => STAR_POSITIONS, []);

  const handlePlayerSelect = (playerId: string) => {
    const player = state.players.find((p) => p.id === playerId);
    if (player === undefined) return;

    if (player.playerPin !== undefined) {
      // Player has a PIN — show overlay
      setSelectedPlayer(player);
    } else {
      // No PIN — unlock directly
      onPlayerUnlocked(playerId);
    }
  };

  const handlePinSuccess = (playerId: string) => {
    setSelectedPlayer(null);
    onPlayerUnlocked(playerId);
  };

  const handlePinCancel = () => {
    setSelectedPlayer(null);
  };

  return (
    <main className={styles.kioskHome}>
      <div className={styles.stars} aria-hidden="true">
        {stars.map((s, i) => (
          <span
            key={i}
            className={styles.star}
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      <div className={styles.cloud} aria-hidden="true" style={{ top: "8%", animationDuration: "22s" }} />
      <div className={styles.cloud} aria-hidden="true" style={{ top: "18%", animationDuration: "28s", animationDelay: "5s" }} />
      <div className={styles.cloud} aria-hidden="true" style={{ top: "30%", animationDuration: "25s", animationDelay: "12s" }} />

      <div className={styles.content}>
        <TitleBanner />
        <h2 className={styles.heading}>Who&apos;s playing?</h2>
        <div className={styles.playerGrid}>
          {state.players.map((player) => (
            <PlayerHeroCard
              key={player.id}
              player={player}
              onClick={() => handlePlayerSelect(player.id)}
            />
          ))}
        </div>

        <button
          className={styles.parentButton}
          onClick={() => setShowParentPin(true)}
        >
          Parent
        </button>
      </div>

      {selectedPlayer !== null && (
        <PlayerPinOverlay
          player={selectedPlayer}
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
          verifyPin={verifyPlayerPin}
        />
      )}

      {showParentPin && (
        <ParentPinEntry
          onSuccess={() => {
            setShowParentPin(false);
            onParentUnlocked();
          }}
          onCancel={() => setShowParentPin(false)}
          verifyPin={async (pin) => {
            if (!state.parentConfig) return false;
            return verifyParentPin(pin, state.parentConfig.hashedPin);
          }}
        />
      )}

      <LevelPath players={state.players} />
      <LeaderboardStrip players={state.players} />
    </main>
  );
}
