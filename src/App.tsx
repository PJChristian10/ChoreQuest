import { useState, useEffect } from "react";
import { GameProvider } from "./state/GameContext.js";
import { QuestBoard } from "./components/QuestBoard/index.js";
import { KioskHome } from "./components/KioskHome/KioskHome.js";
import { SetupWizard } from "./components/SetupWizard/SetupWizard.js";
import { ParentReauthScreen } from "./components/ParentReauthScreen/ParentReauthScreen.js";
import { ParentDashboard } from "./components/ParentDashboard/ParentDashboard.js";
import { useGameState, useGameDispatch, useSaveFailed } from "./state/GameContext.js";
import { useInactivityTimer } from "./hooks/useInactivityTimer.js";
import { verifyPin as verifyParentPin, createSession } from "./services/authService.js";
import styles from "./App.module.css";

type AppScreen = "loading" | "setup" | "reauth-setup" | "kiosk" | "quest-board" | "parent-dashboard";

// AppContent holds UI state (screen, activePlayerId) and the inactivity timer.
// It lives inside GameProvider so it can read game state.
function AppContent() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const saveFailed = useSaveFailed();
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (state.players.length === 0) {
      return state.parentConfig !== null ? "reauth-setup" : "setup";
    }
    return "kiosk";
  });
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  // When Supabase loads family data into an otherwise-empty state (e.g. after
  // a sync-code join on a new device), advance past the setup wizard.
  useEffect(() => {
    if (screen === "setup" && state.players.length > 0) {
      setScreen("kiosk");
    }
  }, [state.players.length, screen]);

  // Inactivity timer — return to kiosk after 60s
  useInactivityTimer(60_000, () => {
    setActivePlayerId(null);
    setScreen("kiosk");
  });

  function renderScreen() {
    if (screen === "reauth-setup") {
      return (
        <ParentReauthScreen
          onSuccess={() => {
            dispatch({
              type: "SET_PARENT_SESSION",
              session: createSession(new Date()),
            });
            setScreen("parent-dashboard");
          }}
          verifyPin={async (pin) => {
            if (!state.parentConfig) return false;
            return verifyParentPin(pin, state.parentConfig.hashedPin);
          }}
        />
      );
    }
    if (screen === "setup") {
      return (
        <SetupWizard
          onComplete={() => setScreen("kiosk")}
          onParentPortal={() => {
            dispatch({
              type: "SET_PARENT_SESSION",
              session: createSession(new Date()),
            });
            setScreen("parent-dashboard");
          }}
        />
      );
    }
    if (screen === "parent-dashboard") {
      return (
        <ParentDashboard
          onExit={() => {
            dispatch({ type: "END_SESSION" });
            setScreen("kiosk");
          }}
        />
      );
    }
    if (screen === "quest-board" && activePlayerId !== null) {
      return (
        <QuestBoard
          activePlayerId={activePlayerId}
          onPlayerSelect={(id) => setActivePlayerId(id)}
          onExit={() => {
            setActivePlayerId(null);
            setScreen("kiosk");
          }}
        />
      );
    }
    // default: kiosk
    return (
      <KioskHome
        onPlayerUnlocked={(id) => {
          setActivePlayerId(id);
          setScreen("quest-board");
        }}
        onParentUnlocked={() => {
          dispatch({
            type: "SET_PARENT_SESSION",
            session: createSession(new Date()),
          });
          setScreen("parent-dashboard");
        }}
      />
    );
  }

  return (
    <>
      {saveFailed && (
        <div role="alert" className={styles.saveFailedBanner}>
          ⚠️ Data could not be saved — storage may be full. Open the Parent Dashboard → System tab to export a backup now.
        </div>
      )}
      {renderScreen()}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
