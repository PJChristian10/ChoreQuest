import bcrypt from "bcryptjs";
import type { ParentConfig, ParentSession } from "../models/auth.js";
import type { Player } from "../models/player.js";

export const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// hashPin
// ---------------------------------------------------------------------------

/**
 * Hash a PIN with bcrypt.
 * Production default: saltRounds=10. Tests should pass saltRounds=1 for speed.
 */
export async function hashPin(
  pin: string,
  saltRounds?: number
): Promise<string> {
  return bcrypt.hash(pin, saltRounds ?? 10);
}

// ---------------------------------------------------------------------------
// verifyPin
// ---------------------------------------------------------------------------

/** Verify a plaintext PIN against a stored bcrypt hash. */
export async function verifyPin(
  pin: string,
  hashedPin: string
): Promise<boolean> {
  return bcrypt.compare(pin, hashedPin);
}

// ---------------------------------------------------------------------------
// validatePinFormat
// ---------------------------------------------------------------------------

/** Validate PIN format: exactly 4 numeric digits. */
export function validatePinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

/** Create a new active session stamped at `now`. */
export function createSession(now: Date): ParentSession {
  return {
    isActive: true,
    createdAt: now,
    lastActivityAt: now,
  };
}

// ---------------------------------------------------------------------------
// touchSession
// ---------------------------------------------------------------------------

/** Return a new session with lastActivityAt updated to `now`. */
export function touchSession(
  session: ParentSession,
  now: Date
): ParentSession {
  return { ...session, lastActivityAt: now };
}

// ---------------------------------------------------------------------------
// isSessionActive
// ---------------------------------------------------------------------------

/**
 * Return true if the session is active and has not exceeded the inactivity
 * timeout as measured from `now`.
 */
export function isSessionActive(
  session: ParentSession,
  now: Date
): boolean {
  if (!session.isActive) return false;
  return now.getTime() - session.lastActivityAt.getTime() < SESSION_TIMEOUT_MS;
}

// ---------------------------------------------------------------------------
// endSession
// ---------------------------------------------------------------------------

/** Explicitly end a session (logout). Returns new session with isActive: false. */
export function endSession(session: ParentSession): ParentSession {
  return { ...session, isActive: false };
}

// ---------------------------------------------------------------------------
// verifyAndRecord
// ---------------------------------------------------------------------------

/**
 * Attempt PIN verification.
 * On success  → success: true,  failedAttempts reset to 0.
 * On failure  → success: false, failedAttempts incremented by 1.
 * Never mutates the incoming config.
 */
export async function verifyAndRecord(
  pin: string,
  config: ParentConfig
): Promise<{ success: boolean; config: ParentConfig }> {
  const success = await verifyPin(pin, config.hashedPin);
  const updatedConfig: ParentConfig = success
    ? { ...config, failedAttempts: 0 }
    : { ...config, failedAttempts: config.failedAttempts + 1 };
  return { success, config: updatedConfig };
}

// ---------------------------------------------------------------------------
// verifyPlayerPin
// ---------------------------------------------------------------------------

/**
 * Verify a player's PIN against their stored hash.
 * Returns false (never throws) if the player has no playerPin set.
 * Use saltRounds=1 in tests for speed; default production behaviour is bcryptjs.compare.
 */
export async function verifyPlayerPin(
  pin: string,
  player: Player
): Promise<boolean> {
  if (player.playerPin === undefined) return false;
  return bcrypt.compare(pin, player.playerPin);
}

// ---------------------------------------------------------------------------
// changePin
// ---------------------------------------------------------------------------

/**
 * Change PIN: verify current PIN first, then hash and return new config.
 * On success  → success: true,  new hashedPin and failedAttempts: 0.
 * On failure  → success: false, config unchanged (failedAttempts incremented).
 */
export async function changePin(
  currentPin: string,
  newPin: string,
  config: ParentConfig
): Promise<{ success: boolean; config: ParentConfig }> {
  const { success, config: recordedConfig } = await verifyAndRecord(currentPin, config);
  if (!success) {
    return { success: false, config: recordedConfig };
  }
  const hashedPin = await hashPin(newPin);
  const updatedConfig: ParentConfig = { hashedPin, failedAttempts: 0 };
  return { success: true, config: updatedConfig };
}
