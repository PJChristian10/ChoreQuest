import { useState } from "react";
import { useGameState, useGameDispatch } from "../../state/GameContext.js";
import type { Player } from "../../models/player.js";
import { verifyPlayerPin } from "../../services/authService.js";
import { RewardShopHeader } from "../RewardShopHeader/RewardShopHeader.js";
import { RewardCard } from "../RewardCard/RewardCard.js";
import { RedeemConfirmModal } from "../RedeemConfirmModal/RedeemConfirmModal.js";
import styles from "./RewardShop.module.css";

interface RewardShopProps {
  activePlayerId: string;
  onBack: () => void;
  verifyPin?: (pin: string, player: Player) => Promise<boolean>;
}

export function RewardShop({
  activePlayerId,
  onBack,
  verifyPin = verifyPlayerPin,
}: RewardShopProps): JSX.Element | null {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const activePlayer = state.players.find((p) => p.id === activePlayerId);
  if (activePlayer === undefined) {
    return null;
  }

  const now = new Date();
  const activeRewards = state.rewards.filter(
    (r) => r.isActive && (r.expiresAt === undefined || r.expiresAt >= now)
  );

  const selectedReward = selectedRewardId !== null
    ? state.rewards.find((r) => r.id === selectedRewardId) ?? null
    : null;

  const handleRedeem = (rewardId: string) => {
    setSelectedRewardId(rewardId);
    setShowSuccess(false);
  };

  const handleCancel = () => {
    setSelectedRewardId(null);
  };

  const handleConfirm = () => {
    if (selectedRewardId !== null) {
      dispatch({
        type: "REDEEM_REWARD",
        rewardId: selectedRewardId,
        playerId: activePlayerId,
      });
      setSelectedRewardId(null);
      setShowSuccess(true);
    }
  };

  return (
    <div className={styles.shop}>
      <RewardShopHeader player={activePlayer} onBack={onBack} />

      {showSuccess && (
        <div
          aria-live="polite"
          data-testid="success-message"
          className={styles.successMessage}
        >
          Reward redeemed!
        </div>
      )}

      <ul aria-label="Reward shop" className={styles.rewardGrid}>
        {activeRewards.map((reward) => (
          <li key={reward.id}>
            <RewardCard
              reward={reward}
              playerCoins={activePlayer.coins}
              onRedeem={handleRedeem}
            />
          </li>
        ))}
      </ul>

      {selectedReward !== null && (
        <RedeemConfirmModal
          reward={selectedReward}
          player={activePlayer}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          verifyPin={verifyPin}
        />
      )}
    </div>
  );
}
