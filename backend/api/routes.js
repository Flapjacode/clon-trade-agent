/**
 * routes.js
 * Express-style API route definitions for Clon Trade Agent.
 * Compatible with Next.js App Router API routes too.
 */

const { getTodaysSignals, getActiveSignals, getClosedSignals, computePerformance, updateSignalStatus } = require('../db/signals');
const { handleMention } = require('../services/mentionParser');
const { generateSignalForAsset } = require('../services/signalGenerator');
const { fetchTicker } = require('../services/marketData');
const { analyze } = require('../engine/taEngine');
const { fetchCandles } = require('../services/marketData');
const supportAgent = require('../services/supportAgent');

const DISCLAIMER = process.env.DISCLAIMER_TEXT ||
  'This analysis is for informational purposes only. Trade responsibly.';

// ─── GET /api/signals/today ──────────────────────────────────
async function getSignalsToday(req, res) {
  try {
    const signals = await getTodaysSignals();
    res.json({ success: true, data: signals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET /api/signals/active ─────────────────────────────────
async function getSignalsActive(req, res) {
  try {
    const signals = await getActiveSignals();
    res.json({ success: true, data: signals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET /api/signals/closed ─────────────────────────────────
async function getSignalsClosed(req, res) {
  const limit = parseInt(req.query.limit) || 50;
  try {
    const signals = await getClosedSignals(limit);
    res.json({ success: true, data: signals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET /api/performance ────────────────────────────────────
async function getPerformance(req, res) {
  try {
    const perf = await computePerformance(req.query.since || null);
    res.json({ success: true, data: perf });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ─── PATCH /api/signals/:id/status ──────────────────────────
async function patchSignalStatus(req, res) {
  const { id } = req.params;
  const { status, resultPct } = req.body;
  try {
    const updated = await updateSignalStatus(id, status, resultPct);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ─── POST /api/mention ───────────────────────────────────────
async function postMention(req, res) {
  const { text, userId } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'text is required' });

  try {
    const response = await handleMention(text);
    if (!response) return res.json({ success: true, data: null, message: 'No mention detected.' });
    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ─── POST /api/analyze ───────────────────────────────────────
async function postAnalyze(req, res) {
  const { symbol, timeframe = '1H' } = req.body;
  if (!symbol) return res.status(400).json({ success: false, error: 'symbol is required' });

  try {
    const candles = await fetchCandles(symbol, timeframe, 300);
    const ticker  = await fetchTicker(symbol);
    const ta      = analyze(candles, timeframe);
    res.json({
      success: true,
      data: { ...ta, currentPrice: ticker.price, disclaimer: DISCLAIMER },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ─── POST /api/support ───────────────────────────────────────
async function postSupport(req, res) {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'message is required' });

  try {
    const reply = await supportAgent.respond(message, sessionId);
    res.json({ success: true, data: reply });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET /api/ticker/:symbol ─────────────────────────────────
async function getTicker(req, res) {
  try {
    const ticker = await fetchTicker(req.params.symbol.toUpperCase());
    res.json({ success: true, data: ticker });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getSignalsToday,
  getSignalsActive,
  getSignalsClosed,
  getPerformance,
  patchSignalStatus,
  postMention,
  postAnalyze,
  postSupport,
  getTicker,
};
