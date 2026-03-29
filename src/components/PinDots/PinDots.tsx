import styles from "./PinDots.module.css";

interface PinDotsProps {
  length: number;
  status?: "idle" | "error" | "success";
}

const TOTAL_DOTS = 4;

export function PinDots({ length, status = "idle" }: PinDotsProps): JSX.Element {
  const containerClass = [
    styles.pinDots,
    status === "error" ? styles.pinDotsError : "",
    status === "success" ? styles.pinDotsSuccess : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      data-testid="pin-dots"
      data-status={status}
      className={containerClass}
      aria-live="polite"
    >
      {Array.from({ length: TOTAL_DOTS }, (_, i) => {
        const filled = i < length;
        return (
          <span
            key={i}
            data-testid="pin-dot"
            data-filled={filled ? "true" : "false"}
            className={filled ? styles.dotFilled : styles.dotEmpty}
          />
        );
      })}
    </div>
  );
}
