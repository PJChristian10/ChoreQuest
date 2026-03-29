import { useState, useCallback, useRef } from "react";
import { useGameDispatch } from "../../state/GameContext.js";
import { TitleBanner } from "../TitleBanner/TitleBanner.js";
import { hashPin } from "../../services/authService.js";
import { NumPad } from "../NumPad/NumPad.js";
import { PinDots } from "../PinDots/PinDots.js";
import { AddPlayerForm } from "../AddPlayerForm/AddPlayerForm.js";
import { QuestTemplateSelector } from "../QuestTemplateSelector/QuestTemplateSelector.js";
import { RewardTemplateSelector } from "../RewardTemplateSelector/RewardTemplateSelector.js";
import type { Player } from "../../models/player.js";
import {
  QUEST_TEMPLATES,
  REWARD_TEMPLATES,
  DEFAULT_QUEST_IDS,
  DEFAULT_REWARD_IDS,
} from "../../data/templates.js";
import {
  instantiateSelectedQuests,
  instantiateSelectedRewards,
} from "../../services/templateService.js";
import styles from "./SetupWizard.module.css";

interface SetupWizardProps {
  onComplete: () => void;
  onParentPortal: () => void;
}

const PIN_LENGTH = 4;

// --- Step 2: Parent PIN ---

interface PinStepProps {
  onPinSet: (hashedPin: string) => void;
  onBack: () => void;
}

type PinSubStep = "enter" | "confirm";

function ParentPinStep({ onPinSet, onBack }: PinStepProps) {
  const [subStep, setSubStep] = useState<PinSubStep>("enter");
  const [firstPin, setFirstPin] = useState<string[]>([]);
  const [confirmPin, setConfirmPin] = useState<string[]>([]);
  const [displayLength, setDisplayLength] = useState(0);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  // Use refs to avoid stale closure in functional setState
  const subStepRef = useRef<PinSubStep>("enter");
  const firstPinRef = useRef<string[]>([]);
  const isHashingRef = useRef(false);

  const handleDigit = useCallback(
    (digit: string) => {
      if (isHashingRef.current) return;

      if (subStepRef.current === "enter") {
        setFirstPin((prev) => {
          const next = [...prev, digit];
          firstPinRef.current = next;
          setDisplayLength(next.length);
          if (next.length === PIN_LENGTH) {
            subStepRef.current = "confirm";
            setSubStep("confirm");
            setDisplayLength(0);
          }
          return next;
        });
      } else {
        setConfirmPin((prev) => {
          const next = [...prev, digit];
          setDisplayLength(next.length);
          if (next.length === PIN_LENGTH) {
            const entered = firstPinRef.current.join("");
            const confirmed = next.join("");
            if (entered !== confirmed) {
              setPinError("PINs don't match, try again");
              firstPinRef.current = [];
              subStepRef.current = "enter";
              setFirstPin([]);
              setSubStep("enter");
              setDisplayLength(0);
              return [];
            } else {
              isHashingRef.current = true;
              setIsHashing(true);
              hashPin(entered).then((hash) => {
                isHashingRef.current = false;
                setIsHashing(false);
                onPinSet(hash);
              });
              return next;
            }
          }
          return next;
        });
      }
    },
    [onPinSet]
  );

  const handleBackspace = useCallback(() => {
    if (isHashingRef.current) return;
    if (subStepRef.current === "enter") {
      setFirstPin((prev) => {
        const next = prev.slice(0, -1);
        firstPinRef.current = next;
        setDisplayLength(next.length);
        return next;
      });
    } else {
      setConfirmPin((prev) => {
        const next = prev.slice(0, -1);
        setDisplayLength(next.length);
        return next;
      });
    }
  }, []);

  const dotsStatus = pinError ? "error" : "idle";
  const promptText =
    subStep === "enter" ? "Enter a 4-digit PIN" : "Confirm your PIN";

  return (
    <div className={styles.step}>
      <h2 role="heading" className={styles.stepHeading}>
        Create Parent PIN
      </h2>
      <p className={styles.stepSubheading}>
        Secure your admin settings with a 4-digit PIN
      </p>

      {pinError && (
        <p className={styles.errorMessage} role="alert">
          {pinError}
        </p>
      )}

      <p className={styles.promptText}>{promptText}</p>
      <PinDots length={displayLength} status={dotsStatus} />
      <NumPad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        disabled={isHashing}
      />

      <button
        aria-label="Back to welcome"
        className={styles.backButton}
        onClick={onBack}
      >
        Back
      </button>
    </div>
  );
}

// --- Step 2b: Post-PIN Choice ---

