/**
 * mentionParser.js
 * Parses user comments for @tradebot mentions and routes to TA engine.
 */

const { fetchCandles, fetchTicker } = require('./marketData');
const { analyze } = require('../engine/taEngine');

// Supported assets (expand as needed)
const ASSET_MAP = {
  BTC: 'BTCUSDT', BITCOIN: 'BTCUSDT',
  ETH: 'ETHUSDT', ETHEREUM: 'ETHUSDT',
  SOL: 'SOLUSDT', SOLANA: 'SOLUSDT',
  BNB: 'BNBUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT', CARDANO: 'ADAUSDT',
  DOGE: 'DOGEUSDT',
  AVAX: 'AVAXUSDT',
  LINK: 'LINKUSDT',
  DOT: 'DOTUSDT',
};

const BOT_HANDLE = process.env.BOT_MENTION_HANDLE || '@tradebot';
const DISCLAIMER = process.env.DISCLAIMER_TEXT ||
  'This analysis is for informational purposes only. Trade responsibly.';

/**
 * Determines if a comment contains a bot mention.
 */
function isMention(text) {
  return text.toLowerCase().includes(BOT_HANDLE.toLowerCase());
}

/**
 * Parse a mention comment and return a structured TA response.
 * @param {string} text - raw comment text
 * @returns {MentionResponse | null}
 */
async function handleMention(text) {
  if (!isMention(text)) return null;

  const asset  = extractAsset(text);
  const intent = extractIntent(text);

  if (!asset) {
    return {
      type: 'error',
      message: "I couldn't identify an asset in your message. Try: @tradebot should I long BTC?",
    };
  }

  try {
    // Run analysis on 1H and 4H for confluence
    const [candles1H, candles4H, ticker] = await Promise.all([
      fetchCandles(asset, '1H', 300),
      fetchCandles(asset, '4H', 300),
      fetchTicker(asset),
    ]);

    const ta1H = analyze(candles1H, '1H');
    const ta4H = analyze(candles4H, '4H');

    return buildMentionResponse({ asset, ticker, ta1H, ta4H, intent });
  } catch (err) {
    console.error('[mentionParser] Analysis failed:', err.message);
    return {
      type: 'error',
      message: `Analysis failed for ${asset}. Please try again shortly.`,
    };
  }
}

function extractAsset(text) {
  const upper = text.toUpperCase();
  for (const [key, symbol] of Object.entries(ASSET_MAP)) {
    if (upper.includes(key)) return symbol;
  }
  // Match raw XXXUSDT pattern
  const match = upper.match(/([A-Z]{2,6}USDT)/);
  return match ? match[1] : null;
}

function extractIntent(text) {
  const lower = text.toLowerCase();
  if (lower.includes('long') || lower.includes('buy') || lower.includes('bullish')) return 'long';
  if (lower.includes('short') || lower.includes('sell') || lower.includes('bearish')) return 'short';
  if (lower.includes('wait') || lower.includes('hold')) return 'wait';
  return 'general';
}

function buildMentionResponse({ asset, ticker, ta1H, ta4H, intent }) {
  const bias4H = ta4H.bias;
  const bias1H = ta1H.bias;

  // Check confluence
  const confluence = bias4H === bias1H ? `Both timeframes align: ${bias4H}` : `Mixed: 4H ${bias4H}, 1H ${bias1H}`;

  const sr = ta1H.structure.supportResistance;
  const price = ticker.price;

  // Build setup only if bias is clear
  let setup = null;
  if (bias4H !== 'Neutral / Wait') {
    const dir = bias4H === 'Bullish' ? 'Long' : 'Short';
    const buffer = price * 0.003;
    const entry = dir === 'Long' ? `${round(price - buffer)} – ${round(price + buffer)}` : `${round(price - buffer)} – ${round(price + buffer)}`;
    const stop  = dir === 'Long' ? (sr.nearestSupport || round(price * 0.985)) : (sr.nearestResistance || round(price * 1.015));
    const t1    = dir === 'Long' ? (sr.nearestResistance || round(price * 1.025)) : (sr.nearestSupport || round(price * 0.975));
    const t2    = dir === 'Long' ? round(price * 1.05) : round(price * 0.95);

    setup = { direction: dir, entry, stop, targets: [t1, t2] };
  }

  return {
    type: 'analysis',
    asset,
    currentPrice: price,
    intent,
    overview: [
      `Trend (4H): ${ta4H.structure.trend}`,
      `Trend (1H): ${ta1H.structure.trend}`,
      `EMA: Price ${price > ta1H.indicators.ema.ema200 ? 'above' : 'below'} 200 EMA | ${price > ta1H.indicators.ema.ema50 ? 'above' : 'below'} 50 EMA`,
      `RSI (1H): ${ta1H.indicators.rsi.value} — ${ta1H.indicators.rsi.signal}`,
      `MACD (1H): ${ta1H.indicators.macd.crossover.replace('_', ' ')}`,
      `Volume: ${ta1H.indicators.volume.signal}`,
      `Confluence: ${confluence}`,
    ],
    bias: bias4H,
    setup,
    riskNote: [
      'Wait for candle close confirmation before entering.',
      'Avoid overleveraging — manage position size carefully.',
      DISCLAIMER,
    ],
  };
}

function round(n, d = 2) {
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

module.exports = { isMention, handleMention };
