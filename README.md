# TradePilot — Crypto Paper-Trading Bot

End-to-end paper-trading platform: live market data, rule-based bots, backtesting, and portfolio analytics.

**Stack:** Next.js 14 (Vercel) + Express + Mongoose (Render) + MongoDB Atlas. Live data from Binance public REST API. No API keys required.

See `PROJECT_PLAN.md` for build log (Plan vs Implemented) and decision rationale.

## Features

- JWT auth (register/login), $100,000 virtual cash per account
- Dashboard: portfolio value, P&L, win rate, active bots, recent trades
- Markets: live BTC/ETH/SOL/BNB quotes + candlestick charts
- Bots: 3 strategies (SMA Crossover, RSI Mean-Reversion, MACD Trend) with start/stop, capital allocation, stop-loss / take-profit
- Paper execution engine: simulated fills at live prices, 0.1% fee, 20s scheduler loop
- Backtesting: historical replay with returns, max drawdown, win rate, equity curve
- History + CSV export, per-bot trade filtering

## Quick start

```bash
# backend
cd server
cp .env.example .env   # set MONGO_URI, JWT_SECRET, CLIENT_URL
npm install
npm run dev            # http://localhost:5000/api/health

# frontend (new terminal)
cd client
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:3000
```

Seed a demo account (requires `MONGO_URI`):

```bash
cd server
npm run seed   # demo@tradepilot.app / demo1234 + sample BTC bot
```

## Deploy

- **Vercel (frontend):** import repo, Root Directory `client/`, env `NEXT_PUBLIC_API_URL=https://<api>.onrender.com/api`
- **Render (backend):** New Web Service, Root Directory `server/`, Build `npm install`, Start `npm start`, Node 20, env `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=https://<app>.vercel.app`
- **MongoDB Atlas:** M0 cluster, allowlisted app IPs, database `tradingbot`

## Repo layout

```
client/  Next.js App Router UI (dashboard, markets, bots, backtest, history)
server/  Express API (auth, market proxy, bots, portfolio, trades, backtest, bot scheduler)
PROJECT_PLAN.md  Plan vs Implemented + decision log
render.yaml  Render service definition
```

## Design notes

- Frontend never calls the exchange directly; all market data goes through `GET /api/market/*`, which adds caching (5–15s) and a stable contract for the UI.
- Auth is stateless JWT (7d) + bcrypt-10 hashes; every bot/trade route is scoped to `req.user.id`.
- Risk controls are enforced server-side: single open position per bot, configurable SL/TP auto-exit, full-capital position sizing with explicit fees.
