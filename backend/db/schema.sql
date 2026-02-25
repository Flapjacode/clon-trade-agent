/**
 * schema.sql
 * PostgreSQL schema for Clon Trade Agent.
 * Run once to initialize the database.
 */

-- ─── Signals ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signals (
  id            SERIAL PRIMARY KEY,
  asset         VARCHAR(20)  NOT NULL,
  direction     VARCHAR(10)  NOT NULL CHECK (direction IN ('Long', 'Short')),
  entry_low     NUMERIC(18,4) NOT NULL,
  entry_high    NUMERIC(18,4) NOT NULL,
  stop_loss     NUMERIC(18,4) NOT NULL,
  target_1      NUMERIC(18,4),
  target_2      NUMERIC(18,4),
  timeframe     VARCHAR(5)   NOT NULL,
  rr_ratio      VARCHAR(10),
  status        VARCHAR(20)  NOT NULL DEFAULT 'Open'
                  CHECK (status IN ('Open', 'Closed', 'Invalidated', 'TP1 Hit', 'TP2 Hit', 'SL Hit')),
  reasoning     TEXT,
  disclaimer    TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  closed_at     TIMESTAMPTZ,
  result_pct    NUMERIC(8,2)  -- P&L % when closed
);

-- Signals are NEVER deleted — only status updated
-- Covered by app-level enforcement; adding RLS for safety
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- ─── Performance Tracker ────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_summary (
  id              SERIAL PRIMARY KEY,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  total_signals   INT  NOT NULL DEFAULT 0,
  wins            INT  NOT NULL DEFAULT 0,
  losses          INT  NOT NULL DEFAULT 0,
  win_rate        NUMERIC(5,2),
  avg_rr          NUMERIC(5,2),
  max_drawdown    NUMERIC(5,2),
  total_return    NUMERIC(8,2),
  computed_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Mention Log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mention_log (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(100),
  comment     TEXT NOT NULL,
  asset       VARCHAR(20),
  intent      VARCHAR(20),
  bias        VARCHAR(20),
  response    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Support Chat Log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_log (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR(100),
  user_id     VARCHAR(100),
  message     TEXT NOT NULL,
  response    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_signals_asset    ON signals(asset);
CREATE INDEX idx_signals_status   ON signals(status);
CREATE INDEX idx_signals_created  ON signals(created_at DESC);
CREATE INDEX idx_mention_created  ON mention_log(created_at DESC);
