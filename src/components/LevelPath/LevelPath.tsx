import { useState, useEffect, useRef } from "react";
import { Check, Lock } from "lucide-react";
import type { Player } from "../../models/player.js";
import { getAvatarEmoji } from "../../utils/avatarUtils.js";
import styles from "./LevelPath.module.css";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const LEVELS = [
  { level: 1,  title: "Apprentice",   xp: 0    },
  { level: 2,  title: "Squire",       xp: 100  },
  { level: 3,  title: "Scout",        xp: 250  },
  { level: 4,  title: "Ranger",       xp: 500  },
  { level: 5,  title: "Knight",       xp: 900  },
  { level: 6,  title: "Champion",     xp: 1400 },
  { level: 7,  title: "Guardian",     xp: 2000 },
  { level: 8,  title: "Warlord",      xp: 2800 },
  { level: 9,  title: "Legend",       xp: 3800 },
  { level: 10, title: "Grand Master", xp: 5000 },
] as const;

const LEVEL_PERKS: Record<number, string> = {
  1:  "Starting rank",
  2:  "New avatar frame color",
  3:  "Medium difficulty quests unlocked",
  4:  "Bonus quest visibility",
  5:  "Exclusive reward unlocked",
  6:  "Custom title suffix",
  7:  "Profile background theme",
  8:  "Sibling challenge ability",
  9:  "Gold avatar frame",
  10: "Hall of Fame entry",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NodeState = "completed" | "active" | "locked";

interface LevelPathProps {
  readonly players: readonly Player[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNodeState(level: number, players: readonly Player[]): NodeState {
  if (players.length === 0) return "locked";
  const allPast = players.every((p) => p.level > level);
  if (allPast) return "completed";
  const anyAtLevel = players.some((p) => p.level === level);
  if (anyAtLevel) return "active";
  const anyReached = players.some((p) => p.level >= level);
  return anyReached ? "completed" : "locked";
}

function getPlayersAtLevel(level: number, players: readonly Player[]): readonly Player[] {
  return players.filter((p) => p.level === level);
}

// ---------------------------------------------------------------------------
// NodeTooltip
// ---------------------------------------------------------------------------

interface NodeTooltipProps {
  readonly level: number;
  readonly title: string;
  readonly xp: number;
  readonly onDismiss: () => void;
}

function NodeTooltip({ level, title, xp, onDismiss }: NodeTooltipProps): JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 3000);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  return (
    <div className={styles.tooltip} role="tooltip">
      <span className={styles.tooltipTitle}>{title}</span>
      <span className={styles.tooltipXp}>{xp === 0 ? "No XP required" : `${xp} XP to unlock`}</span>
      <span className={styles.tooltipPerk}>{LEVEL_PERKS[level]}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LevelNode
// ---------------------------------------------------------------------------

interface LevelNodeProps {
  readonly level: number;
  readonly title: string;
  readonly xp: number;
  readonly nodeState: NodeState;
  readonly playersHere: readonly Player[];
  readonly tooltipOpen: boolean;
  readonly onTap: () => void;
  readonly onTooltipDismiss: () => void;
}

function LevelNode({
  level,
  title,
  xp,
  nodeState,
  playersHere,
  tooltipOpen,
  onTap,
  onTooltipDismiss,
}: LevelNodeProps): JSX.Element {
  return (
    <div className={styles.nodeWrapper}>
      {/* XP threshold above node */}
      <span className={styles.nodeXp} aria-hidden="true">
        {xp === 0 ? "—" : `${xp}`}
      </span>

      {/* Player avatars above node when active */}
      {playersHere.length > 0 && (
        <div className={styles.avatarRow} aria-label={`Players at level ${level}`}>
          {playersHere.map((p) => (
            <span
              key={p.id}
              className={styles.avatarBubble}
              aria-label={p.name}
              title={p.name}
            >
              {getAvatarEmoji(p.avatar ?? "")}
            </span>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltipOpen && (
        <NodeTooltip
          level={level}
          title={title}
          xp={xp}
          onDismiss={onTooltipDismiss}
        />
      )}

      {/* Tap target wrapping the visible circle */}
      <button
        type="button"
        className={`${styles.nodeTapTarget} ${styles[`node_${nodeState}`]}`}
        onClick={onTap}
        aria-label={`Level ${level}: ${title}`}
        aria-pressed={tooltipOpen}
      >
        <span
          className={`${styles.nodeCircle} ${nodeState === "active" ? styles.nodeCircleActive : ""}`}
        >
          {nodeState === "completed" && (
            <Check size={18} aria-hidden="true" strokeWidth={3} />
          )}
          {nodeState === "locked" && (
            <Lock size={14} aria-hidden="true" strokeWidth={2.5} />
          )}
          {nodeState === "active" && (
            <span aria-hidden="true">{level}</span>
          )}
        </span>
      </button>

      {/* Level title below node */}
      <span className={styles.nodeTitle} aria-hidden="true">
        {title}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LevelPath
// ---------------------------------------------------------------------------

export function LevelPath({ players }: LevelPathProps): JSX.Element {
  const [openTooltip, setOpenTooltip] = useState<number | null>(null);

  const handleTap = (level: number) => {
    setOpenTooltip((prev) => (prev === level ? null : level));
  };

  const handleDismiss = () => {
    setOpenTooltip(null);
  };

  return (
    <nav
      className={styles.strip}
      aria-label="Level progression path"
    >
      <div className={styles.track}>
        {LEVELS.map(({ level, title, xp }) => (
          <LevelNode
            key={level}
            level={level}
            title={title}
            xp={xp}
            nodeState={getNodeState(level, players)}
            playersHere={getPlayersAtLevel(level, players)}
            tooltipOpen={openTooltip === level}
            onTap={() => handleTap(level)}
            onTooltipDismiss={handleDismiss}
          />
        ))}
      </div>
    </nav>
  );
}
