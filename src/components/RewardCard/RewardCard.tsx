import type { Reward } from "../../models/reward.js";
import styles from "./RewardCard.module.css";

interface RewardCardProps {
  reward: Reward;
  playerCoins: number;
  onRedeem: (rewardId: string) => void;
  nowFn?: () => Date;
}

export function RewardCard({
  reward,
  playerCoins,
  onRedeem,
  nowFn = () => new Date(),
}: RewardCardProps): JSX.Element | null {
  // Inactive: don't render at all
  if (!reward.isActive) {
    return null;
  }

  const isExpired = reward.expiresAt !== undefined && reward.expiresAt < nowFn();
  const isOutOfStock = reward.stock === 0;
  const cantAfford = playerCoins < reward.coinCost;

  const isUnavailable = isExpired || isOutOfStock || cantAfford;
  const cardClass = [styles.card, isUnavailable ? styles.cardMuted : ""].filter(Boolean).join(" ");

  const renderStatus = () => {
    if (isExpired) {
      return (
        <span data-testid="expired-label" className={styles.statusLabel}>
          Expired
        </span>
      );
    }
    if (isOutOfStock) {
      return (
        <span data-testid="out-of-stock-label" className={styles.statusLabel}>
          Out of Stock
        </span>
      );
    }
    if (cantAfford) {
      return (
        <span data-testid="cant-afford-label" className={styles.statusLabel}>
          Can&apos;t Afford
        </span>
      );
    }
    return (
      <button
        aria-label={`Redeem ${reward.title}`}
        className={styles.redeemButton}
        onClick={() => onRedeem(reward.id)}
      >
        Redeem
      </button>
    );
  };

  return (
    <div className={cardClass}>
      <div className={styles.title}>{reward.title}</div>
      <div className={styles.description}>{reward.description}</div>
      <div>
        <span data-testid="coin-cost" className={styles.coinCost}>
          {reward.coinCost}
        </span>
        <span> coins</span>
      </div>
      <span data-testid="category-badge" className={styles.categoryBadge}>
        {reward.category}
      </span>
      {reward.stock !== -1 && reward.stock > 0 && (
        <span data-testid="stock-count" className={styles.stockCount}>
          {reward.stock} left
        </span>
      )}
      {reward.expiresAt !== undefined && !isExpired && (
        <span className={styles.stockCount}>
          Expires: {reward.expiresAt.toLocaleDateString()}
        </span>
      )}
      {renderStatus()}
    </div>
  );
}
