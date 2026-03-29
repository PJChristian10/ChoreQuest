import styles from "./QuestCardRewards.module.css";

interface QuestCardRewardsProps {
  xpReward: number;
  coinReward: number;
}

export function QuestCardRewards({
  xpReward,
  coinReward,
}: QuestCardRewardsProps): JSX.Element {
  return (
    <div className={styles.rewards}>
      <span className={`${styles.badge} ${styles.xpBadge}`}>
        {xpReward} XP
      </span>
      <span className={`${styles.badge} ${styles.coinBadge}`}>
        {coinReward} coins
      </span>
    </div>
  );
}
