/**
 * signals.js — Database model for trade signals.
 * Signals are IMMUTABLE once posted (no deletions allowed).
 * Only status updates are permitted.
 */

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Save a new signal to the database.
 * @param {Signal} signal
 * @returns {Signal} saved signal with id
 */
async function saveSignal(signal) {
  const {
    asset, direction, entryLow, entryHigh, stopLoss,
    targets, timeframe, rrRatio, status, reasoning, disclaimer, timestamp,
  } = signal;

  const { rows } = await pool.query(
    `INSERT INTO signals
      (asset, direction, entry_low, entry_high, stop_loss,
       target_1, target_2, timeframe, rr_ratio, status, reasoning, disclaimer, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      asset, direction, entryLow, entryHigh, stopLoss,
      targets[0] || null, targets[1] || null,
      timeframe, rrRatio, status || 'Open',
      reasoning, disclaimer, timestamp || new Date().toISOString(),
    ]
  );
  return rows[0];
}

/**
 * Get all signals for today.
 */
async function getTodaysSignals() {
  const { rows } = await pool.query(
    `SELECT * FROM signals
     WHERE created_at >= CURRENT_DATE
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Get all active (Open) signals.
 */
async function getActiveSignals() {
  const { rows } = await pool.query(
    `SELECT * FROM signals WHERE status = 'Open' ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Get closed signals with optional limit.
 */
async function getClosedSignals(limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM signals
     WHERE status NOT IN ('Open')
     ORDER BY closed_at DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );
  return rows;
}

/**
 * Update signal status (the ONLY mutation allowed).
 * No deletion. Status moves forward, never back.
 */
async function updateSignalStatus(id, status, resultPct = null) {
  const allowedStatuses = ['Open', 'TP1 Hit', 'TP2 Hit', 'SL Hit', 'Closed', 'Invalidated'];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const closedStatuses = ['TP2 Hit', 'SL Hit', 'Closed', 'Invalidated'];
  const closedAt = closedStatuses.includes(status) ? new Date().toISOString() : null;

  const { rows } = await pool.query(
    `UPDATE signals
     SET status = $1, result_pct = $2, closed_at = $3
     WHERE id = $4
     RETURNING *`,
    [status, resultPct, closedAt, id]
  );
  return rows[0];
}

/**
 * Compute performance metrics from closed signals.
 */
async function computePerformance(since = null) {
  const sinceClause = since ? `AND closed_at >= $1` : '';
  const params = since ? [since] : [];

  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('TP1 Hit','TP2 Hit','Closed')) AS wins,
       COUNT(*) FILTER (WHERE status = 'SL Hit') AS losses,
       COUNT(*) AS total,
       AVG(result_pct) FILTER (WHERE result_pct IS NOT NULL) AS avg_result,
       MIN(result_pct) AS max_drawdown
     FROM signals
     WHERE status NOT IN ('Open', 'Invalidated') ${sinceClause}`,
    params
  );

  const r = rows[0];
  const wins = parseInt(r.wins) || 0;
  const losses = parseInt(r.losses) || 0;
  const total = parseInt(r.total) || 0;

  return {
    totalSignals: total,
    wins,
    losses,
    winRate: total > 0 ? round((wins / total) * 100) : 0,
    avgResult: round(parseFloat(r.avg_result) || 0),
    maxDrawdown: round(parseFloat(r.max_drawdown) || 0),
  };
}

function round(n, d = 2) {
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

module.exports = {
  saveSignal,
  getTodaysSignals,
  getActiveSignals,
  getClosedSignals,
  updateSignalStatus,
  computePerformance,
};