interface PostPinChoiceStepProps {
  onGoToPortal: () => void;
  onSetupPlayers: () => void;
  onBack: () => void;
}

function PostPinChoiceStep({ onGoToPortal, onSetupPlayers, onBack }: PostPinChoiceStepProps) {
  return (
    <div className={styles.step}>
      <h2 role="heading" className={styles.stepHeading}>
        Parent PIN Set!
      </h2>
      <p className={styles.stepSubheading}>
        What would you like to do next?
      </p>

      <div className={styles.choiceGrid}>
        <button
          aria-label="Go to Parent Portal"
          className={styles.choiceCard}
          onClick={onGoToPortal}
        >
          <span className={styles.choiceIcon}>🏰</span>
          <span className={styles.choiceCardTitle}>Parent Portal</span>
          <span className={styles.choiceCardDesc}>
            Set up quests, rewards, and players from the dashboard
          </span>
        </button>

        <button
          aria-label="Set up player profiles"
          className={styles.choiceCard}
          onClick={onSetupPlayers}
        >
          <span className={styles.choiceIcon}>⚔️</span>
          <span className={styles.choiceCardTitle}>Add Players Now</span>
          <span className={styles.choiceCardDesc}>
            Walk through adding your heroes one by one
          </span>
        </button>
      </div>

      <button className={styles.backButton} onClick={onBack}>
        Back
      </button>
    </div>
  );
}

// --- Step 3: Add Players ---

interface AddPlayersStepProps {
  onNext: () => void;
  onBack: () => void;
}

