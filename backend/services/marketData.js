/**
 * marketData.js
 * Fetches OHLCV candle data and ticker info from Binance REST API.
 * Falls back to Bybit if Binance fails.
 */

const axios = require('axios');

const BINANCE_BASE = 'https://api.binance.com/api/v3';
const BYBIT_BASE = 'https://api.bybit.com/v5/market';

// Map user-facing timeframes to Binance interval strings
const TIMEFRAME_MAP = {
  '5m': '5m',
  '15m': '15m',
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
};

/**
 * Fetch OHLCV candles from Binance.
 * @param {string} symbol  - e.g. 'BTCUSDT'
 * @param {string} timeframe - '5m' | '15m' | '1H' | '4H' | '1D'
 * @param {number} limit   - number of candles (max 1000)
 * @returns {Array<{time, open, high, low, close, volume}>}
 */
async function fetchCandles(symbol, timeframe = '1H', limit = 200) {
  const interval = TIMEFRAME_MAP[timeframe] || '1h';

  try {
    const { data } = await axios.get(`${BINANCE_BASE}/klines`, {
      params: { symbol, interval, limit },
      timeout: 8000,
    });

    return data.map(([time, open, high, low, close, volume]) => ({
      time: Number(time),
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume),
    }));
  } catch (err) {
    console.warn(`[marketData] Binance failed for ${symbol}, trying Bybit...`, err.message);
    return fetchCandlesBybit(symbol, timeframe, limit);
  }
}

/**
 * Bybit fallback for candle data.
 */
async function fetchCandlesBybit(symbol, timeframe, limit) {
  const intervalMap = { '5m': 5, '15m': 15, '1H': 60, '4H': 240, '1D': 'D' };
  const interval = intervalMap[timeframe] || 60;

  const { data } = await axios.get(`${BYBIT_BASE}/kline`, {
    params: { category: 'linear', symbol, interval, limit },
    timeout: 8000,
  });

  if (data.retCode !== 0) throw new Error(`Bybit error: ${data.retMsg}`);

  return data.result.list.reverse().map(([time, open, high, low, close, volume]) => ({
    time: Number(time),
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
    volume: parseFloat(volume),
  }));
}

/**
 * Fetch latest ticker price for a symbol.
 * @param {string} symbol
 * @returns {{ symbol, price, change24h, volume24h }}
 */
async function fetchTicker(symbol) {
  try {
    const { data } = await axios.get(`${BINANCE_BASE}/ticker/24hr`, {
      params: { symbol },
      timeout: 5000,
    });
    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.quoteVolume),
    };
  } catch (err) {
    console.error(`[marketData] Ticker fetch failed for ${symbol}:`, err.message);
    throw err;
  }
}

module.exports = { fetchCandles, fetchTicker };
