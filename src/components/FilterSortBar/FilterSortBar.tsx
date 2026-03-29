import type { QuestFilterSortOptions } from "../../utils/questFilters";
import styles from "./FilterSortBar.module.css";

interface FilterSortBarProps {
  options: QuestFilterSortOptions;
  onChange: (next: QuestFilterSortOptions) => void;
  availableCategories: readonly string[];
}

export function FilterSortBar({
  options,
  onChange,
  availableCategories,
}: FilterSortBarProps): JSX.Element {
  const categoryId = "filter-category";
  const recurrenceId = "filter-recurrence";
  const difficultyId = "filter-difficulty";
  const sortById = "filter-sort-by";

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label htmlFor={categoryId} className={styles.label}>
          Category
        </label>
        <select
          id={categoryId}
          name="category"
          className={styles.select}
          value={options.category}
          onChange={(e) => onChange({ ...options, category: e.target.value })}
        >
          <option value="all">All</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor={recurrenceId} className={styles.label}>
          Recurrence
        </label>
        <select
          id={recurrenceId}
          name="recurrence"
          className={styles.select}
          value={options.recurrence}
          onChange={(e) => onChange({ ...options, recurrence: e.target.value })}
        >
          <option value="all">All</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="one-time">One-time</option>
          <option value="bonus">Bonus</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor={difficultyId} className={styles.label}>
          Difficulty
        </label>
        <select
          id={difficultyId}
          name="difficulty"
          className={styles.select}
          value={options.difficulty}
          onChange={(e) => onChange({ ...options, difficulty: e.target.value })}
        >
          <option value="all">All</option>
          <option value="1">Easy (1★)</option>
          <option value="2">Medium (2★)</option>
          <option value="3">Hard (3★)</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor={sortById} className={styles.label}>
          Sort by
        </label>
        <select
          id={sortById}
          name="sortBy"
          className={styles.select}
          value={options.sortBy}
          onChange={(e) =>
            onChange({
              ...options,
              sortBy: e.target.value as QuestFilterSortOptions["sortBy"],
            })
          }
        >
          <option value="default">Default</option>
          <option value="xp-desc">Most XP</option>
          <option value="xp-asc">Least XP</option>
          <option value="coins-desc">Most Coins</option>
          <option value="difficulty-asc">Easiest First</option>
          <option value="difficulty-desc">Hardest First</option>
        </select>
      </div>
    </div>
  );
}
