import { Lock, CheckCircle } from "lucide-react";
import type { Quest } from "../../models/quest";
import styles from "./QuestCardAction.module.css";

interface QuestCardActionProps {
  quest: Quest;
  onClaim?: (questId: string) => void;
}

export function QuestCardAction({
  quest,
  onClaim,
}: QuestCardActionProps): JSX.Element {
  const { status, isActive } = quest;

  if (status === "awaiting_approval") {
    return (
      <div className={styles.action}>
        <div className={`${styles.statusIndicator} ${styles.awaitingText}`}>
          <span role="img" aria-label="Awaiting approval">
            <Lock size={24} aria-hidden="true" />
          </span>
          <span>Awaiting Approval</span>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className={styles.action}>
        <div className={`${styles.statusIndicator} ${styles.completeText}`}>
          <span role="img" aria-label="Quest complete">
            <CheckCircle size={24} aria-hidden="true" />
          </span>
          <span>Complete</span>
        </div>
      </div>
    );
  }

  // available, denied, expired — show claim button
  return (
    <div className={styles.action}>
      <button
        onClick={() => onClaim?.(quest.id)}
        disabled={isActive === false}
        aria-label="Claim Quest"
        style={{ minHeight: "60px", minWidth: "60px", backgroundColor: "#E8734A" }}
        className={styles.claimButton}
      >
        Claim Quest
      </button>
    </div>
  );
}
