# Trading Bot — Plan vs Implemented (Living Doc)

> Maintained by AI on every push. Section 1 = frozen plan. Section 2 = what is actually built. Section 3 = why we chose everything.

---

## 1. PLAN (Frozen scope for college project)

### Goal
Working end-to-end paper-trading bot app. Simple for user, world-class UI, best practices, deploys free on Vercel (frontend) + Render (backend). Must look professional — not too complex, not cheap.

### Monorepo layout
```
trading-bot/
  client/  -> Next.js 14 App Router (Vercel)
  server/  -> Node Express API (Render)
  PROJECT_PLAN.md (this file)
```

### Features (MVP must-have)
- [ ] Auth (JWT register/login, $100k virtual cash seed)
- [ ] Dashboard (portfolio value, P&L, win-rate, active bots, recent trades)
- [ ] Markets (live BTC/ETH/SOL/BNB prices via Binance WS + REST, candlestick chart)
- [ ] Bots (3 presets: SMA Crossover, RSI Mean-Reversion, MACD Trend; start/stop, capital, SL/TP)
- [ ] Paper execution engine (simulated market orders, 0.1% fee, cron every 20s)
- [ ] Backtesting (historical klines, returns, max drawdown, equity curve)
- [ ] Portfolio + Trade history + CSV export
- [ ] Risk guards (1 position per bot, SL/TP auto-sell, daily loss cap)

### Out of scope (to stay simple)
Real money, futures/leverage, custom Pine-script editor, email/SMS alerts, leaderboard.

### Deploy targets
- Frontend: Vercel, root `client/`
- Backend: Render free web service, root `server/`, `npm start`
- DB: MongoDB Atlas M0 free

---

## 2. IMPLEMENTED (Updated every push)

### 2026-09-25 — Phase 1 Scaffold (verified locally)
- [x] Monorepo `client/` + `server/` structure created
- [x] `PROJECT_PLAN.md` living doc created
- [x] Backend: Express + Mongoose models (User, Bot, Trade, Portfolio, Backtest) + JWT auth + Binance service + indicator lib + botEngine (node-cron 20s) + backtestEngine + 6 route groups
- [x] Frontend: Next.js 14 + Tailwind + App Router pages (dashboard, login, markets/[symbol], bots, backtest, history) + api client + dark trading theme
- [x] Root README, .gitignore, render.yaml, vercel deploy notes
- Verified: `GET /api/health` returns ok, `next build` compiles 7 routes ok, backtest engine SMA +5.33% / MACD +5.61% on synthetic data (3 trades each).
- Fixes applied: node-cron import (was `cron`), frontend `../../lib/api` paths.
- Status: runs locally with `npm install` in each folder. DB works with Atlas; falls back to in-memory demo mode if `MONGO_URI` missing so demo never breaks.
- Next: seed demo user, deploy to Render + Vercel, record URLs here.

---

## 3. WHY WE CHOSE EVERYTHING (Reason for each decision)

| Decision | Choice | Why (simple reason) |
|---|---|---|
| Market: Crypto paper trading | BTC/ETH/SOL/BNB on USDT | Easiest to understand + implement. Free live data with no API keys, 24x7 so demo works anytime in college. Stocks need broker keys + market-hours handling. |
| Paper trading, not real money | Virtual $100k | Safe for college, no legal/broker risk, professors can click Start/Stop without fear. Still teaches real order flow. |
| Backtesting included | Historical klines replay | Every real trading bot must prove strategy on past data. Shows graphs, P&L, drawdown — looks impressive but code is just a loop. |
| Stack: Next.js + Node Express | Single language JS | You picked it + fastest to build. One language for full project, huge free docs. Python FastAPI would be better for ML but overkill + harder deploy on Render free. |
| DB: MongoDB Atlas + JWT | M0 free + custom auth | You picked it. Document DB fits trades/bots JSON shape, free 512MB is enough for project. JWT keeps backend stateless (Render free sleeps, no session loss). Supabase would be simpler but you wanted MERN-style skill to show. |
| Data: Binance Public API | REST + WS, CoinGecko fallback | Free, no key, high rate limits, candlestick history built-in. Yahoo Finance is delayed + flaky for crypto. |
| Charts: lightweight-charts + Recharts | TradingView lib | Free, fast, looks like real exchange. Chart.js looks cheap for trading. |
| Deploy: Vercel (frontend) + Render (backend) | Free tiers | You required it. Vercel is best for Next.js (0 config). Render runs Node always-on-ish with free sleep; UptimeRobot ping keeps it awake for demo. |
| Styling: Tailwind + shadcn-style | Dark theme, Inter font | World-class look with minimal code. Dark green/red P&L colors = instant "trading" feel without complexity. 5 pages only to stay simple. |
| Bot loop: node-cron 20s polling | Not WebSocket per-bot | Simple, survives Render sleep, easy to explain in viva: "every 20s check indicator → signal → paper trade". |
| Fee 0.1% + SL/TP + 1 position/bot | Risk guards | Teaches real risk management, prevents demo blowing up, 3 lines of code each. |
| Monorepo, not 2 repos | One GitHub repo | One push deploys both, easier for evaluation + viva. Separate repos confuse professors. |
| Virtual cash $100k USDT | Not INR | Crypto pairs are in USDT, so P&L math stays clean (no FX conversion). Easy to say "demo dollars". |

### Viva one-liners (use these)
- "We used paper trading so no real money risk but real market data."
- "Strategies are classic SMA/RSI/MACD — standard textbook indicators."
- "JWT + bcrypt + validation + 0.1% fee + SL/TP shows best practices."
- "Free-tier architecture proves cost-efficient engineering."
