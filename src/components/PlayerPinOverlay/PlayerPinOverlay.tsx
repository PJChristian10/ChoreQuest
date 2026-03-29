import { useState, useRef, useCallback, useEffect } from "react";
import type { Player } from "../../models/player.js";
import { getAvatarEmoji } from "../../utils/avatarUtils.js";
import { PinDots } from "../PinDots/PinDots.js";
import { NumPad } from "../NumPad/NumPad.js";
import styles from "./PlayerPinOverlay.module.css";

const PIN_LENGTH = 4;
const SUCCESS_DELAY_MS = 500;
const ERROR_RESET_MS = 600;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface PlayerPinOverlayProps {
  player: Player;
  onSuccess: (playerId: string) => void;
  onCancel: () => void;
  verifyPin: (pin: string, player: Player) => Promise<boolean>;
  nowFn?: () => number;
}

type OverlayStatus = "idle" | "verifying" | "error" | "success";

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function PlayerPinOverlay({
  player,
  onSuccess,
  onCancel,
  verifyPin,
  nowFn = Date.now,
}: PlayerPinOverlayProps): JSX.Element {
  const [digits, setDigits] = useState<string[]>([]);
  const [status, setStatus] = useState<OverlayStatus>("idle");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdownDisplay, setCountdownDisplay] = useState<string>("");

  // Use a ref to track status synchronously to avoid stale closure issues
  const statusRef = useRef<OverlayStatus>("idle");
  const failedAttemptsRef = useRef(0);
  const lockedUntilRef = useRef<number | null>(null);

  const isLockedOut = lockedUntil !== null && nowFn() < lockedUntil;

  // Countdown interval during lockout
  useEffect(() => {
    if (!isLockedOut || lockedUntil === null) return;

    const update = () => {
      const remaining = lockedUntil - nowFn();
      if (remaining <= 0) {
        setLockedUntil(null);
        lockedUntilRef.current = null;
        setFailedAttempts(0);
        failedAttemptsRef.current = 0;
        setCountdownDisplay("");
      } else {
        setCountdownDisplay(formatCountdown(remaining));
      }
    };

    update(); // immediate update
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isLockedOut, lockedUntil, nowFn]);

  const isDisabled =
    isLockedOut ||
    statusRef.current === "verifying" ||
    statusRef.current === "success" ||
    statusRef.current === "error";

  const handleDigit = useCallback(
    (digit: string) => {
      if (statusRef.current !== "idle") return;
      if (lockedUntilRef.current !== null && nowFn() < lockedUntilRef.current) return;

      setDigits((prev) => {
        const newDigits = [...prev, digit];

        if (newDigits.length === PIN_LENGTH) {
          // Kick off async verification
          statusRef.current = "verifying";
          setStatus("verifying");

          const pin = newDigits.join("");
          verifyPin(pin, player).then((correct) => {
            if (correct) {
              statusRef.current = "success";
              setStatus("success");
              failedAttemptsRef.current = 0;
              setFailedAttempts(0);
              setTimeout(() => {
                onSuccess(player.id);
              }, SUCCESS_DELAY_MS);
            } else {
              statusRef.current = "error";
              setStatus("error");

              const newFailedCount = failedAttemptsRef.current + 1;
              failedAttemptsRef.current = newFailedCount;
              setFailedAttempts(newFailedCount);

              if (newFailedCount >= MAX_ATTEMPTS) {
                const until = nowFn() + LOCKOUT_DURATION_MS;
                lockedUntilRef.current = until;
                setLockedUntil(until);
              }

              setTimeout(() => {
                statusRef.current = "idle";
                setStatus("idle");
                setDigits([]);
              }, ERROR_RESET_MS);
            }
          });
        }

        return newDigits;
      });
    },
    [player, verifyPin, onSuccess, nowFn]
  );

  const handleBackspace = useCallback(() => {
    if (statusRef.current !== "idle") return;
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const statusMessage =
    status === "error" ? "Wrong PIN, try again" : "Enter your PIN";

  const dotsStatus: "idle" | "error" | "success" =
    status === "success" ? "success" : status === "error" ? "error" : "idle";

  if (isLockedOut) {
    return (
      <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="PIN locked out">
        <div className={styles.panel}>
          <div className={styles.playerInfo}>
            <span className={styles.avatar}>{getAvatarEmoji(player.avatar ?? "")}</span>
            <span className={styles.playerName}>{player.name}</span>
          </div>

          <p className={styles.statusMessage}>
            Too many failed attempts. Try again in{" "}
            <span data-testid="lockout-countdown">{countdownDisplay}</span>
          </p>

          <button
            aria-label="Cancel PIN entry"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.panel}>
        <div className={styles.playerInfo}>
          <span className={styles.avatar}>{getAvatarEmoji(player.avatar ?? "")}</span>
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
          aria-label="Cancel PIN entry"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
