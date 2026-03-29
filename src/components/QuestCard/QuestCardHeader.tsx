import type { Quest } from "../../models/quest";
import styles from "./QuestCardHeader.module.css";

interface QuestCardHeaderProps {
  quest: Quest;
}

export function QuestCardHeader({ quest }: QuestCardHeaderProps): JSX.Element {
  const totalStars = 3;
  const filledStars = quest.difficulty;

  return (
    <div className={styles.header}>
      <span className={styles.icon} aria-hidden="true">
        {quest.icon}
      </span>
      <div className={styles.meta}>
        <h3 className={styles.title}>{quest.title}</h3>
        <div className={styles.badges}>
          <span className={styles.categoryBadge}>{quest.category}</span>
          <div
            role="img"
            aria-label={`Difficulty: ${quest.difficulty} out of ${totalStars}`}
            className={styles.stars}
          >
            {Array.from({ length: totalStars }, (_, i) => (
              <span
                key={i}
                className={`${styles.star} ${i < filledStars ? styles.starFilled : ""}`}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
