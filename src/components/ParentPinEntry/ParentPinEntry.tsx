import { useState, useRef, useCallback } from "react";
import { PinDots } from "../PinDots/PinDots.js";
import { NumPad } from "../NumPad/NumPad.js";
import styles from "./ParentPinEntry.module.css";

const PIN_LENGTH = 4;
const SUCCESS_DELAY_MS = 500;
const ERROR_RESET_MS = 600;

interface ParentPinEntryProps {
  onSuccess: () => void;
  onCancel: () => void;
  /** Takes the raw 4-digit PIN string and returns whether it matches. */
  verifyPin: (pin: string) => Promise<boolean>;
}

type EntryStatus = "idle" | "verifying" | "error" | "success";

export function ParentPinEntry({
  onSuccess,
  onCancel,
  verifyPin,
}: ParentPinEntryProps): JSX.Element {
  const [digits, setDigits] = useState<string[]>([]);
  const [status, setStatus] = useState<EntryStatus>("idle");

  const statusRef = useRef<EntryStatus>("idle");

  const isDisabled =
    statusRef.current === "verifying" ||
    statusRef.current === "success" ||
    statusRef.current === "error";

  const handleDigit = useCallback(
    (digit: string) => {
      if (statusRef.current !== "idle") return;

      setDigits((prev) => {
        const newDigits = [...prev, digit];

        if (newDigits.length === PIN_LENGTH) {
          statusRef.current = "verifying";
          setStatus("verifying");

          const pin = newDigits.join("");
          verifyPin(pin).then((correct) => {
            if (correct) {
              statusRef.current = "success";
              setStatus("success");
              setTimeout(() => {
                onSuccess();
              }, SUCCESS_DELAY_MS);
            } else {
              statusRef.current = "error";
              setStatus("error");
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
    [verifyPin, onSuccess]
  );

  const handleBackspace = useCallback(() => {
    if (statusRef.current !== "idle") return;
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const statusMessage =
    status === "error" ? "Wrong PIN, try again" : "Enter parent PIN";

  const dotsStatus: "idle" | "error" | "success" =
    status === "success" ? "success" : status === "error" ? "error" : "idle";

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Parent PIN entry">
      <div className={styles.panel}>
        <h2 className={styles.heading}>Parent Access</h2>

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
          aria-label="Cancel parent PIN entry"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
