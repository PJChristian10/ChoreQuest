import { useState, useRef, useCallback } from "react";
import type { Reward } from "../../models/reward.js";
import type { Player } from "../../models/player.js";
import { PinDots } from "../PinDots/PinDots.js";
import { NumPad } from "../NumPad/NumPad.js";
import styles from "./RedeemConfirmModal.module.css";

const PIN_LENGTH = 4;
const ERROR_RESET_MS = 600;

interface RedeemConfirmModalProps {
  reward: Reward;
  player: Player;
  onConfirm: () => void;
  onCancel: () => void;
  verifyPin: (pin: string, player: Player) => Promise<boolean>;
}

type PinStatus = "idle" | "verifying" | "error" | "success";

export function RedeemConfirmModal({
  reward,
  player,
  onConfirm,
  onCancel,
  verifyPin,
}: RedeemConfirmModalProps): JSX.Element {
  const [digits, setDigits] = useState<string[]>([]);
  const [pinStatus, setPinStatus] = useState<PinStatus>("idle");
  const statusRef = useRef<PinStatus>("idle");

  const isDisabled =
    statusRef.current === "verifying" ||
    statusRef.current === "error" ||
    statusRef.current === "success";

  const handleDigit = useCallback(
    (digit: string) => {
      if (statusRef.current !== "idle") return;

      setDigits((prev) => {
        const newDigits = [...prev, digit];

        if (newDigits.length === PIN_LENGTH) {
          statusRef.current = "verifying";
          setPinStatus("verifying");

          const pin = newDigits.join("");
          verifyPin(pin, player).then((correct) => {
            if (correct) {
              statusRef.current = "success";
              setPinStatus("success");
              onConfirm();
            } else {
              statusRef.current = "error";
              setPinStatus("error");
              setTimeout(() => {
                statusRef.current = "idle";
                setPinStatus("idle");
                setDigits([]);
              }, ERROR_RESET_MS);
            }
          });
        }

        return newDigits;
      });
    },
    [player, verifyPin, onConfirm]
  );

  const handleBackspace = useCallback(() => {
    if (statusRef.current !== "idle") return;
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const statusMessage =
    pinStatus === "error" ? "Wrong PIN, try again" : "Enter your PIN to confirm";

  const dotsStatus: "idle" | "error" | "success" =
    pinStatus === "success" ? "success" : pinStatus === "error" ? "error" : "idle";

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm redemption"
    >
      <div className={styles.modal}>
        <div className={styles.title}>Confirm Redemption</div>

        <div className={styles.rewardInfo}>
          <span className={styles.rewardTitle}>{reward.title}</span>
          <span className={styles.coinCost}>
            <span>{reward.coinCost}</span>
            <span> coins</span>
          </span>
          <span className={styles.playerName}>{player.name}</span>
        </div>

        <p aria-live="polite" className={styles.statusMessage}>
          {statusMessage}
        </p>

        <PinDots length={digits.length} status={dotsStatus} />

        <NumPad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          disabled={isDisabled}
        />

        <button
          aria-label="Cancel redemption"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
