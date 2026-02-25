# Clon Trade Agent — Architecture

## System Overview

```
User Browser
     │
     ▼
┌─────────────────────────────────────────────┐
│              Next.js App (Port 3000)        │
│  ┌──────────────┐    ┌───────────────────┐  │
│  │   Frontend   │    │   API Routes      │  │
│  │  (React/JSX) │◄──►│  /api/signals/*   │  │
│  │              │    │  /api/mention     │  │
│  │  Dashboard   │    │  /api/analyze     │  │
│  │  SignalCards │    │  /api/support     │  │
│  │  SupportChat │    │  /api/performance │  │
│  └──────────────┘    └────────┬──────────┘  │
└───────────────────────────────┼─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Market Data │    │   TA Engine      │    │   Claude API     │
│  Service     │    │   (taEngine.js)  │    │   (Support Bot)  │
│              │    │                  │    │                  │
│  Binance API │    │  EMA 9/21/50/200 │    │  Conversational  │
│  Bybit (fbk) │    │  RSI, MACD       │    │  Platform Asst.  │
└──────────────┘    │  Volume, S/R     │    └──────────────────┘
                    │  Trend Structure │
                    │  Bias Logic      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   PostgreSQL DB  │
                    │                 │
                    │  signals        │
                    │  mention_log    │
                    │  support_log    │
                    │  performance    │
                    └─────────────────┘
                             ▲
                    ┌────────┘
                    │
          ┌─────────────────┐
          │  Cron Scheduler │
          │  (08:00 UTC/day)│
          │  signalGenerator│
          └─────────────────┘
```

## Data Flow: Daily Signal Generation

1. Cron fires at 08:00 UTC
2. `signalGenerator` iterates watchlist assets
3. `marketData.fetchCandles` → Binance/Bybit OHLCV
4. `taEngine.analyze` → EMA, RSI, MACD, Volume, S/R, Trend
5. Bias classified (Bullish / Bearish / Neutral)
6. Signal constructed with entry, SL, targets, R:R
7. Signal saved to PostgreSQL (immutable)
8. Frontend polls `/api/signals/active` to display

## Data Flow: @tradebot Mention

1. User posts comment with `@tradebot should I long BTC?`
2. Frontend POSTs to `/api/mention`
3. `mentionParser.handleMention` extracts asset + intent
4. Fetches 1H + 4H candles concurrently
5. Runs `taEngine.analyze` on both timeframes
6. Checks confluence between timeframes
7. Returns structured analysis with setup (if clear bias)
8. Logged to `mention_log` table

## Signal Immutability Rules

- Signals are INSERT-only — no DELETE ever
- Status can only move forward: Open → TP1 Hit → TP2 Hit / SL Hit → Closed
- All closed trades remain visible indefinitely
- Performance metrics computed from DB, not cached

## Risk & Compliance Layer

Every API response that involves trade data includes:
- Risk reminder sentence
- "Market conditions change rapidly" notice
- "Not financial advice" disclaimer

This is enforced at the service layer, not just UI.