function AddPlayersStep({ onNext, onBack }: AddPlayersStepProps) {
  const dispatch = useGameDispatch();
  const [addedNames, setAddedNames] = useState<string[]>([]);

  const handleAddPlayer = useCallback(
    (player: Player) => {
      dispatch({ type: "ADD_PLAYER", player });
      setAddedNames((prev) => [...prev, player.name]);
    },
    [dispatch]
  );

  return (
    <div className={styles.step}>
      <h2 role="heading" className={styles.stepHeading}>
        Add Players
      </h2>

      <AddPlayerForm onAdd={handleAddPlayer} />

      {addedNames.length > 0 && (
        <ul className={styles.addedPlayerList}>
          {addedNames.map((n) => (
            <li key={n} className={styles.addedPlayerItem}>
              {n}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.navRow}>
        <button className={styles.backButton} onClick={onBack}>
          Back
        </button>
        <button
          aria-label="Done adding players"
          className={styles.nextButton}
          disabled={addedNames.length === 0}
          onClick={onNext}
        >
          {addedNames.length === 0
            ? "Add at least one player"
            : `Continue with ${addedNames.length} player${addedNames.length > 1 ? "s" : ""} →`}
        </button>
      </div>
    </div>
  );
}

// --- Step 4: Select Quests ---

interface SelectQuestsStepProps {
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const MIN_QUEST_SELECTION = 3;

function SelectQuestsStep({
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  onNext,
  onSkip,
  onBack,
}: SelectQuestsStepProps) {
  return (
    <div className={styles.step}>
      <h2 role="heading" className={styles.stepHeading}>
        Choose Your Starting Quests
      </h2>
      <p className={styles.stepSubheading}>
        Pick the chores that fit your family. You can always add more later.
      </p>

      <QuestTemplateSelector
        templates={QUEST_TEMPLATES}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
        minSelection={MIN_QUEST_SELECTION}
      />

      <div className={styles.navRow}>
        <button className={styles.backButton} onClick={onBack}>
          Back
        </button>
        <button
          aria-label="Skip adding quests"
          className={styles.skipButton}
          onClick={onSkip}
        >
          Skip for now
        </button>
        <button
          aria-label="Next"
          className={styles.nextButton}
          disabled={selectedIds.size < MIN_QUEST_SELECTION}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// --- Step 5: Select Rewards ---

interface SelectRewardsStepProps {
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

function SelectRewardsStep({
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  onNext,
  onSkip,
  onBack,
}: SelectRewardsStepProps) {
  return (
    <div className={styles.step}>
      <h2 role="heading" className={styles.stepHeading}>
        Set Up Your Reward Shop
      </h2>
      <p className={styles.stepSubheading}>
        Give your kids something to work toward.
      </p>

      <RewardTemplateSelector
        templates={REWARD_TEMPLATES}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
      />

      <div className={styles.navRow}>
        <button className={styles.backButton} onClick={onBack}>
          Back
        </button>
        <button
          aria-label="Skip adding rewards"
          className={styles.skipButton}
          onClick={onSkip}
        >
          Skip for now
        </button>
        <button
          aria-label="Next"
          className={styles.nextButton}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// --- SetupWizard root ---

type WizardStep = "welcome" | "pin" | "choice" | "players" | "select-quests" | "select-rewards" | "done";

export function SetupWizard({ onComplete, onParentPortal }: SetupWizardProps): JSX.Element {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedQuestIds, setSelectedQuestIds] = useState<Set<string>>(
    () => new Set(DEFAULT_QUEST_IDS)
  );
  const [selectedRewardIds, setSelectedRewardIds] = useState<Set<string>>(
    () => new Set(DEFAULT_REWARD_IDS)
  );
  const dispatch = useGameDispatch();

  const handlePinSet = useCallback(
    (hashedPin: string) => {
      dispatch({
        type: "SET_PARENT_CONFIG",
        config: { hashedPin, failedAttempts: 0 },
      });
      setStep("choice");
    },
    [dispatch]
  );

  const handleToggleQuest = useCallback((id: string) => {
    setSelectedQuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllQuests = useCallback(() => {
    setSelectedQuestIds(new Set(QUEST_TEMPLATES.map((t) => t.id)));
  }, []);

  const handleClearAllQuests = useCallback(() => {
    setSelectedQuestIds(new Set());
  }, []);

  const handleToggleReward = useCallback((id: string) => {
    setSelectedRewardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllRewards = useCallback(() => {
    setSelectedRewardIds(new Set(REWARD_TEMPLATES.map((t) => t.id)));
  }, []);

  const handleClearAllRewards = useCallback(() => {
    setSelectedRewardIds(new Set());
  }, []);

  const handleSkipQuests = useCallback(() => {
    setSelectedQuestIds(new Set());
    setStep("select-rewards");
  }, []);

  const handleSkipRewards = useCallback(() => {
    setSelectedRewardIds(new Set());
    setStep("done");
  }, []);

  const handleComplete = useCallback(() => {
    const now = new Date();
    if (selectedQuestIds.size > 0) {
      const quests = instantiateSelectedQuests(selectedQuestIds, "parent", now);
      dispatch({ type: "ADD_QUESTS_BATCH", payload: { quests } });
    }
    if (selectedRewardIds.size > 0) {
      const rewards = instantiateSelectedRewards(selectedRewardIds, now);
      dispatch({ type: "ADD_REWARDS_BATCH", payload: { rewards } });
    }
    onComplete();
  }, [selectedQuestIds, selectedRewardIds, dispatch, onComplete]);

  return (
    <div className={styles.wizard}>
      {step === "welcome" && (
        <div className={styles.step}>
          <h1 role="heading" className={styles.srOnly}>
            Welcome to ChoreQuest!
          </h1>
          <TitleBanner />
          <p className={styles.welcomeSubtitle}>
            The epic quest for household heroes
          </p>
          <button
            aria-label="Get started"
            className={styles.primaryButton}
            onClick={() => setStep("pin")}
          >
            Get Started
          </button>
        </div>
      )}

      {step === "pin" && (
        <ParentPinStep
          onPinSet={handlePinSet}
          onBack={() => setStep("welcome")}
        />
      )}

      {step === "choice" && (
        <PostPinChoiceStep
          onGoToPortal={onParentPortal}
          onSetupPlayers={() => setStep("players")}
          onBack={() => setStep("pin")}
        />
      )}

      {step === "players" && (
        <AddPlayersStep
          onNext={() => setStep("select-quests")}
          onBack={() => setStep("choice")}
        />
      )}

      {step === "select-quests" && (
        <SelectQuestsStep
          selectedIds={selectedQuestIds}
          onToggle={handleToggleQuest}
          onSelectAll={handleSelectAllQuests}
          onClearAll={handleClearAllQuests}
          onNext={() => setStep("select-rewards")}
          onSkip={handleSkipQuests}
          onBack={() => setStep("players")}
        />
      )}

      {step === "select-rewards" && (
        <SelectRewardsStep
          selectedIds={selectedRewardIds}
          onToggle={handleToggleReward}
          onSelectAll={handleSelectAllRewards}
          onClearAll={handleClearAllRewards}
          onNext={() => setStep("done")}
          onSkip={handleSkipRewards}
          onBack={() => setStep("select-quests")}
        />
      )}

      {step === "done" && (
        <div className={styles.step}>
          <h1 role="heading" className={styles.welcomeHeading}>
            You&apos;re all set!
          </h1>
          <p className={styles.welcomeSubtitle}>
            ChoreQuest is ready for your heroes
          </p>
          <button
            aria-label="Start ChoreQuest"
            className={styles.primaryButton}
            onClick={handleComplete}
          >
            Let&apos;s Go!
          </button>
        </div>
      )}
    </div>
  );
}
