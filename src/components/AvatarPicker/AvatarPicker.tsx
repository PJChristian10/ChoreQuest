import { AVATAR_OPTIONS, type AvatarKey } from "../../utils/avatarUtils.js";
import styles from "./AvatarPicker.module.css";

interface AvatarPickerProps {
  selected: AvatarKey | null;
  onSelect: (key: AvatarKey) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps): JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label="Choose your avatar"
      className={styles.avatarGrid}
    >
      {AVATAR_OPTIONS.map(({ key, emoji }) => (
        <button
          key={key}
          role="radio"
          aria-label={`${emoji} ${key}`}
          aria-checked={selected === key}
          className={[
            styles.avatarButton,
            selected === key ? styles.avatarSelected : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ minWidth: "60px", minHeight: "60px" }}
          onClick={() => onSelect(key)}
        >
          <span className={styles.avatarEmoji}>{emoji}</span>
        </button>
      ))}
    </div>
  );
}
