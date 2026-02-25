# Clon Trade Agent — API Reference

Base URL: `http://localhost:3000`

---

## Signals

### GET /api/signals/active
Returns all currently open signals.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "asset": "BTCUSDT",
      "direction": "Long",
      "entry_low": 62100,
      "entry_high": 62300,
      "stop_loss": 61400,
      "target_1": 63500,
      "target_2": 64200,
      "timeframe": "1H",
      "rr_ratio": "1:2.3",
      "status": "Open",
      "reasoning": "Bounce from 200 EMA + RSI oversold on 1H",
      "disclaimer": "This analysis is for informational purposes only...",
      "created_at": "2025-01-01T08:00:00Z"
    }
  ]
}
```

---

### GET /api/signals/today
Returns signals generated today.

---

### GET /api/signals/closed?limit=50
Returns closed/completed signals (newest first).

---

### PATCH /api/signals/:id/status
Updates signal status. Only status changes are permitted — no other fields.

**Body:**
```json
{ "status": "TP1 Hit", "resultPct": 2.5 }
```

**Valid statuses:** `Open`, `TP1 Hit`, `TP2 Hit`, `SL Hit`, `Closed`, `Invalidated`

---

## Analysis

### POST /api/analyze
Run on-demand technical analysis for any asset.

**Body:**
```json
{ "symbol": "BTCUSDT", "timeframe": "1H" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "1H",
    "currentPrice": 62250,
    "indicators": {
      "ema": { "ema9": 62100, "ema21": 61800, "ema50": 60500, "ema200": 57000 },
      "rsi": { "value": 62, "signal": "neutral" },
      "macd": { "macd": 120, "signal": 95, "histogram": 25, "crossover": "bullish" },
      "volume": { "current": 1250000, "avg20": 980000, "ratio": 1.28, "signal": "average" }
    },
    "structure": {
      "trend": "uptrend (HH + HL)",
      "supportResistance": { "nearestSupport": 61400, "nearestResistance": 63500 }
    },
    "bias": "Bullish",
    "summary": ["Trend: uptrend (HH + HL)", "EMA: Price above 200 EMA..."],
    "disclaimer": "This analysis is for informational purposes only..."
  }
}
```

---

### POST /api/mention
Parse and respond to an @tradebot comment.

**Body:**
```json
{ "text": "@tradebot should I long BTC?" }
```

---

## Performance

### GET /api/performance?since=2025-01-01
Returns aggregated performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSignals": 48,
    "wins": 31,
    "losses": 12,
    "winRate": 72.09,
    "avgResult": 1.85,
    "maxDrawdown": -3.2
  }
}
```

---

## Support

### POST /api/support
Send a message to the Clon support agent.

**Body:**
```json
{ "message": "How do I set a stop loss?", "sessionId": "session_123" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "To set a stop loss on this platform...",
    "sessionId": "session_123"
  }
}
```

---

## Ticker

### GET /api/ticker/:symbol
Fetch live price data.

**Example:** `GET /api/ticker/BTCUSDT`

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "price": 62250.50,
    "change24h": 2.34,
    "volume24h": 1850000000
  }
}
```
