import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type Dispatch,
} from "react";
import type { GameState, GameAction } from "./types.js";
import { gameReducer } from "./reducer.js";
import { saveState, loadState } from "./localStorage.js";
import { SEED_STATE } from "./seed.js";
import {
  loadFromSupabase,
  syncAction,
  pushMigration,
  subscribeToFamily,
} from "./syncService.js";
import { getSupabaseClient } from "../lib/supabaseClient.js";

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);
const SaveStatusContext = createContext<boolean>(false);

// ---------------------------------------------------------------------------
// GameProvider
// ---------------------------------------------------------------------------

interface GameProviderProps {
  readonly children: ReactNode;
  /** Inject a starting state — used in tests to bypass localStorage. */
  readonly initialState?: GameState;
  /** Skip all Supabase and localStorage I/O — used in tests. Default false. */
  readonly skipSync?: boolean;
}

export function GameProvider({ children, initialState, skipSync: skipSyncProp = false }: GameProviderProps): React.JSX.Element {
  const skipSync = skipSyncProp;

  const startingState: GameState = (() => {
    if (initialState !== undefined) return initialState;
    const persisted = loadState();
    return persisted ?? SEED_STATE;
  })();

  const [state, baseDispatch] = useReducer(gameReducer, startingState);
  const [saveFailed, setSaveFailed] = useState(false);

  // familyId drives the realtime subscription effect; set once after auth.
  const [familyId, setFamilyId] = useState<string | null>(null);

  // Refs used inside the stable `dispatch` callback so it never needs to be
  // recreated when familyId or state change.
  const stateRef = useRef<GameState>(startingState);
  const familyIdRef = useRef<string | null>(null);
  // Prevents echoing remote LOAD_STATE actions back to Supabase.
  const isRemoteRef = useRef(false);

  // Keep refs in sync with the latest values on every render.
  stateRef.current = state;
  familyIdRef.current = familyId;

  // ── Wrapped dispatch ────────────────────────────────────────────────────
  // Stable reference (no deps) — safe to pass through context without
  // triggering extra re-renders in consumers.
  const dispatch = useCallback(
    (action: GameAction) => {
      // Compute next state synchronously (pure reducer — cheap).
      const nextState = gameReducer(stateRef.current, action);
      baseDispatch(action);

      // Skip Supabase sync in test mode or for remote-triggered LOAD_STATE.
      if (!skipSync && familyIdRef.current !== null && !isRemoteRef.current) {
        void syncAction(action, nextState, familyIdRef.current).catch(() => {});
      }
    },
    [skipSync] // skipSync is constant after mount
  );

  // ── localStorage — write on every state change (offline fallback) ────────
  useEffect(() => {
    if (skipSync) return;
    const ok = saveState(state);
    setSaveFailed(!ok);
  }, [state, skipSync]);

  // ── Supabase auth init + initial state load ──────────────────────────────
  useEffect(() => {
    if (skipSync) return;
    const client = getSupabaseClient();
    if (!client) return; // No env vars — run purely on localStorage

    void (async () => {
      try {
        // Restore existing session or create a new anonymous one.
        const { data: { session } } = await client.auth.getSession();
        let uid: string;

        if (session?.user) {
          uid = session.user.id;
        } else {
          const { data, error } = await client.auth.signInAnonymously();
          if (error || !data.user) return;
          uid = data.user.id;
        }

        // Surface the familyId to the realtime subscription effect.
        setFamilyId(uid);
        familyIdRef.current = uid;

        // Try to load canonical state from Supabase.
        const remoteState = await loadFromSupabase(uid);

        if (remoteState !== null) {
          // Supabase has data — it is the source of truth.
          isRemoteRef.current = true;
          baseDispatch({ type: "LOAD_STATE", payload: remoteState });
          isRemoteRef.current = false;
          saveState(remoteState); // keep localStorage in sync
        } else {
          // No Supabase data yet. If localStorage has data, migrate it up.
          const local = stateRef.current;
          const hasData =
            local.players.length > 0 ||
            local.quests.length > 0 ||
            local.parentConfig !== null;
          if (hasData) {
            await pushMigration(local, uid);
          }
        }
      } catch (err) {
        // Supabase unreachable — the app continues on localStorage alone.
        console.error("[ChoreQuest:GameContext] Supabase init/migration failed:", err);
      }
    })();
  }, [skipSync]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!familyId || skipSync) return;

    const channel = subscribeToFamily(familyId, () => {
      void loadFromSupabase(familyId)
        .then((remoteState) => {
          if (!remoteState) return;
          isRemoteRef.current = true;
          baseDispatch({ type: "LOAD_STATE", payload: remoteState });
          isRemoteRef.current = false;
        })
        .catch(() => {});
    });

    return () => {
      void getSupabaseClient()?.removeChannel(channel);
    };
  }, [familyId, skipSync]);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        <SaveStatusContext.Provider value={saveFailed}>
          {children}
        </SaveStatusContext.Provider>
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useGameState(): GameState {
  const ctx = useContext(GameStateContext);
  if (ctx === null) {
    throw new Error(
      "useGameState must be used within a <GameProvider>. " +
        "Ensure the component tree is wrapped with <GameProvider>."
    );
  }
  return ctx;
}

export function useGameDispatch(): Dispatch<GameAction> {
  const ctx = useContext(GameDispatchContext);
  if (ctx === null) {
    throw new Error(
      "useGameDispatch must be used within a <GameProvider>. " +
        "Ensure the component tree is wrapped with <GameProvider>."
    );
  }
  return ctx;
}

/** Returns true when the most recent localStorage write failed (e.g. storage full). */
export function useSaveFailed(): boolean {
  return useContext(SaveStatusContext);
}
