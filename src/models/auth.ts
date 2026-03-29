/**
 * Auth models for parent PIN authentication. (PRD §8.5)
 *
 * PIN is never stored in plaintext — only bcrypt hashes are persisted.
 * Session state is a pure value object; all mutations return new copies.
 */

export interface ParentConfig {
  /** bcrypt hash of the PIN — never store the plaintext PIN */
  readonly hashedPin: string;
  /** Consecutive failed verification attempts since last success */
  readonly failedAttempts: number;
}

export interface ParentSession {
  readonly isActive: boolean;
  readonly createdAt: Date;
  /** Updated on every touch — used to calculate inactivity */
  readonly lastActivityAt: Date;
}
