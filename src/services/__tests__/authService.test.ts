import { describe, it, expect } from "vitest";
import {
  hashPin,
  verifyPin,
  validatePinFormat,
  createSession,
  touchSession,
  isSessionActive,
  endSession,
  verifyAndRecord,
  changePin,
  SESSION_TIMEOUT_MS,
} from "../authService.js";
import type { ParentConfig, ParentSession } from "../../models/auth.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal ParentConfig from a pre-hashed PIN for test setup. */
async function makeConfig(pin: string, failedAttempts = 0): Promise<ParentConfig> {
  const hashedPin = await hashPin(pin, 1);
  return { hashedPin, failedAttempts };
}

const BASE_DATE = new Date("2026-01-01T12:00:00.000Z");

function msLater(ms: number): Date {
  return new Date(BASE_DATE.getTime() + ms);
}

// ---------------------------------------------------------------------------
// validatePinFormat (sync)
// ---------------------------------------------------------------------------

describe("validatePinFormat", () => {
  it('returns true for "1234"', () => {
    expect(validatePinFormat("1234")).toBe(true);
  });

  it('returns true for "0000" (all zeros valid)', () => {
    expect(validatePinFormat("0000")).toBe(true);
  });

  it('returns true for "9999"', () => {
    expect(validatePinFormat("9999")).toBe(true);
  });

  it('returns false for "123" (too short)', () => {
    expect(validatePinFormat("123")).toBe(false);
  });

  it('returns false for "12345" (too long)', () => {
    expect(validatePinFormat("12345")).toBe(false);
  });

  it('returns false for "abcd" (non-numeric)', () => {
    expect(validatePinFormat("abcd")).toBe(false);
  });

  it('returns false for "12.4" (contains dot)', () => {
    expect(validatePinFormat("12.4")).toBe(false);
  });

  it('returns false for "" (empty string)', () => {
    expect(validatePinFormat("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hashPin / verifyPin (async)
// ---------------------------------------------------------------------------

describe("hashPin", () => {
  it("returns a string that is NOT the original PIN", async () => {
    const hash = await hashPin("1234", 1);
    expect(hash).not.toBe("1234");
  });

  it('result starts with "$2" (bcrypt hash prefix)', async () => {
    const hash = await hashPin("1234", 1);
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("two calls with the same PIN produce different hashes (salt randomness)", async () => {
    const hash1 = await hashPin("1234", 1);
    const hash2 = await hashPin("1234", 1);
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPin", () => {
  it("returns true when PIN matches the hash", async () => {
    const hash = await hashPin("5678", 1);
    expect(await verifyPin("5678", hash)).toBe(true);
  });

  it("returns false when PIN does not match the hash", async () => {
    const hash = await hashPin("5678", 1);
    expect(await verifyPin("0000", hash)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createSession (sync)
// ---------------------------------------------------------------------------

describe("createSession", () => {
  it("returns isActive: true", () => {
    const session = createSession(BASE_DATE);
    expect(session.isActive).toBe(true);
  });

  it("sets createdAt to the passed-in now", () => {
    const session = createSession(BASE_DATE);
    expect(session.createdAt).toEqual(BASE_DATE);
  });

  it("sets lastActivityAt to the passed-in now", () => {
    const session = createSession(BASE_DATE);
    expect(session.lastActivityAt).toEqual(BASE_DATE);
  });
});

// ---------------------------------------------------------------------------
// touchSession (sync)
// ---------------------------------------------------------------------------

describe("touchSession", () => {
  it("returns a new session with updated lastActivityAt", () => {
    const session = createSession(BASE_DATE);
    const later = msLater(60_000);
    const touched = touchSession(session, later);
    expect(touched.lastActivityAt).toEqual(later);
  });

  it("does NOT mutate the original session", () => {
    const session = createSession(BASE_DATE);
    const originalLastActivity = session.lastActivityAt;
    touchSession(session, msLater(60_000));
    expect(session.lastActivityAt).toEqual(originalLastActivity);
  });

  it("isActive remains true after touch", () => {
    const session = createSession(BASE_DATE);
    const touched = touchSession(session, msLater(60_000));
    expect(touched.isActive).toBe(true);
  });

  it("preserves createdAt unchanged", () => {
    const session = createSession(BASE_DATE);
    const touched = touchSession(session, msLater(60_000));
    expect(touched.createdAt).toEqual(BASE_DATE);
  });
});

// ---------------------------------------------------------------------------
// isSessionActive (sync)
// ---------------------------------------------------------------------------

describe("isSessionActive", () => {
  it("returns true for an active session with 0 ms elapsed", () => {
    const session = createSession(BASE_DATE);
    expect(isSessionActive(session, BASE_DATE)).toBe(true);
  });

  it("returns true for an active session with 9 min 59 s elapsed", () => {
    const session = createSession(BASE_DATE);
    const justUnder = msLater(SESSION_TIMEOUT_MS - 1);
    expect(isSessionActive(session, justUnder)).toBe(true);
  });

  it("returns false when exactly 10 minutes have elapsed (expired)", () => {
    const session = createSession(BASE_DATE);
    const exactly10 = msLater(SESSION_TIMEOUT_MS);
    expect(isSessionActive(session, exactly10)).toBe(false);
  });

  it("returns false when 11 minutes have elapsed", () => {
    const session = createSession(BASE_DATE);
    const over10 = msLater(SESSION_TIMEOUT_MS + 60_000);
    expect(isSessionActive(session, over10)).toBe(false);
  });

  it("returns false when isActive is false regardless of time", () => {
    const session: ParentSession = {
      isActive: false,
      createdAt: BASE_DATE,
      lastActivityAt: BASE_DATE,
    };
    expect(isSessionActive(session, BASE_DATE)).toBe(false);
  });

  it("expired session is NOT revived by endSession then isSessionActive check", () => {
    const session = createSession(BASE_DATE);
    const ended = endSession(session);
    expect(isSessionActive(ended, BASE_DATE)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// endSession (sync)
// ---------------------------------------------------------------------------

describe("endSession", () => {
  it("returns a session with isActive: false", () => {
    const session = createSession(BASE_DATE);
    const ended = endSession(session);
    expect(ended.isActive).toBe(false);
  });

  it("does NOT mutate the original session", () => {
    const session = createSession(BASE_DATE);
    endSession(session);
    expect(session.isActive).toBe(true);
  });

  it("preserves other fields (createdAt, lastActivityAt)", () => {
    const session = createSession(BASE_DATE);
    const ended = endSession(session);
    expect(ended.createdAt).toEqual(session.createdAt);
    expect(ended.lastActivityAt).toEqual(session.lastActivityAt);
  });
});

// ---------------------------------------------------------------------------
// verifyAndRecord (async)
// ---------------------------------------------------------------------------

describe("verifyAndRecord", () => {
  it("correct PIN → success: true and failedAttempts reset to 0", async () => {
    const config = await makeConfig("1234", 3);
    const result = await verifyAndRecord("1234", config);
    expect(result.success).toBe(true);
    expect(result.config.failedAttempts).toBe(0);
  });

  it("wrong PIN → success: false and failedAttempts incremented by 1", async () => {
    const config = await makeConfig("1234", 0);
    const result = await verifyAndRecord("9999", config);
    expect(result.success).toBe(false);
    expect(result.config.failedAttempts).toBe(1);
  });

  it("two consecutive wrong PINs → failedAttempts === 2", async () => {
    const config = await makeConfig("1234", 0);
    const after1 = await verifyAndRecord("9999", config);
    const after2 = await verifyAndRecord("9999", after1.config);
    expect(after2.config.failedAttempts).toBe(2);
  });

  it("wrong then correct → failedAttempts resets to 0", async () => {
    const config = await makeConfig("1234", 0);
    const afterWrong = await verifyAndRecord("9999", config);
    const afterCorrect = await verifyAndRecord("1234", afterWrong.config);
    expect(afterCorrect.success).toBe(true);
    expect(afterCorrect.config.failedAttempts).toBe(0);
  });

  it("does NOT mutate the original config", async () => {
    const config = await makeConfig("1234", 0);
    const originalAttempts = config.failedAttempts;
    await verifyAndRecord("9999", config);
    expect(config.failedAttempts).toBe(originalAttempts);
  });
});

// ---------------------------------------------------------------------------
// changePin (async)
// ---------------------------------------------------------------------------

describe("changePin", () => {
  it("correct current PIN + valid new PIN → success: true with new hashedPin stored", async () => {
    const config = await makeConfig("1234");
    const result = await changePin("1234", "5678", config);
    expect(result.success).toBe(true);
    expect(result.config.hashedPin).not.toBe(config.hashedPin);
  });

  it("wrong current PIN → success: false with hashedPin unchanged", async () => {
    const config = await makeConfig("1234");
    const result = await changePin("0000", "5678", config);
    expect(result.success).toBe(false);
    expect(result.config.hashedPin).toBe(config.hashedPin);
  });

  it("new PIN is verifiable with the returned hash", async () => {
    const config = await makeConfig("1234");
    const result = await changePin("1234", "5678", config);
    expect(await verifyPin("5678", result.config.hashedPin)).toBe(true);
  });

  it("old PIN is no longer valid after change", async () => {
    const config = await makeConfig("1234");
    const result = await changePin("1234", "5678", config);
    expect(await verifyPin("1234", result.config.hashedPin)).toBe(false);
  });

  it("wrong current PIN → config has failedAttempts incremented", async () => {
    const config = await makeConfig("1234", 0);
    const result = await changePin("0000", "5678", config);
    expect(result.config.failedAttempts).toBe(1);
  });
});
