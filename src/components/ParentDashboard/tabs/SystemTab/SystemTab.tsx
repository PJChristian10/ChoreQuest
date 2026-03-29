import { useState, useRef } from "react";
import { useGameState } from "../../../../state/GameContext.js";
import { saveState } from "../../../../state/localStorage.js";
import { getSupabaseClient } from "../../../../lib/supabaseClient.js";
import type { GameState } from "../../../../state/types.js";
import styles from "./SystemTab.module.css";

export function SystemTab(): JSX.Element {
  const state = useGameState();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<GameState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sync code (cross-device) ───────────────────────────────────────────────
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [syncCodeCopied, setSyncCodeCopied] = useState(false);

  const handleShowSyncCode = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setSyncCode("SUPABASE_NOT_CONFIGURED");
      return;
    }
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      setSyncCode("NO_SESSION");
      return;
    }
    // Encode the full session as base64 so it's copyable as one string.
    // The receiving device calls supabase.auth.setSession({ access_token, refresh_token }).
    const payload = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    setSyncCode(btoa(payload));
    setSyncCodeCopied(false);
  };

  const handleCopySyncCode = () => {
    if (!syncCode) return;
    void navigator.clipboard.writeText(syncCode).then(() => {
      setSyncCodeCopied(true);
      setTimeout(() => setSyncCodeCopied(false), 2000);
    });
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    const filename = `chorequest-backup-${date}.json`;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import: parse file → show confirmation ────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed: unknown = JSON.parse(evt.target?.result as string);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          !("players" in parsed) ||
          !("quests" in parsed)
        ) {
          setImportError("Invalid backup file — not a ChoreQuest export.");
          return;
        }
        setPendingImport(parsed as GameState);
      } catch {
        setImportError("Could not read file. Make sure it is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected if needed
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    saveState(pendingImport);
    window.location.reload();
  };

  const handleCancelImport = () => {
    setPendingImport(null);
    setImportError(null);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const openResetModal = () => {
    setConfirmText("");
    setResetModalOpen(true);
  };

  const closeResetModal = () => {
    setConfirmText("");
    setResetModalOpen(false);
  };

  const handleConfirmReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const isConfirmed = confirmText === "RESET";

  const pendingPlayerCount = Array.isArray((pendingImport as Record<string, unknown> | null)?.["players"])
    ? ((pendingImport as Record<string, unknown>)["players"] as unknown[]).length
    : 0;
  const pendingQuestCount = Array.isArray((pendingImport as Record<string, unknown> | null)?.["quests"])
    ? ((pendingImport as Record<string, unknown>)["quests"] as unknown[]).length
    : 0;

  return (
    <div className={styles.tab}>
      <h2 className={styles.heading}>System</h2>

      {/* ── Backup & Restore ── */}
      <div className={styles.backupZone}>
        <h3 className={styles.backupHeading}>💾 Backup &amp; Restore</h3>
        <p className={styles.backupDesc}>
          All progress saves automatically to this browser after every action —
          no export required to keep data safe during normal use.
        </p>
        <p className={styles.storageWarning}>
          ⚠️ Some tablets and browsers (especially Safari on iPad) can clear
          saved data after a period of inactivity. Export a backup at least
          once a week to protect against this.
        </p>
        <div className={styles.backupActions}>
          <button
            aria-label="Export backup"
            className={styles.exportButton}
            onClick={handleExport}
          >
            ⬇️ Export Backup
          </button>
          <button
            aria-label="Import backup"
            className={styles.importButton}
            onClick={() => fileInputRef.current?.click()}
          >
            ⬆️ Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            aria-label="Select backup file"
            className={styles.fileInput}
            onChange={handleImportFile}
          />
        </div>
        {importError !== null && (
          <p role="alert" className={styles.importError}>{importError}</p>
        )}
      </div>

      {/* ── Cross-device sync ── */}
      <div className={styles.syncZone}>
        <h3 className={styles.syncHeading}>🔗 Link Another Device</h3>
        <p className={styles.syncDesc}>
          To access ChoreQuest on a second device (e.g. your phone), generate a
          sync code here and paste it into the app on the new device during
          setup.
        </p>
        <p className={styles.syncWarning}>
          The code contains your session credentials — treat it like a password.
          It is valid for one transfer; once the new device connects you will
          need a fresh code for any additional devices.
        </p>
        <button
          aria-label="Generate sync code"
          className={styles.syncButton}
          onClick={() => { void handleShowSyncCode(); }}
        >
          Generate Sync Code
        </button>

        {syncCode !== null && syncCode !== "SUPABASE_NOT_CONFIGURED" && syncCode !== "NO_SESSION" && (
          <div className={styles.syncCodeBox}>
            <p className={styles.syncCodeLabel}>Your sync code:</p>
            <code className={styles.syncCodeText}>{syncCode}</code>
            <button
              aria-label="Copy sync code"
              className={styles.syncCopyButton}
              onClick={handleCopySyncCode}
            >
              {syncCodeCopied ? "✅ Copied!" : "Copy"}
            </button>
          </div>
        )}
        {syncCode === "SUPABASE_NOT_CONFIGURED" && (
          <p role="alert" className={styles.syncError}>
            Supabase is not configured. Add VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY to your .env.local file to enable sync.
          </p>
        )}
        {syncCode === "NO_SESSION" && (
          <p role="alert" className={styles.syncError}>
            No active session found. Reload the app and try again.
          </p>
        )}
      </div>

      <div className={styles.dangerZone}>
        <h3 className={styles.dangerHeading}>⚠️ Danger Zone</h3>
        <p className={styles.dangerDesc}>
          Permanently delete all players, quests, rewards, and progress. The app
          will return to the setup wizard.
        </p>
        <button
          aria-label="Reset App"
          className={styles.resetButton}
          onClick={openResetModal}
        >
          ⚠️ Reset App
        </button>
      </div>

      {/* ── Import confirmation modal ── */}
      {pendingImport !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm backup restore"
          className={styles.overlay}
        >
          <div className={styles.importModal}>
            <h2 className={styles.importModalTitle}>⬆️ Restore Backup?</h2>
            <p className={styles.modalWarning}>
              This will replace <strong>all current data</strong> — players,
              quests, rewards, and progress — with the contents of the backup
              file.
            </p>
            <p className={styles.importMeta}>
              Backup contains: <strong>{pendingPlayerCount} player{pendingPlayerCount !== 1 ? "s" : ""}</strong>,{" "}
              <strong>{pendingQuestCount} quest{pendingQuestCount !== 1 ? "s" : ""}</strong>.
            </p>
            <p className={styles.modalWarning}>
              Any activity recorded since this backup was made will be lost.
              This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                aria-label="Cancel restore"
                className={styles.cancelButton}
                onClick={handleCancelImport}
              >
                Cancel
              </button>
              <button
                aria-label="Confirm restore"
                className={styles.importConfirmButton}
                onClick={handleConfirmImport}
              >
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset confirmation modal ── */}
      {resetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm app reset"
          className={styles.overlay}
        >
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>⚠️ Reset App?</h2>
            <p className={styles.modalWarning}>
              This will permanently delete all players, quests, rewards, and
              progress. This cannot be undone.
            </p>

            <label htmlFor="reset-confirm" className={styles.confirmLabel}>
              Type <strong>RESET</strong> to confirm
            </label>
            <input
              id="reset-confirm"
              type="text"
              aria-label="Type RESET to confirm"
              className={styles.confirmInput}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />

            <div className={styles.modalActions}>
              <button
                aria-label="Cancel"
                className={styles.cancelButton}
                onClick={closeResetModal}
              >
                Cancel
              </button>
              <button
                aria-label="Confirm Reset"
                className={styles.confirmButton}
                disabled={!isConfirmed}
                onClick={handleConfirmReset}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
