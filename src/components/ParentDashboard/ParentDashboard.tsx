import { useState, useEffect } from "react";
import { useGameState } from "../../state/GameContext.js";
import { isSessionActive } from "../../services/authService.js";
import { useInactivityTimer } from "../../hooks/useInactivityTimer.js";
import { PendingApprovalsTab } from "./tabs/PendingApprovalsTab/PendingApprovalsTab.js";
import { QuestManagementTab } from "./tabs/QuestManagementTab/QuestManagementTab.js";
import { RewardManagementTab } from "./tabs/RewardManagementTab/RewardManagementTab.js";
import { PlayerManagementTab } from "./tabs/PlayerManagementTab/PlayerManagementTab.js";
import { ActivityLogTab } from "./tabs/ActivityLogTab/ActivityLogTab.js";
import { SystemTab } from "./tabs/SystemTab/SystemTab.js";
import styles from "./ParentDashboard.module.css";

type TabId = "approvals" | "quests" | "rewards" | "players" | "activity" | "system";

interface ParentDashboardProps {
  onExit: () => void;
}

export function ParentDashboard({ onExit }: ParentDashboardProps): JSX.Element {
  const state = useGameState();
  const [activeTab, setActiveTab] = useState<TabId>("approvals");

  // Inactivity timer — 10 minutes
  useInactivityTimer(10 * 60 * 1000, onExit);

  // Session guard: if session is null or expired, call onExit
  useEffect(() => {
    if (!state.parentSession || !isSessionActive(state.parentSession, new Date())) {
      onExit();
    }
  }); // run on every render to catch real-time expiry

  const pendingCount = state.quests.filter((q) => q.status === "awaiting_approval").length;

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "approvals", label: "Pending Approvals" },
    { id: "quests", label: "Quest Management" },
    { id: "rewards", label: "Reward Management" },
    { id: "players", label: "Player Management" },
    { id: "activity", label: "Activity Log" },
    { id: "system", label: "⚙️ System" },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Parent Dashboard</h1>
        <button
          aria-label="Exit parent dashboard"
          className={styles.exitButton}
          onClick={onExit}
        >
          Exit
        </button>
      </div>

      <div role="tablist" className={styles.tabBar} aria-label="Dashboard tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={styles.tabButton}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "approvals" && pendingCount > 0 && (
              <span className={styles.badge}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel" className={styles.tabPanel}>
        {activeTab === "approvals" && (
          <PendingApprovalsTab onSessionExpired={onExit} />
        )}
        {activeTab === "quests" && (
          <QuestManagementTab onSessionExpired={onExit} />
        )}
        {activeTab === "rewards" && (
          <RewardManagementTab onSessionExpired={onExit} />
        )}
        {activeTab === "players" && (
          <PlayerManagementTab onSessionExpired={onExit} />
        )}
        {activeTab === "activity" && (
          <ActivityLogTab />
        )}
        {activeTab === "system" && (
          <SystemTab />
        )}
      </div>
    </div>
  );
}
