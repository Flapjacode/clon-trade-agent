/**
 * api.js
 * Frontend API client for Clon Trade Agent.
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data;
}

export const api = {
  // Signals
  getActiveSignals:  ()           => request('/api/signals/active'),
  getTodaysSignals:  ()           => request('/api/signals/today'),
  getClosedSignals:  (limit = 50) => request(`/api/signals/closed?limit=${limit}`),
  getPerformance:    (since)      => request(`/api/performance${since ? `?since=${since}` : ''}`),

  // Analysis
  analyze: (symbol, timeframe = '1H') => request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ symbol, timeframe }),
  }),

  // Mentions
  mention: (text) => request('/api/mention', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),

  // Support
  support: (message, sessionId) => request('/api/support', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId }),
  }),

  // Ticker
  ticker: (symbol) => request(`/api/ticker/${symbol}`),
};
