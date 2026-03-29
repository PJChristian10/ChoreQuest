import { useState } from "react";
import { useGameState, useGameDispatch } from "../../../../state/GameContext.js";
import { isSessionActive } from "../../../../services/authService.js";
import type { GameAction } from "../../../../state/types.js";
import type { Quest, QuestDifficulty, QuestRecurrence, QuestCategory } from "../../../../models/quest.js";
import { getQuestArt } from "../../../../utils/questArtUtils.js";
import { ArtPicker } from "../../../ArtPicker/ArtPicker.js";
import { QuestTemplateSelector } from "../../../QuestTemplateSelector/QuestTemplateSelector.js";
import { QUEST_TEMPLATES } from "../../../../data/templates.js";
import { instantiateSelectedQuests } from "../../../../services/templateService.js";
import styles from "./QuestManagementTab.module.css";

interface QuestManagementTabProps {
  onSessionExpired: () => void;
}

interface QuestFormState {
  title: string;
  icon: string;
  artKey: string;
  xpReward: string;
  coinReward: string;
  difficulty: string;
  recurrence: string;
  category: string;
}

const DIFFICULTY_STARS: Record<string, string> = {
  "1": "⭐",
  "2": "⭐⭐",
  "3": "⭐⭐⭐",
};

const STAR_ICONS = new Set(Object.values(DIFFICULTY_STARS));

const defaultFormState: QuestFormState = {
  title: "",
  icon: "⭐",
  artKey: "dishes",
  xpReward: "10",
  coinReward: "5",
  difficulty: "1",
  recurrence: "daily",
  category: "kitchen",
};

