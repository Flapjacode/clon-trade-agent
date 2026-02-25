/**
 * signalGenerator.js
 * Generates daily trade signals using the TA engine.
 * Runs on cron or can be triggered manually.
 */

const { fetchCandles, fetchTicker } = require('./marketData');
const { analyze } = require('../engine/taEngine');
const { saveSignal } = require('../db/signals');

// Default watchlist — expand as needed
const WATCHLIST = [
  { symbol: 'BTCUSDT', timeframe: '1H' },
  { symbol: 'ETHUSDT', timeframe: '1H' },
  { symbol: 'SOLUSDT', timeframe: '4H' },
  { symbol: 'BNBUSDT', timeframe: '4H' },
];

const DISCLAIMER = process.env.DISCLAIMER_TEXT ||
  'This analysis is for informational purposes only. Trade responsibly. Market conditions change rapidly.';

/**
 * Generate signals for all watched assets.
 * @returns {Array<Signal>}
 */
async function generateDailySignals() {
  const signals = [];

  for (const { symbol, timeframe } of WATCHLIST) {
    try {
      const signal = await generateSignalForAsset(symbol, timeframe);
      if (signal) {
        await saveSignal(signal);
        signals.push(signal);
      }
    } catch (err) {
      console.error(`[signalGenerator] Failed for ${symbol}:`, err.message);
    }
  }

  console.log(`[signalGenerator] Generated ${signals.length} signals.`);
  return signals;
}

/**
 * Generate a single signal for one asset.
 */
async function generateSignalForAsset(symbol, timeframe) {
  const candles = await fetchCandles(symbol, timeframe, 300);
  const ticker  = await fetchTicker(symbol);
  const ta      = analyze(candles, timeframe);

  // Only generate signal if there's a clear bias
  if (ta.bias === 'Neutral / Wait') {
    console.log(`[signalGenerator] ${symbol} — Neutral, skipping signal.`);
    return null;
  }

  const direction = ta.bias === 'Bullish' ? 'Long' : 'Short';
  const entry     = calcEntryZone(ticker.price, ta);
  const sl        = calcStopLoss(direction, ta);
  const targets   = calcTargets(direction, ta);
  const rr        = calcRiskReward(entry.mid, sl, targets[0]);

  return {
    asset: symbol,
    direction,
    entryLow: entry.low,
    entryHigh: entry.high,
    stopLoss: sl,
    targets,
    timeframe,
    rrRatio: rr,
    status: 'Open',
    timestamp: new Date().toISOString(),
    reasoning: ta.summary.join(' | '),
    disclaimer: DISCLAIMER,
  };
}

// ─── Signal Math ────────────────────────────────────────────

function calcEntryZone(price, ta) {
  const buffer = price * 0.003; // 0.3% buffer
  return {
    low: round(price - buffer),
    mid: round(price),
    high: round(price + buffer),
  };
}

function calcStopLoss(direction, ta) {
  const { nearestSupport, nearestResistance } = ta.structure.supportResistance;
  const ema50  = ta.indicators.ema.ema50;
  const ema200 = ta.indicators.ema.ema200;

  if (direction === 'Long') {
    // SL below nearest support or EMA200, whichever is closer
    return round(Math.max(nearestSupport || ema200 * 0.99, ema50 * 0.99));
  } else {
    // SL above nearest resistance or EMA200
    return round(Math.min(nearestResistance || ema200 * 1.01, ema50 * 1.01));
  }
}

function calcTargets(direction, ta) {
  const { nearestResistance, nearestSupport } = ta.structure.supportResistance;
  const price = ta.currentPrice;

  if (direction === 'Long') {
    const t1 = nearestResistance || round(price * 1.025);
    const t2 = round(price * 1.05);
    return [t1, t2];
  } else {
    const t1 = nearestSupport || round(price * 0.975);
    const t2 = round(price * 0.95);
    return [t1, t2];
  }
}

function calcRiskReward(entry, sl, target) {
  const risk   = Math.abs(entry - sl);
  const reward = Math.abs(target - entry);
  if (risk === 0) return '0';
  return `1:${round(reward / risk, 1)}`;
}

function round(n, d = 2) {
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

module.exports = { generateDailySignals, generateSignalForAsset };
