-- ================================================================
-- ChoreQuest — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PLAYERS ──────────────────────────────────────────────────────
CREATE TABLE players (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  avatar            TEXT,
  xp                INTEGER     NOT NULL DEFAULT 0,
  lifetime_xp       INTEGER     NOT NULL DEFAULT 0,
  coins             INTEGER     NOT NULL DEFAULT 0,
  lifetime_coins    INTEGER     NOT NULL DEFAULT 0,
  weekly_coins      INTEGER     NOT NULL DEFAULT 0,
  level             INTEGER     NOT NULL DEFAULT 1,
  streak            INTEGER     NOT NULL DEFAULT 0,
  longest_streak    INTEGER     NOT NULL DEFAULT 0,
  last_activity_date TEXT,                          -- "YYYY-MM-DD"
  player_pin        TEXT,                           -- bcrypt hash, nullable
  badges            JSONB       NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── QUESTS ───────────────────────────────────────────────────────
CREATE TABLE quests (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  icon        TEXT        NOT NULL DEFAULT '',
  art_key     TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  xp_reward   INTEGER     NOT NULL DEFAULT 0,
  coin_reward INTEGER     NOT NULL DEFAULT 0,
  difficulty  INTEGER     NOT NULL CHECK (difficulty IN (1, 2, 3)),
  category    TEXT        NOT NULL DEFAULT 'home',
  recurrence  TEXT        NOT NULL CHECK (recurrence IN ('daily', 'weekly', 'one-time', 'bonus')),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by  TEXT        NOT NULL DEFAULT 'parent',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── QUEST CLAIMS ─────────────────────────────────────────────────
CREATE TABLE quest_claims (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id      UUID        NOT NULL REFERENCES quests(id)   ON DELETE CASCADE,
  player_id     UUID        NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'denied')),
  claimed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  resolved_by   TEXT,
  xp_awarded    INTEGER     NOT NULL DEFAULT 0,
  coins_awarded INTEGER     NOT NULL DEFAULT 0
);

-- ── REWARDS ──────────────────────────────────────────────────────
CREATE TABLE rewards (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  icon        TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  coin_cost   INTEGER     NOT NULL DEFAULT 0,
  stock       INTEGER     NOT NULL DEFAULT -1,     -- -1 = unlimited
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  category    TEXT        NOT NULL DEFAULT 'activities',
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── REWARD REDEMPTIONS ───────────────────────────────────────────
CREATE TABLE reward_redemptions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id    UUID        NOT NULL REFERENCES rewards(id)   ON DELETE CASCADE,
  player_id    UUID        NOT NULL REFERENCES players(id)   ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ
);

-- ── PARENT CONFIG (one row per family) ───────────────────────────
CREATE TABLE parent_config (
  family_id       UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hashed_pin      TEXT    NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── UPDATED_AT TRIGGERS ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_quests_updated_at
  BEFORE UPDATE ON quests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rewards_updated_at
  BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_parent_config_updated_at
  BEFORE UPDATE ON parent_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────────
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_claims       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_config      ENABLE ROW LEVEL SECURITY;

-- Each anonymous session only sees its own family's rows
CREATE POLICY "family_isolation" ON players
  FOR ALL USING (family_id = auth.uid()) WITH CHECK (family_id = auth.uid());
CREATE POLICY "family_isolation" ON quests
  FOR ALL USING (family_id = auth.uid()) WITH CHECK (family_id = auth.uid());
CREATE POLICY "family_isolation" ON quest_claims
  FOR ALL USING (family_id = auth.uid()) WITH CHECK (family_id = auth.uid());
CREATE POLICY "family_isolation" ON rewards
  FOR ALL USING (family_id = auth.uid()) WITH CHECK (family_id = auth.uid());
CREATE POLICY "family_isolation" ON reward_redemptions
  FOR ALL USING (family_id = auth.uid()) WITH CHECK (family_id = auth.uid());
CREATE POLICY "family_isolation" ON parent_config
  FOR ALL USING (family_id = auth.uid()) WITH CHECK (family_id = auth.uid());

-- ── INDEXES ──────────────────────────────────────────────────────
CREATE INDEX idx_players_family      ON players(family_id);
CREATE INDEX idx_quests_family       ON quests(family_id);
CREATE INDEX idx_claims_family       ON quest_claims(family_id);
CREATE INDEX idx_claims_status       ON quest_claims(family_id, status);
CREATE INDEX idx_rewards_family      ON rewards(family_id);
CREATE INDEX idx_redemptions_family  ON reward_redemptions(family_id);
CREATE INDEX idx_redemptions_status  ON reward_redemptions(family_id, status);
