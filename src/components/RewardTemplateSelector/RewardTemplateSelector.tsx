import type { RewardTemplate } from "../../data/templates.js";
import type { RewardCategory } from "../../models/reward.js";
import styles from "./RewardTemplateSelector.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RewardTemplateSelectorProps {
  readonly templates: readonly RewardTemplate[];
  readonly selectedIds: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly onSelectAll: () => void;
  readonly onClearAll: () => void;
}

interface Tier {
  readonly label: string;
  readonly subtitle: string;
  readonly test: (coinCost: number) => boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIERS: readonly Tier[] = [
  {
    label:    "Budget",
    subtitle: "Reachable in a few days of daily quests",
    test:     (c) => c <= 75,
  },
  {
    label:    "Mid-tier",
    subtitle: "About 1–2 weeks of consistent effort",
    test:     (c) => c >= 76 && c <= 199,
  },
  {
    label:    "Premium",
    subtitle: "A meaningful milestone reward",
    test:     (c) => c >= 200,
  },
];

const CATEGORY_LABELS: Record<RewardCategory, string> = {
  screen_time:    "Screen Time",
  food_treats:    "Food & Treats",
  activities:     "Activities",
  privileges:     "Privileges",
  physical_items: "Physical Items",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RewardTemplateSelector({
  templates,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: RewardTemplateSelectorProps) {
  const total = templates.length;
  const selectedCount = selectedIds.size;

  const tieredGroups = TIERS
    .map((tier) => ({
      ...tier,
      items: templates.filter((t) => tier.test(t.coinCost)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={styles.container}>
      {/* ── Age hint banner ────────────────────────────────────────────── */}
      <div className={styles.ageBanner}>
        <span className={styles.ageBannerIcon} aria-hidden="true">💡</span>
        <span className={styles.ageBannerText}>
          Tip: For younger kids (ages 5–8), keep most rewards under 150 coins
        </span>
      </div>

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

      {/* ── Tier groups ────────────────────────────────────────────────── */}
      <div className={styles.groups}>
        {tieredGroups.map((group) => (
          <section key={group.label} className={styles.group}>
            <div className={styles.groupHeadingBlock}>
              <h3 className={styles.groupLabel}>{group.label}</h3>
              <p className={styles.groupSubtitle}>{group.subtitle}</p>
            </div>
            <div className={styles.grid}>
              {group.items.map((template) => {
                const isSelected = selectedIds.has(template.id);
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
                    onClick={() => onToggle(template.id)}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Deselect" : "Select"} reward: ${template.title}`}
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
                      <span className={styles.categoryBadge}>
                        {CATEGORY_LABELS[template.category]}
                      </span>
                    </div>

                    {/* Body */}
                    <div className={styles.cardBody}>
                      <p className={styles.cardTitle}>{template.title}</p>
                      <div className={styles.coinCost}>
                        <span className={styles.coinIcon} aria-hidden="true">🪙</span>
                        <span className={styles.coinAmount}>{template.coinCost}</span>
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