export function QuestManagementTab({ onSessionExpired }: QuestManagementTabProps): JSX.Element {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<QuestFormState>(defaultFormState);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [artKeyLocked, setArtKeyLocked] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  function guardedDispatch(action: GameAction) {
    if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) {
      onSessionExpired();
      return;
    }
    dispatch(action);
  }

  function handleFormChange(field: keyof QuestFormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // When difficulty changes, auto-update icon if it's currently a star pattern
      if (field === "difficulty" && STAR_ICONS.has(prev.icon)) {
        next.icon = DIFFICULTY_STARS[value] ?? "⭐";
      }
      // Auto-suggest artKey from title/category changes (unless parent locked it manually)
      if ((field === "title" || field === "category") && !artKeyLocked) {
        const cat = (field === "category" ? value : prev.category) as QuestCategory;
        const titleVal = field === "title" ? value : prev.title;
        next.artKey = getQuestArt(titleVal, cat).artKey;
      }
      return next;
    });
  }

  function handleArtPick(artKey: string) {
    setForm((prev) => ({ ...prev, artKey }));
    setArtKeyLocked(true);
  }

  function handleEdit(quest: Quest) {
    const diffKey = String(quest.difficulty);
    const currentIcon = quest.icon ?? "⭐";
    // Migrate old single-star icons to the correct star count for the difficulty
    const icon = STAR_ICONS.has(currentIcon)
      ? (DIFFICULTY_STARS[diffKey] ?? currentIcon)
      : currentIcon;
    const category = quest.category ?? "kitchen";
    setForm({
      title: quest.title,
      icon,
      artKey: quest.artKey || getQuestArt(quest.title, category).artKey,
      xpReward: String(quest.xpReward),
      coinReward: String(quest.coinReward),
      difficulty: diffKey,
      recurrence: quest.recurrence,
      category,
    });
    setArtKeyLocked(false);
    setEditingQuestId(quest.id);
    setShowForm(true);
  }

  function handleCancelForm() {
    setForm(defaultFormState);
    setArtKeyLocked(false);
    setEditingQuestId(null);
    setShowForm(false);
  }

  function handleSave() {
    if (!form.title.trim()) return;

    if (editingQuestId !== null) {
      const existing = state.quests.find((q) => q.id === editingQuestId);
      if (existing === undefined) return;
      guardedDispatch({
        type: "UPDATE_QUEST",
        quest: {
          ...existing,
          title: form.title.trim(),
          icon: form.icon || "⭐",
          artKey: form.artKey,
          xpReward: parseInt(form.xpReward, 10) || 0,
          coinReward: parseInt(form.coinReward, 10) || 0,
          difficulty: (parseInt(form.difficulty, 10) as QuestDifficulty) || 1,
          recurrence: (form.recurrence as QuestRecurrence) || "daily",
          category: form.category as QuestCategory,
        },
      });
    } else {
      const newQuest: Quest = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        icon: form.icon || "⭐",
        artKey: form.artKey,
        description: "",
        xpReward: parseInt(form.xpReward, 10) || 0,
        coinReward: parseInt(form.coinReward, 10) || 0,
        difficulty: (parseInt(form.difficulty, 10) as QuestDifficulty) || 1,
        recurrence: (form.recurrence as QuestRecurrence) || "daily",
        category: form.category as QuestCategory,
        isActive: true,
        createdBy: "parent",
        createdAt: new Date(),
      };
      guardedDispatch({ type: "ADD_QUEST", quest: newQuest });
    }

    setForm(defaultFormState);
    setEditingQuestId(null);
    setShowForm(false);
  }

  function handleOpenTemplates() {
    const existingTitles = new Set(state.quests.map((q) => q.title));
    const preSelected = new Set(
      QUEST_TEMPLATES.filter((t) => existingTitles.has(t.title)).map((t) => t.id)
    );
    setSelectedTemplateIds(preSelected);
    setShowTemplates(true);
  }

  function handleToggleTemplateQuest(id: string) {
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

  function handleSelectAllTemplateQuests() {
    setSelectedTemplateIds(new Set(QUEST_TEMPLATES.map((t) => t.id)));
  }

  function handleClearAllTemplateQuests() {
    setSelectedTemplateIds(new Set());
  }

  function handleAddTemplates() {
    const existingTitles = new Set(state.quests.map((q) => q.title));
    const newIds = new Set(
      [...selectedTemplateIds].filter((id) => {
        const template = QUEST_TEMPLATES.find((t) => t.id === id);
        return template !== undefined && !existingTitles.has(template.title);
      })
    );
    if (newIds.size > 0) {
      const quests = instantiateSelectedQuests(newIds, "parent", new Date());
      guardedDispatch({ type: "ADD_QUESTS_BATCH", payload: { quests } });
    }
    setShowTemplates(false);
    setSelectedTemplateIds(new Set());
  }

  function handleCancelTemplates() {
    setShowTemplates(false);
    setSelectedTemplateIds(new Set());
  }

  function handleToggleActive(quest: Quest) {
    guardedDispatch({
      type: "UPDATE_QUEST",
      quest: { ...quest, isActive: !quest.isActive },
    });
  }

  function handleDelete(questId: string) {
    guardedDispatch({ type: "DELETE_QUEST", questId });
  }

  // Shared form fields used by both inline (Add) and modal (Edit)
  const formFields = (
    <>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="quest-title">Title</label>
        <input
          id="quest-title"
          aria-label="Quest title"
          className={styles.input}
          type="text"
          value={form.title}
          onChange={(e) => handleFormChange("title", e.target.value)}
          placeholder="Quest title"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="quest-icon">Icon</label>
        <input
          id="quest-icon"
          aria-label="Quest icon"
          className={styles.input}
          type="text"
          value={form.icon}
          onChange={(e) => handleFormChange("icon", e.target.value)}
          placeholder="Emoji icon"
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="quest-xp">XP Reward</label>
          <input
            id="quest-xp"
            aria-label="XP reward"
            className={styles.input}
            type="number"
            min="0"
            value={form.xpReward}
            onChange={(e) => handleFormChange("xpReward", e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="quest-coins">Coin Reward</label>
          <input
            id="quest-coins"
            aria-label="Coin reward"
            className={styles.input}
            type="number"
            min="0"
            value={form.coinReward}
            onChange={(e) => handleFormChange("coinReward", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="quest-difficulty">Difficulty</label>
          <select
            id="quest-difficulty"
            aria-label="Difficulty"
            className={styles.select}
            value={form.difficulty}
            onChange={(e) => handleFormChange("difficulty", e.target.value)}
          >
            <option value="1">⭐ Easy</option>
            <option value="2">⭐⭐ Medium</option>
            <option value="3">⭐⭐⭐ Hard</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="quest-recurrence">Recurrence</label>
          <select
            id="quest-recurrence"
            aria-label="Recurrence"
            className={styles.select}
            value={form.recurrence}
            onChange={(e) => handleFormChange("recurrence", e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="one-time">One-time</option>
            <option value="bonus">Bonus</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="quest-category">Category</label>
        <select
          id="quest-category"
          aria-label="Category"
          className={styles.select}
          value={form.category}
          onChange={(e) => handleFormChange("category", e.target.value)}
        >
          <option value="kitchen">Kitchen</option>
          <option value="cleaning">Cleaning</option>
          <option value="pets">Pets</option>
          <option value="school">School</option>
          <option value="garden">Garden</option>
          <option value="home">Home</option>
          <option value="bonus">Bonus</option>
        </select>
      </div>

      <ArtPicker
        category={form.category as QuestCategory}
        selectedKey={form.artKey}
        onChange={handleArtPick}
      />
    </>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Quest Management</h2>
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
              aria-label="Add New Quest"
              className={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              + Add New Quest
            </button>
          </div>
        )}
      </div>

      {/* Inline Add form (only shown when adding, not editing) */}
      {showForm && editingQuestId === null && (
        <div className={styles.form} role="form" aria-label="Add quest form">
          <p className={styles.formTitle}>New Quest</p>
          {formFields}
          <div className={styles.formActions}>
            <button
              aria-label="Save quest"
              className={styles.saveButton}
              disabled={!form.title.trim()}
              onClick={handleSave}
            >
              Save Quest
            </button>
            <button
              aria-label="Cancel quest form"
              className={styles.cancelButton}
              onClick={handleCancelForm}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Browse Templates modal */}
      {showTemplates && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Browse Quest Templates"
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) handleCancelTemplates(); }}
        >
          <div className={styles.modalContent}>
            <p className={styles.formTitle}>Browse Quest Templates</p>
            <QuestTemplateSelector
              templates={QUEST_TEMPLATES}
              selectedIds={selectedTemplateIds}
              onToggle={handleToggleTemplateQuest}
              onSelectAll={handleSelectAllTemplateQuests}
              onClearAll={handleClearAllTemplateQuests}
              minSelection={0}
            />
            <div className={styles.formActions}>
              <button
                aria-label="Add Selected quests"
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

      {/* Edit modal — floats over the list, no scrolling needed */}
      {editingQuestId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit quest"
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) handleCancelForm(); }}
        >
          <div className={styles.modalContent}>
            <p className={styles.formTitle}>Edit Quest</p>
            {formFields}
            <div className={styles.formActions}>
              <button
                aria-label="Save quest"
                className={styles.saveButton}
                disabled={!form.title.trim()}
                onClick={handleSave}
              >
                Save Quest
              </button>
              <button
                aria-label="Cancel quest form"
                className={styles.cancelButton}
                onClick={handleCancelForm}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ul className={styles.questList}>
        {state.quests.map((quest) => (
          <li key={quest.id} className={styles.questRow}>
            <div className={styles.questInfo}>
              <span className={styles.questTitle}>
                <span aria-hidden="true">{quest.icon}</span>{" "}
                <span>{quest.title}</span>
              </span>
              <span className={styles.questMeta}>
                {quest.recurrence} &bull; Difficulty {quest.difficulty}
              </span>
            </div>

            <div className={styles.questActions}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  role="checkbox"
                  aria-label={`Toggle ${quest.title} active`}
                  checked={quest.isActive ?? true}
                  onChange={() => handleToggleActive(quest)}
                />
                Active
              </label>

              <button
                aria-label={`Edit ${quest.title}`}
                className={styles.editButton}
                onClick={() => handleEdit(quest)}
              >
                Edit
              </button>

              <button
                aria-label={`Delete ${quest.title}`}
                className={styles.deleteButton}
                onClick={() => handleDelete(quest.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
