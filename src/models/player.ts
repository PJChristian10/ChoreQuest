export interface Badge {
  readonly id: string;
  readonly name: string;
  readonly awardedAt: Date;
}

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly xp: number;
  /** Total XP ever earned — never decreases. Drives level calculation. (PRD §7.1) */
  readonly lifetimeXP: number;
  readonly coins: number;
  readonly lifetimeCoins: number;
  /** Coins earned during the current week only. Resets to 0 every Sunday at midnight. (PRD §5.4) */
  readonly weeklyCoins: number;
  readonly level: number;
  readonly streak: number;
  /** All-time best streak (PRD §7.1) */
  readonly longestStreak?: number;
  /** Bcrypt hash of the player's 4-digit PIN. Absent means no PIN required. (PRD §5) */
  readonly playerPin?: string;
  /** Avatar key from AVATAR_OPTIONS (e.g. "cat", "dragon"). (PRD §5) */
  readonly avatar?: string;
  /** Calendar date of the most recent quest completion, "YYYY-MM-DD" (PRD §5.2.1) */
  readonly lastActivityDate?: string;
  readonly badges: readonly Badge[];
}
