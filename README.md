# Clon Trade Agent

An AI-powered trading agent with technical analysis, daily signals, and conversational support.

## Project Structure

```
clon-trade-agent/
├── backend/
│   ├── api/              # REST API routes
│   ├── engine/           # TA indicator engine
│   ├── services/         # Market data, signal logic
│   ├── db/               # Database models & migrations
│   └── utils/            # Helpers, formatters
├── frontend/
│   ├── components/       # React UI components
│   │   ├── signals/      # Signal cards, lists, performance
│   │   ├── analysis/     # TA response display
│   │   ├── support/      # Chat/support UI
│   │   └── ui/           # Shared UI primitives
│   ├── pages/            # Next.js pages
│   ├── styles/           # Global CSS + theme
│   ├── hooks/            # Custom React hooks
│   └── lib/              # API clients, utils
├── config/               # Environment configs
└── docs/                 # Architecture & API docs
```

## Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Node.js / Express (or Next.js API routes)
- **Market Data**: Binance API (primary), Bybit fallback
- **TA Engine**: `technicalindicators` npm package + custom logic
- **Database**: PostgreSQL (signals, logs, performance)
- **AI Layer**: Claude API (analysis, support responses)

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp config/.env.example .env.local

# Run dev server
npm run dev
```

## Features

- ✅ Daily trade signals with full metadata
- ✅ On-demand @tradebot mention analysis
- ✅ Technical analysis engine (EMA, RSI, MACD, Volume, S/R)
- ✅ Performance tracking (win rate, avg R:R, drawdown)
- ✅ Platform support assistant
- ✅ Risk/compliance layer on all outputs
- ✅ Signal transparency — no deletions allowed
