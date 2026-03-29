import type { QuestTemplate } from "../../data/templates.js";
import type { QuestRecurrence } from "../../models/quest.js";
import styles from "./QuestTemplateSelector.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestTemplateSelectorProps {
  readonly templates: readonly QuestTemplate[];
  readonly selectedIds: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly onSelectAll: () => void;
  readonly onClearAll: () => void;
  readonly minSelection?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECURRENCE_ORDER: readonly QuestRecurrence[] = ["daily", "weekly", "one-time", "bonus"];

const RECURRENCE_LABELS: Record<QuestRecurrence, string> = {
  daily:      "Daily",
  weekly:     "Weekly",
  "one-time": "One-time",
  bonus:      "Bonus",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export function QuestTemplateSelector({
  templates,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  minSelection = 3,
}: QuestTemplateSelectorProps) {
  const total = templates.length;
  const selectedCount = selectedIds.size;
  const showWarning = selectedCount < minSelection;

  const groups = RECURRENCE_ORDER
    .map((rec) => ({
      recurrence: rec,
      label: RECURRENCE_LABELS[rec],
      items: templates.filter((t) => t.recurrence === rec),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={styles.container}>
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.headerCount}>
          {selectedCount} of {total} selected
        </span>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnHeader}
            onClick={onSelectAll}
          >
            Select All
          </button>
          <button
            type="button"
            className={styles.btnHeader}
            onClick={onClearAll}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* ── Below-minimum warning ──────────────────────────────────────── */}
      {showWarning && (
        <p className={styles.warning} role="alert">
          Select at least {minSelection} quests to continue.
        </p>
      )}

      {/* ── Groups ─────────────────────────────────────────────────────── */}
      <div className={styles.groups}>
        {groups.map(({ recurrence, label, items }) => (
          <section key={recurrence} className={styles.group}>
            <h3 className={styles.groupLabel}>{label}</h3>
            <div className={styles.grid}>
              {items.map((template) => {
                const isSelected = selectedIds.has(template.id);
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
                    onClick={() => onToggle(template.id)}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Deselect" : "Select"} quest: ${template.title}`}
                  >
                    {/* Checkmark overlay */}
                    {isSelected && (
                      <div className={styles.checkOverlay} aria-hidden="true">
                        <span className={styles.checkIcon}>✓</span>
                      </div>
                    )}

                    {/* Icon */}
                    <div className={styles.cardTop}>
                      <span className={styles.cardIcon} aria-hidden="true">
                        {template.icon}
                      </span>
                      <span className={styles.recurrenceBadge}>
                        {RECURRENCE_LABELS[template.recurrence]}
                      </span>
                    </div>

                    {/* Body */}
                    <div className={styles.cardBody}>
                      <p className={styles.cardTitle}>{template.title}</p>

                      <div className={styles.cardMeta}>
                        <span
                          role="img"
                          aria-label={`Difficulty: ${template.difficulty} of 3`}
                          className={styles.stars}
                        >
                          {renderStars(template.difficulty)}
                        </span>
                      </div>

                      <div className={styles.rewards}>
                        <span className={styles.rewardXp}>+{template.xpReward} XP</span>
                        <span className={styles.rewardCoins}>+{template.coinReward} 🪙</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
