import styles from "./NumPad.module.css";

interface NumPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function NumPad({ onDigit, onBackspace, disabled = false }: NumPadProps): JSX.Element {
  return (
    <div className={styles.numpad} aria-label="Number pad">
      {DIGITS.map((digit) => (
        <button
          key={digit}
          aria-label={`Digit ${digit}`}
          className={styles.digitButton}
          disabled={disabled}
          onClick={() => onDigit(digit)}
        >
          {digit}
        </button>
      ))}
      {/* Bottom row: empty placeholder, 0, backspace */}
      <span className={styles.empty} aria-hidden="true" />
      <button
        aria-label="Digit 0"
        className={styles.digitButton}
        disabled={disabled}
        onClick={() => onDigit("0")}
      >
        0
      </button>
      <button
        aria-label="Backspace"
        className={styles.backspaceButton}
        disabled={disabled}
        onClick={onBackspace}
      >
        &#9003;
      </button>
    </div>
  );
}
