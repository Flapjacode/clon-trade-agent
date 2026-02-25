/**
 * taEngine.js
 * Core Technical Analysis Engine for Clon.
 * 
 * Computes: EMA (9,21,50,200), RSI, MACD, Volume analysis,
 * Support/Resistance, Trend Structure, Bias classification.
 */

const ti = require('technicalindicators');

/**
 * Main entry point. Pass in candle array, get full TA report.
 * @param {Array<{open,high,low,close,volume}>} candles
 * @param {string} timeframe
 * @returns {TAReport}
 */
function analyze(candles, timeframe = '1H') {
  if (!candles || candles.length < 200) {
    throw new Error('Insufficient candle data — need at least 200 candles.');
  }

  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const vols   = candles.map(c => c.volume);

  const ema9   = calcEMA(closes, 9);
  const ema21  = calcEMA(closes, 21);
  const ema50  = calcEMA(closes, 50);
  const ema200 = calcEMA(closes, 200);
  const rsi    = calcRSI(closes, 14);
  const macd   = calcMACD(closes);
  const volume = analyzeVolume(vols);
  const sr     = detectSupportResistance(highs, lows, closes);
  const trend  = detectTrendStructure(highs, lows);

  const currentPrice = closes[closes.length - 1];

  const bias = classifyBias({
    price: currentPrice,
    ema9, ema21, ema50, ema200,
    rsi, macd, trend, volume,
  });

  return {
    timeframe,
    currentPrice,
    indicators: {
      ema: { ema9, ema21, ema50, ema200 },
      rsi,
      macd,
      volume,
    },
    structure: { trend, supportResistance: sr },
    bias,
    summary: buildSummary({ currentPrice, ema9, ema21, ema50, ema200, rsi, macd, trend, volume, bias, sr }),
  };
}

// ─── Indicator Calculators ──────────────────────────────────

function calcEMA(closes, period) {
  const results = ti.EMA.calculate({ period, values: closes });
  return round(results[results.length - 1]);
}

function calcRSI(closes, period = 14) {
  const results = ti.RSI.calculate({ period, values: closes });
  const value = round(results[results.length - 1]);
  return {
    value,
    signal: value > 70 ? 'overbought' : value < 30 ? 'oversold' : 'neutral',
  };
}

function calcMACD(closes) {
  const results = ti.MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const last = results[results.length - 1];
  const prev = results[results.length - 2];
  const crossover = last.histogram > 0 && prev.histogram <= 0 ? 'bullish_crossover'
    : last.histogram < 0 && prev.histogram >= 0 ? 'bearish_crossover'
    : last.histogram > 0 ? 'bullish' : 'bearish';

  return {
    macd: round(last.MACD),
    signal: round(last.signal),
    histogram: round(last.histogram),
    crossover,
  };
}

function analyzeVolume(vols) {
  const avg20 = vols.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const current = vols[vols.length - 1];
  const ratio = round(current / avg20, 2);
  return {
    current: round(current),
    avg20: round(avg20),
    ratio,
    signal: ratio > 1.5 ? 'high — strong conviction'
      : ratio < 0.6 ? 'low — weak conviction'
      : 'average',
  };
}

function detectSupportResistance(highs, lows, closes) {
  // Simple pivot-based S/R using last 50 candles
  const slice = 50;
  const recentHighs = highs.slice(-slice);
  const recentLows  = lows.slice(-slice);
  const currentPrice = closes[closes.length - 1];

  const levels = [];
  for (let i = 2; i < recentHighs.length - 2; i++) {
    if (recentHighs[i] > recentHighs[i-1] && recentHighs[i] > recentHighs[i-2]
      && recentHighs[i] > recentHighs[i+1] && recentHighs[i] > recentHighs[i+2]) {
      levels.push({ type: 'resistance', price: round(recentHighs[i]) });
    }
    if (recentLows[i] < recentLows[i-1] && recentLows[i] < recentLows[i-2]
      && recentLows[i] < recentLows[i+1] && recentLows[i] < recentLows[i+2]) {
      levels.push({ type: 'support', price: round(recentLows[i]) });
    }
  }

  // Find nearest support below and resistance above
  const supports    = levels.filter(l => l.type === 'support' && l.price < currentPrice)
                            .sort((a, b) => b.price - a.price);
  const resistances = levels.filter(l => l.type === 'resistance' && l.price > currentPrice)
                            .sort((a, b) => a.price - b.price);

  return {
    nearestSupport: supports[0]?.price || null,
    nearestResistance: resistances[0]?.price || null,
    allLevels: levels.slice(0, 10),
  };
}

function detectTrendStructure(highs, lows) {
  // Simplified swing high/low analysis on last 20 candles
  const n = 20;
  const h = highs.slice(-n);
  const l = lows.slice(-n);

  const midH = h.slice(0, n/2);
  const latH = h.slice(n/2);
  const midL = l.slice(0, n/2);
  const latL = l.slice(n/2);

  const higherHighs = Math.max(...latH) > Math.max(...midH);
  const higherLows  = Math.min(...latL) > Math.min(...midL);
  const lowerHighs  = Math.max(...latH) < Math.max(...midH);
  const lowerLows   = Math.min(...latL) < Math.min(...midL);

  if (higherHighs && higherLows) return 'uptrend (HH + HL)';
  if (lowerHighs && lowerLows)   return 'downtrend (LH + LL)';
  if (higherHighs && lowerLows)  return 'volatile / expanding';
  return 'ranging / consolidation';
}

// ─── Bias Classification ────────────────────────────────────

function classifyBias({ price, ema50, ema200, rsi, macd, trend }) {
  let bullScore = 0;
  let bearScore = 0;

  if (price > ema50)  bullScore++;
  else                bearScore++;

  if (price > ema200) bullScore++;
  else                bearScore++;

  if (rsi.value > 50 && rsi.signal !== 'overbought') bullScore++;
  else if (rsi.value < 50 && rsi.signal !== 'oversold') bearScore++;

  if (macd.histogram > 0) bullScore++;
  else                    bearScore++;

  if (trend.includes('uptrend'))   bullScore++;
  if (trend.includes('downtrend')) bearScore++;

  if (bullScore >= 4) return 'Bullish';
  if (bearScore >= 4) return 'Bearish';
  return 'Neutral / Wait';
}

// ─── Summary Builder ────────────────────────────────────────

function buildSummary({ currentPrice, ema50, ema200, rsi, macd, trend, volume, bias, sr }) {
  return [
    `Trend: ${trend}`,
    `EMA: Price ${currentPrice > ema200 ? 'above' : 'below'} 200 EMA (${ema200}), ${currentPrice > ema50 ? 'above' : 'below'} 50 EMA (${ema50})`,
    `RSI: ${rsi.value} (${rsi.signal})`,
    `MACD: ${macd.crossover.replace('_', ' ')} | Histogram ${macd.histogram > 0 ? '+' : ''}${macd.histogram}`,
    `Volume: ${volume.signal} (${volume.ratio}x avg)`,
    `Nearest Support: ${sr.nearestSupport || 'N/A'}`,
    `Nearest Resistance: ${sr.nearestResistance || 'N/A'}`,
    `Bias: ${bias}`,
  ];
}

// ─── Helpers ────────────────────────────────────────────────

function round(n, decimals = 2) {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

module.exports = { analyze };
