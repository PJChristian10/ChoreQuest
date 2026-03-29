import { useState, useCallback } from "react";
import type { Player } from "../../models/player.js";
import type { AvatarKey } from "../../utils/avatarUtils.js";
import { hashPin } from "../../services/authService.js";
import { AvatarPicker } from "../AvatarPicker/AvatarPicker.js";
import { NumPad } from "../NumPad/NumPad.js";
import { PinDots } from "../PinDots/PinDots.js";
import styles from "./AddPlayerForm.module.css";

interface AddPlayerFormProps {
  readonly onAdd: (player: Player) => void;
  readonly onCancel?: () => void;
}

const PIN_LENGTH = 4;

export function AddPlayerForm({ onAdd, onCancel }: AddPlayerFormProps): JSX.Element {
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey | null>(null);
  const [playerPinDigits, setPlayerPinDigits] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;
    setIsAdding(true);

    let playerPin: string | undefined;
    if (playerPinDigits.length === PIN_LENGTH) {
      playerPin = await hashPin(playerPinDigits.join(""));
    }

    const player: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      xp: 0,
      lifetimeXP: 0,
      coins: 0,
      lifetimeCoins: 0,
      weeklyCoins: 0,
      level: 1,
      streak: 0,
      badges: [],
      ...(selectedAvatar !== null ? { avatar: selectedAvatar } : {}),
      ...(playerPin !== undefined ? { playerPin } : {}),
    };

    onAdd(player);
    setName("");
    setSelectedAvatar(null);
    setPlayerPinDigits([]);
    setIsAdding(false);
  }, [name, selectedAvatar, playerPinDigits, onAdd]);

  const handlePlayerPinDigit = useCallback((digit: string) => {
    setPlayerPinDigits((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      return [...prev, digit];
    });
  }, []);

  const handlePlayerPinBackspace = useCallback(() => {
    setPlayerPinDigits((prev) => prev.slice(0, -1));
  }, []);

  return (
    <div className={styles.form}>
      <div className={styles.formGroup}>
        <input
          type="text"
          aria-label="Player name"
          placeholder="Player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.textInput}
        />
      </div>

      <AvatarPicker selected={selectedAvatar} onSelect={setSelectedAvatar} />

      <details className={styles.optionalPin}>
        <summary className={styles.optionalPinSummary}>
          Set optional PIN for this player
        </summary>
        <PinDots length={playerPinDigits.length} />
        <NumPad
          onDigit={handlePlayerPinDigit}
          onBackspace={handlePlayerPinBackspace}
          disabled={playerPinDigits.length >= PIN_LENGTH}
        />
      </details>

      <div className={styles.actions}>
        <button
          aria-label="Add Player"
          className={styles.addButton}
          disabled={!name.trim() || isAdding}
          onClick={handleSubmit}
        >
          {isAdding ? "Adding..." : "Add Player"}
        </button>
        {onCancel !== undefined && (
          <button
            aria-label="Cancel add player"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
