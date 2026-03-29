/**
 * QuestCard.tsx
 *
 * Primary quest display card for the Quest Board.
 * Shows a rich image area (emoji + category gradient) for visual uniformity,
 * plus all quest metadata and a single contextual action button.
 */

import type { Quest, QuestClaim } from "../../models/quest.js";
import type { Player } from "../../models/player.js";
import { getQuestArtByKey } from "../../utils/questArtUtils.js";
import styles from "./QuestCard.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The effective display state for a specific player + quest combination */
export type CardStatus =
  | "available"
  | "claimed"       // this player has a pending claim
  | "awaiting"      // claimed by this player, parent not yet resolved
  | "approved"      // approved this period
  | "denied"        // denied — can reclaim
  | "expired";

interface QuestCardProps {
  readonly quest: Quest;
  readonly player: Player;
  /** The most recent claim for this player+quest in the current period, if any */
  readonly activeClaim: QuestClaim | null;
  readonly onClaim?: (questId: string) => void;
  readonly disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  kitchen:  "Kitchen",
  cleaning: "Cleaning",
  pets:     "Pets",
  school:   "School",
  garden:   "Garden",
  home:     "Home",
  bonus:    "Bonus",
};

const RECURRENCE_LABELS: Record<string, string> = {
  daily:    "Daily",
  weekly:   "Weekly",
  "one-time": "One-time",
  bonus:    "Bonus",
};

function deriveStatus(claim: QuestClaim | null): CardStatus {
  if (!claim) return "available";
  switch (claim.status) {
    case "pending":  return "awaiting";
    case "approved": return "approved";
    case "denied":   return "denied";
    default:         return "available";
  }
}

function renderStars(difficulty: 1 | 2 | 3) {
  return Array.from({ length: 3 }, (_, i) => (
    <span
      key={i}
      className={i < difficulty ? styles.starFilled : styles.starEmpty}
      aria-hidden="true"
    >
      ★
    </span>
  ));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuestCard({
  quest,
  player,
  activeClaim,
  onClaim,
  disabled = false,
}: QuestCardProps) {
  const art = getQuestArtByKey(quest.artKey, quest.category);
  const status = deriveStatus(activeClaim);
  const isClaimable = status === "available" || status === "denied";

  const handleClaim = () => {
    if (isClaimable && !disabled) {
      onClaim?.(quest.id);
    }
  };

  return (
    <article
      className={`${styles.card} ${styles[`status_${status}`]}`}
      aria-label={`Quest: ${quest.title}`}
    >
      {/* ── Image area ─────────────────────────────────────── */}
      <div
        className={styles.imageArea}
        style={{ background: `linear-gradient(${art.gradient})` }}
        aria-hidden="true"
      >
        <span className={styles.artEmoji}>{art.emoji}</span>

        {/* Category badge */}
        <span className={`${styles.categoryBadge} ${styles[`cat_${quest.category}`]}`}>
          {CATEGORY_LABELS[quest.category]}
        </span>

        {/* Status overlay for non-available states */}
        {status === "awaiting" && (
          <div className={styles.statusOverlay} role="img" aria-label="Awaiting approval">
            <span className={styles.statusIcon} aria-hidden="true">⏳</span>
          </div>
        )}
        {status === "approved" && (
          <div
            className={`${styles.statusOverlay} ${styles.statusOverlayApproved}`}
            role="img"
            aria-label="Quest complete"
          >
            <span className={styles.statusIcon} aria-hidden="true">✓</span>
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* Title */}
        <h3 className={styles.title}>{quest.title}</h3>

        {/* Metadata row */}
        <div className={styles.meta}>
          <span role="img" className={styles.stars} aria-label={`Difficulty: ${quest.difficulty} of 3`}>
            {renderStars(quest.difficulty)}
          </span>
          <span className={styles.recurrence}>
            {RECURRENCE_LABELS[quest.recurrence]}
          </span>
        </div>

        {/* Rewards row */}
        <div className={styles.rewards}>
          <span className={styles.rewardXp}>+{quest.xpReward} XP</span>
          <span className={styles.rewardCoins}>+{quest.coinReward} 🪙</span>
        </div>

        {/* Action button */}
        <div className={styles.action}>
          {status === "available" && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnClaim}`}
              style={{ minHeight: "60px", minWidth: "60px" }}
              onClick={handleClaim}
              disabled={disabled}
              aria-label={`Claim quest: ${quest.title}`}
            >
              Claim Quest
            </button>
          )}
          {status === "denied" && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDenied}`}
              onClick={handleClaim}
              disabled={disabled}
              aria-label={`Re-claim quest: ${quest.title}`}
            >
              Try Again
            </button>
          )}
          {status === "awaiting" && (
            <div
              role="img"
              aria-label="Awaiting approval"
              className={`${styles.btn} ${styles.btnPending}`}
              aria-live="polite"
            >
              Awaiting Approval
            </div>
          )}
          {status === "approved" && (
            <div
              role="img"
              aria-label="Quest complete"
              className={`${styles.btn} ${styles.btnApproved}`}
            >
              Complete ✓
            </div>
          )}
          {status === "expired" && (
            <div className={`${styles.btn} ${styles.btnExpired}`}>
              Expired
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
