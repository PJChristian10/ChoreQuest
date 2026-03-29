/**
 * ArtPicker.tsx
 *
 * Inline art selector shown during quest creation/editing.
 * Displays a grid of emoji options filtered to the quest's category,
 * with an "All" toggle to show cross-category options.
 *
 * Props:
 *   category     — current quest category (filters the grid)
 *   selectedKey  — currently selected artKey
 *   onChange     — called with the new artKey when user picks an option
 */

import { useState } from "react";
import {
  getArtOptionsForCategory,
  getAllArtOptions,
} from "../../utils/questArtUtils.js";
import type { QuestCategory } from "../../models/quest.js";
import styles from "./ArtPicker.module.css";

interface ArtPickerProps {
  readonly category: QuestCategory;
  readonly selectedKey: string;
  readonly onChange: (artKey: string) => void;
}

export function ArtPicker({ category, selectedKey, onChange }: ArtPickerProps) {
  const [showAll, setShowAll] = useState(false);

  const options = showAll
    ? getAllArtOptions()
    : getArtOptionsForCategory(category);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.label}>Quest Art</span>
        <button
          type="button"
          className={`${styles.toggleAll} ${showAll ? styles.toggleAllActive : ""}`}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show category" : "Show all"}
        </button>
      </div>

      <div className={styles.grid}>
        {options.map((art) => (
          <button
            key={art.artKey}
            type="button"
            className={`${styles.option} ${
              art.artKey === selectedKey ? styles.optionSelected : ""
            }`}
            style={{
              background: `linear-gradient(${art.gradient})`,
            }}
            onClick={() => onChange(art.artKey)}
            aria-label={`Select art: ${art.emoji}`}
            aria-pressed={art.artKey === selectedKey}
          >
            <span className={styles.optionEmoji}>{art.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
