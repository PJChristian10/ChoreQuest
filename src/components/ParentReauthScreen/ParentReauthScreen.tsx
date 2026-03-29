import { useState, useRef, useCallback } from "react";
import { PinDots } from "../PinDots/PinDots.js";
import { NumPad } from "../NumPad/NumPad.js";

const PIN_LENGTH = 4;
const SUCCESS_DELAY_MS = 500;
const ERROR_RESET_MS = 600;

interface ParentReauthScreenProps {
  onSuccess: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
}

type ScreenStatus = "idle" | "verifying" | "error" | "success";

export function ParentReauthScreen({
  onSuccess,
  verifyPin,
}: ParentReauthScreenProps): JSX.Element {
  const [digits, setDigits] = useState<string[]>([]);
  const [status, setStatus] = useState<ScreenStatus>("idle");
  const statusRef = useRef<ScreenStatus>("idle");

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
    status === "error" ? "Wrong PIN, try again" : "Enter parent PIN to continue setup";

  const dotsStatus: "idle" | "error" | "success" =
    status === "success" ? "success" : status === "error" ? "error" : "idle";

  return (
    <div role="main">
      <h1 role="heading">Parent authentication required</h1>
      <p>{statusMessage}</p>
      <PinDots length={digits.length} status={dotsStatus} />
      <NumPad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        disabled={isDisabled}
      />
    </div>
  );
}
