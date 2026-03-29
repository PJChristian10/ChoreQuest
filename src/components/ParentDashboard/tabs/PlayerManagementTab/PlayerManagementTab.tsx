import { useState } from "react";
import { useGameState, useGameDispatch } from "../../../../state/GameContext.js";
import { isSessionActive } from "../../../../services/authService.js";
import type { GameAction } from "../../../../state/types.js";
import type { Player } from "../../../../models/player.js";
import { getAvatarEmoji } from "../../../../utils/avatarUtils.js";
import type { AvatarKey } from "../../../../utils/avatarUtils.js";
import { AvatarPicker } from "../../../AvatarPicker/AvatarPicker.js";
import { AddPlayerForm } from "../../../AddPlayerForm/AddPlayerForm.js";
import styles from "./PlayerManagementTab.module.css";

interface PlayerManagementTabProps {
  onSessionExpired: () => void;
}

interface EditState {
  playerId: string;
  name: string;
  avatar: AvatarKey | null;
  coinAdjustment: string;
  adjustmentReason: string;
}

export function PlayerManagementTab({ onSessionExpired }: PlayerManagementTabProps): JSX.Element {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  function guardedDispatch(action: GameAction) {
    if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) {
      onSessionExpired();
      return;
    }
    dispatch(action);
  }

  function handleEdit(player: Player) {
    setEditState({
      playerId: player.id,
      name: player.name,
      avatar: (player.avatar as AvatarKey) ?? null,
      coinAdjustment: "0",
      adjustmentReason: "",
    });
  }

  function handleDeletePlayer(playerId: string) {
    guardedDispatch({ type: "DELETE_PLAYER", playerId });
    setConfirmDeleteId(null);
    setEditState(null);
  }

  function handleSavePlayer() {
    if (editState === null) return;
    const player = state.players.find((p) => p.id === editState.playerId);
    if (player === undefined) return;

    const updatedPlayer: Player = {
      ...player,
      name: editState.name,
      ...(editState.avatar !== null && { avatar: editState.avatar }),
    };

    guardedDispatch({ type: "UPDATE_PLAYER", player: updatedPlayer });
    setEditState(null);
  }

  function handleAddNewPlayer(player: Player) {
    guardedDispatch({ type: "ADD_PLAYER", player });
    setShowAddForm(false);
  }

  function handleApplyCoinAdjustment() {
    if (editState === null) return;
    const player = state.players.find((p) => p.id === editState.playerId);
    if (player === undefined) return;

    const adjustment = parseInt(editState.coinAdjustment, 10) || 0;
    const newCoins = Math.max(0, player.coins + adjustment);

    const updatedPlayer: Player = {
      ...player,
      coins: newCoins,
    };

    guardedDispatch({ type: "UPDATE_PLAYER", player: updatedPlayer });
    setEditState((prev) =>
      prev !== null ? { ...prev, coinAdjustment: "0", adjustmentReason: "" } : null
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Player Management</h2>
        {!showAddForm && (
          <button
            aria-label="Add new player"
            className={styles.addPlayerButton}
            onClick={() => setShowAddForm(true)}
          >
            + Add Player
          </button>
        )}
      </div>

      {showAddForm && (
        <div className={styles.addFormWrapper}>
          <h3 className={styles.addFormHeading}>New Player</h3>
          <AddPlayerForm
            onAdd={handleAddNewPlayer}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {state.players.length === 0 && !showAddForm && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>No players yet.</p>
          <button
            aria-label="Add first player"
            className={styles.addPlayerButton}
            onClick={() => setShowAddForm(true)}
          >
            Add Your First Player
          </button>
        </div>
      )}

      <div className={styles.playerGrid}>
        {state.players.map((player) => {
          const isEditing = editState?.playerId === player.id;

          return (
            <div key={player.id} className={styles.playerCard}>
              <div className={styles.cardHeader}>
                <span className={styles.avatar}>
                  {getAvatarEmoji(player.avatar ?? "")}
                </span>
                <span className={styles.playerName}>{player.name}</span>
                <div className={styles.cardActions}>
                  <button
                    aria-label={`Edit ${player.name}`}
                    className={styles.editButton}
                    onClick={() => (isEditing ? setEditState(null) : handleEdit(player))}
                  >
                    {isEditing ? "Close" : "Edit"}
                  </button>
                  <button
                    aria-label={`Delete ${player.name}`}
                    className={styles.deleteButton}
                    onClick={() => setConfirmDeleteId(player.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {confirmDeleteId === player.id && (
                <div className={styles.confirmDelete} role="alert">
                  <p>Delete <strong>{player.name}</strong>? This cannot be undone.</p>
                  <div className={styles.confirmActions}>
                    <button
                      aria-label={`Confirm delete ${player.name}`}
                      className={styles.confirmDeleteButton}
                      onClick={() => handleDeletePlayer(player.id)}
                    >
                      Yes, Delete
                    </button>
                    <button
                      aria-label="Cancel delete"
                      className={styles.cancelButton}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.stats}>
                <span className={styles.statBadge}>Level {player.level}</span>
                <span className={styles.statBadge}>{player.xp} XP</span>
                <span className={styles.statBadge}>{player.lifetimeXP} lifetime XP</span>
                <span className={styles.statBadge}>{player.coins} coins</span>
                <span className={styles.statBadge}>{player.lifetimeCoins} lifetime coins</span>
                <span className={styles.statBadge}>{player.streak} streak</span>
                {player.longestStreak !== undefined && (
                  <span className={styles.statBadge}>
                    {player.longestStreak} longest streak
                  </span>
                )}
              </div>

              {isEditing && editState !== null && (
                <div className={styles.editForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor={`player-name-${player.id}`}>
                      Name
                    </label>
                    <input
                      id={`player-name-${player.id}`}
                      aria-label="Player name"
                      className={styles.input}
                      type="text"
                      value={editState.name}
                      onChange={(e) =>
                        setEditState((prev) =>
                          prev !== null ? { ...prev, name: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <span className={styles.label}>Avatar</span>
                    <AvatarPicker
                      selected={editState.avatar}
                      onSelect={(key) =>
                        setEditState((prev) =>
                          prev !== null ? { ...prev, avatar: key } : null
                        )
                      }
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      aria-label="Save player"
                      className={styles.saveButton}
                      onClick={handleSavePlayer}
                    >
                      Save
                    </button>
                    <button
                      aria-label={`Cancel edit ${player.name}`}
                      className={styles.cancelButton}
                      onClick={() => setEditState(null)}
                    >
                      Cancel
                    </button>
                  </div>

                  <hr className={styles.divider} />
                  <span className={styles.sectionLabel}>Coin Adjustment</span>

                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor={`coin-adj-${player.id}`}>
                      Coins to add (negative to deduct)
                    </label>
                    <input
                      id={`coin-adj-${player.id}`}
                      aria-label="Coin adjustment"
                      className={styles.input}
                      type="number"
                      value={editState.coinAdjustment}
                      onChange={(e) =>
                        setEditState((prev) =>
                          prev !== null ? { ...prev, coinAdjustment: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor={`adj-reason-${player.id}`}>
                      Reason
                    </label>
                    <input
                      id={`adj-reason-${player.id}`}
                      aria-label="Adjustment reason"
                      className={styles.input}
                      type="text"
                      value={editState.adjustmentReason}
                      onChange={(e) =>
                        setEditState((prev) =>
                          prev !== null
                            ? { ...prev, adjustmentReason: e.target.value }
                            : null
                        )
                      }
                    />
                  </div>

                  <button
                    aria-label="Apply coin adjustment"
                    className={styles.applyButton}
                    onClick={handleApplyCoinAdjustment}
                  >
                    Apply Adjustment
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
