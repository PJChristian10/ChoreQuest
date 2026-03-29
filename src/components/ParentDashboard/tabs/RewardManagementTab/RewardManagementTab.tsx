import { useState } from "react";
import { useGameState, useGameDispatch } from "../../../../state/GameContext.js";
import { isSessionActive } from "../../../../services/authService.js";
import type { GameAction } from "../../../../state/types.js";
import type { Reward, RewardCategory } from "../../../../models/reward.js";
import { RewardTemplateSelector } from "../../../RewardTemplateSelector/RewardTemplateSelector.js";
import { REWARD_TEMPLATES } from "../../../../data/templates.js";
import { instantiateSelectedRewards } from "../../../../services/templateService.js";
import styles from "./RewardManagementTab.module.css";

interface RewardManagementTabProps {
  onSessionExpired: () => void;
}

interface RewardFormState {
  title: string;
  icon: string;
  coinCost: string;
  stock: string;
  expiryDate: string;
  category: string;
}

const defaultFormState: RewardFormState = {
  title: "",
  icon: "🎁",
  coinCost: "50",
  stock: "",
  expiryDate: "",
  category: "privileges",
};

export function RewardManagementTab({ onSessionExpired }: RewardManagementTabProps): JSX.Element {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RewardFormState>(defaultFormState);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  function guardedDispatch(action: GameAction) {
    if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) {
      onSessionExpired();
      return;
    }
    dispatch(action);
  }

  function handleFormChange(field: keyof RewardFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.title.trim()) return;

    const stockValue = form.stock.trim() === "" ? -1 : parseInt(form.stock, 10);
    const expiresAt = form.expiryDate ? new Date(form.expiryDate) : undefined;

    const newReward: Reward = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      icon: form.icon || "🎁",
      description: "",
      coinCost: parseInt(form.coinCost, 10) || 0,
      stock: isNaN(stockValue) ? -1 : stockValue,
      isActive: true,
      category: (form.category as RewardCategory) || "privileges",
      ...(expiresAt !== undefined && { expiresAt }),
    };

    guardedDispatch({ type: "ADD_REWARD", reward: newReward });
    setForm(defaultFormState);
    setShowForm(false);
  }

  function handleOpenTemplates() {
    const existingTitles = new Set(state.rewards.map((r) => r.title));
    const preSelected = new Set(
      REWARD_TEMPLATES.filter((t) => existingTitles.has(t.title)).map((t) => t.id)
    );
    setSelectedTemplateIds(preSelected);
    setShowTemplates(true);
  }

  function handleToggleTemplateReward(id: string) {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAllTemplateRewards() {
    setSelectedTemplateIds(new Set(REWARD_TEMPLATES.map((t) => t.id)));
  }

  function handleClearAllTemplateRewards() {
    setSelectedTemplateIds(new Set());
  }

  function handleAddTemplates() {
    const existingTitles = new Set(state.rewards.map((r) => r.title));
    const newIds = new Set(
      [...selectedTemplateIds].filter((id) => {
        const template = REWARD_TEMPLATES.find((t) => t.id === id);
        return template !== undefined && !existingTitles.has(template.title);
      })
    );
    if (newIds.size > 0) {
      const rewards = instantiateSelectedRewards(newIds, new Date());
      guardedDispatch({ type: "ADD_REWARDS_BATCH", payload: { rewards } });
    }
    setShowTemplates(false);
    setSelectedTemplateIds(new Set());
  }

  function handleCancelTemplates() {
    setShowTemplates(false);
    setSelectedTemplateIds(new Set());
  }

  function handleDelete(rewardId: string) {
    guardedDispatch({ type: "DELETE_REWARD", rewardId });
  }

  function handleFulfill(redemptionId: string) {
    guardedDispatch({
      type: "FULFILL_REDEMPTION",
      redemptionId,
      now: new Date(),
    });
  }

  const pendingRedemptions = state.redemptions.filter((r) => r.status === "pending");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Reward Management</h2>
        {!showForm && (
          <div className={styles.headerButtons}>
            <button
              aria-label="Browse Templates"
              className={styles.browseButton}
              onClick={handleOpenTemplates}
            >
              Browse Templates
            </button>
            <button
              aria-label="Add New Reward"
              className={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              Add New Reward
            </button>
          </div>
        )}
      </div>

      {/* Browse Templates modal */}
      {showTemplates && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Browse Reward Templates"
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) handleCancelTemplates(); }}
        >
          <div className={styles.modalContent}>
            <p className={styles.formTitle}>Browse Reward Templates</p>
            <RewardTemplateSelector
              templates={REWARD_TEMPLATES}
              selectedIds={selectedTemplateIds}
              onToggle={handleToggleTemplateReward}
              onSelectAll={handleSelectAllTemplateRewards}
              onClearAll={handleClearAllTemplateRewards}
            />
            <div className={styles.formActions}>
              <button
                aria-label="Add Selected rewards"
                className={styles.saveButton}
                onClick={handleAddTemplates}
              >
                Add Selected
              </button>
              <button
                aria-label="Cancel template browser"
                className={styles.cancelButton}
                onClick={handleCancelTemplates}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className={styles.form} role="form" aria-label="Add reward form">
          <p className={styles.formTitle}>New Reward</p>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="reward-title">
              Title
            </label>
            <input
              id="reward-title"
              aria-label="Reward title"
              className={styles.input}
              type="text"
              value={form.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              placeholder="Reward title"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="reward-icon">
              Icon
            </label>
            <input
              id="reward-icon"
              aria-label="Reward icon"
              className={styles.input}
              type="text"
              value={form.icon}
              onChange={(e) => handleFormChange("icon", e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="reward-cost">
                Coin Cost
              </label>
              <input
                id="reward-cost"
                aria-label="Coin cost"
                className={styles.input}
                type="number"
                min="0"
                value={form.coinCost}
                onChange={(e) => handleFormChange("coinCost", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="reward-stock">
                Stock
              </label>
              <input
                id="reward-stock"
                aria-label="Stock quantity"
                className={styles.input}
                type="number"
                min="-1"
                value={form.stock}
                onChange={(e) => handleFormChange("stock", e.target.value)}
                placeholder="Unlimited if empty"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="reward-expiry">
              Expiry Date
            </label>
            <input
              id="reward-expiry"
              aria-label="Expiry date"
              className={styles.input}
              type="date"
              value={form.expiryDate}
              onChange={(e) => handleFormChange("expiryDate", e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="reward-category">
              Category
            </label>
            <input
              id="reward-category"
              aria-label="Category"
              className={styles.input}
              type="text"
              value={form.category}
              onChange={(e) => handleFormChange("category", e.target.value)}
            />
          </div>

          <div className={styles.formActions}>
            <button
              aria-label="Save reward"
              className={styles.saveButton}
              disabled={!form.title.trim()}
              onClick={handleSave}
            >
              Save Reward
            </button>
            <button
              aria-label="Cancel reward form"
              className={styles.cancelButton}
              onClick={() => {
                setForm(defaultFormState);
                setShowForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className={styles.rewardList}>
        {state.rewards.map((reward) => (
          <li key={reward.id} className={styles.rewardRow}>
            <div className={styles.rewardInfo}>
              <span className={styles.rewardTitle}>
                <span aria-hidden="true">{reward.icon}</span>{" "}
                <span>{reward.title}</span>
              </span>
              <span className={styles.rewardMeta}>
                {reward.coinCost} coins &bull; Stock:{" "}
                {reward.stock === -1 ? "Unlimited" : reward.stock}
              </span>
            </div>

            <div className={styles.rewardActions}>
              <button
                aria-label={`Delete ${reward.title}`}
                className={styles.deleteButton}
                onClick={() => handleDelete(reward.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {pendingRedemptions.length > 0 && (
        <>
          <h3 className={styles.sectionHeading}>Pending Fulfillments</h3>
          <ul className={styles.fulfillmentList}>
            {pendingRedemptions.map((redemption) => {
              const reward = state.rewards.find((r) => r.id === redemption.rewardId);
              const player = state.players.find((p) => p.id === redemption.playerId);
              if (reward === undefined || player === undefined) return null;
              return (
                <li key={redemption.id} className={styles.fulfillmentItem}>
                  <span className={styles.fulfillmentInfo}>
                    {player.name} — {reward.title}
                  </span>
                  <button
                    aria-label={`Mark ${reward.title} for ${player.name} fulfilled`}
                    className={styles.fulfillButton}
                    onClick={() => handleFulfill(redemption.id)}
                  >
                    Mark Fulfilled
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
