# TradePilot — Build Log: Plan vs Implemented + Decision Log

> Last updated: 2026-09-25 | Status: Phase 1 complete, verified locally | Branch: `main`
> Reviewer note: start with `README.md`, then `DOCUMENTATION.md` (full guide in plain words), then §1, §3, §6 below. This file tracks what was planned, what shipped, and why each technical choice was made.

---

## 1. OVERVIEW

TradePilot is an end-to-end crypto paper-trading platform. Users receive $100,000 in virtual cash, configure rule-based bots on live market data across BTC/ETH/SOL/BNB, and validate strategies with historical backtests before risking capital (even virtual). No real money, no broker keys.

Scope priorities for this assignment: working user journey (register → create bot → start → see trades → backtest), clean monorepo a reviewer can run in 10 minutes, free-tier deploys (Vercel + Render + Atlas), and a UI that is simple without looking trivial.

## 2. PLAN (agreed scope)

### 2.1 MVP checklist
- [x] Auth — register/login (JWT), $100k seed balance
- [x] Dashboard — portfolio value, P&L, win rate, active bots, recent trades
- [x] Markets — live quotes + candlestick charts (4 symbols)
- [x] Bots — 3 preset strategies, start/stop/delete, capital, SL/TP
- [x] Paper execution engine — simulated fills, 0.1% fee, 20s scheduler
- [x] Backtesting — returns, max drawdown, win rate, equity curve
- [x] Portfolio + trade history + CSV export
- [x] Risk guards — single position per bot, SL/TP auto-exit
- [ ] Follow-ups — daily loss-cap enforcement, CoinGecko fallback, WS streaming, persisted backtest records, auth-guard redirects + mobile nav polish

### 2.2 Non-goals (intentional)
Real-money execution, futures/leverage, custom scripting language, email/SMS alerting, social leaderboard, fiat conversion. Each would expand review surface without strengthening the core trading loop.

### 2.3 Deploy targets
- Frontend: Vercel, root `client/`
- Backend: Render web service, root `server/`, `npm install` → `npm start`
- Database: MongoDB Atlas M0

## 3. IMPLEMENTED (what is in the repo today)

### 3.1 Phase 1 — 2026-09-25 (verified)
Backend (`server/`):
- `src/index.js` — Express app, CORS allowlist, request logging, 6 routers, `GET /api/health`, starts scheduler
- `src/config/db.js` — Mongoose connect; in-memory fallback when `MONGO_URI` is absent so the API stays reviewable without a database
- `src/models/User.js`, `Bot.js`, `Trade.js`, `Backtest.js` — schemas with enums and user scoping
- `src/middleware/auth.js` — `Authorization: Bearer <jwt>` verification
- `src/services/binance.js` — `getPrice` / `get24h` / `getKlines` against `https://api.binance.com` with 5–15s cache
- `src/services/indicators.js` — SMA(9/21 cross), RSI(14, 30/70), MACD(12,26,9) via `technicalindicators`
- `src/services/backtestEngine.js` — `runBacktest({klines, strategy, capital})` event loop
- `src/services/botEngine.js` — `node-cron` 20s `tick()`: signal → paper fill → SL/TP check; DB or `mem` store
- `src/routes/auth.js`, `market.js`, `bots.js`, `portfolio.js`, `trades.js`, `backtest.js`
- `src/seed.js` — `demo@tradepilot.app / demo1234` + sample BTC bot (`npm run seed`)

Frontend (`client/`):
- `app/layout.js` + sidebar nav, `app/page.js` dashboard (stat cards, live quotes, recent trades), `app/globals.css` dark trading theme
- `app/login/page.js` (login/register toggle), `app/markets/[symbol]/page.js` (lightweight-charts candles), `app/bots/page.js` (create + start/stop/delete), `app/backtest/page.js` (form + results + Recharts equity curve), `app/history/page.js` (filterable table + CSV export)
- `lib/api.js` — axios instance, base URL from `NEXT_PUBLIC_API_URL`, JWT interceptor

Root: `package.json` (workspace helpers), `.gitignore` (node_modules, `.next`, `.env*`), `render.yaml`, `README.md`.

### 3.2 Verification (actually executed)
- `GET /api/health` → `{"ok": true}` — passed
- `next build` → 7 routes compiled with no webpack errors — passed
- Backtest on synthetic 100-candle series: SMA_CROSS +5.33% (3 trades), MACD_TREND +5.61% (3 trades), RSI_MEAN 0 trades (correct: monotonic ramp never hits 30/70 extremes) — passed
- `.gitignore` check: `server/node_modules`, `client/.next`, `server/.env`, `client/.env.local` all ignored; secrets never committed

### 3.3 Phase 2 — Signature UI redesign + full smoke test (2026-09-25, verified)
- Frontend rebuilt around a custom "pulse terminal" identity: Space Grotesk display + Inter body + JetBrains Mono numerals, ink background with aurora wash + film grain, hand-drawn SVG pulse mark (no emoji, no kit components).
- New shell (`app/shell.js`): 76px icon rail, live ticker tape (20s refresh), sticky top bar, mobile bottom tabs. Shared primitives in `components/ui.js` (Sparkline, Sigil, Verdict, TickerTape, Empty).
- Pages: dashboard bento (net-worth hero + exposure rail + executions ledger + coin cards with sparklines), terminal-style market page with launch ticket, strategy-dossier bot floor with SL/TP rail visual + tactile switch, lab-bench backtest with verdict banner + worst-print marker, filterable ledger with CSV, split-screen login with brand panel.
- Fixed corrupted `.next` cache (stale webpack chunks from interrupted build); clean `next build` → 7 routes, `BUILD_ID` present.
- Backend smoke: `GET /api/health` → `{ok:true}`; `GET /api/market/prices` → 4 symbols live (BTCUSDT @ $83,912 at test time).
- Frontend smoke (prod `next start :3100`): `/`, `/bots`, `/login`, `/backtest`, `/history`, `/markets/BTCUSDT` → all HTTP 200 with TradePilot brand present.

### 3.4 Phase 3 — Audit hardening + Atlas live + Next CVE patch (2026-09-25, verified)
Backend fixes (all verified against Atlas unless noted):
- CRITICAL: bad `MONGO_URI` no longer crashes the API — `connectDB` fails fast (5s `serverSelectionTimeoutMS`) and boot falls back to in-memory mode with a log line. Proven: booted with `mongodb://bad-host` → `/api/health` ok.
- Bots: `POST /` now validates strategy/symbol/timeframe whitelists, capital ≥ 100, SL 0–50, TP 0–200, name ≤ 60 chars → 400 on garbage (was: zombie bots accepted). `PATCH/DELETE :id` guard malformed ObjectIds → 404 instead of CastError 500.
- Backtest: same whitelists + capital floor → 400 (was: silent HOLD / broken math).
- Market: `interval` whitelisted, `symbol` format-checked → 400 (was: Binance error leaked as 500).
- Auth: login now returns 400 on invalid input (was: skipped `validationResult`); emails trimmed + lowercased on register/login (was: case-dupe accounts possible).
- Portfolio: mem-mode `recent` now newest-first (was: oldest 10); P&L baseline uses `PAPER_CASH` env (was: hardcoded 100000).
- Scheduler: `tick()` list-failures and rejections are caught — a DB flap can no longer kill the Render process.
- Added JSON 404 for unknown `/api/*` routes.
Frontend fixes:
- Next.js 14.2.5 → 14.2.35 (published CVE patch branch); clean rebuild → 7 routes, `BUILD_ID` valid. Note: an aborted `npm install` had left `node_modules/.bin` broken (`'next' is not recognized`) — repaired with full reinstall.
- Added sign-out (rail icon when authed, clears token + redirects) — previously no logout existed.
- Axios 401 interceptor drops dead tokens so UI falls back to signed-out state.
- Market terminal shows an explicit feed-error banner instead of a blank chart on fetch failure.
DB live verification (Atlas `tradingbot`): seed created `demo@tradepilot.app / demo1234` + sample bot; login → portfolio ($100,000) → backtest BTC/SMA +7.5% (22 trades on live klines) → bot lifecycle create → start(active) → stop(stopped) → delete(ok) → trades readable. All HTTP expectations met (400/404/200).
`.env` with Atlas URI + generated JWT secret lives only in `server/.env` (gitignored, never committed — re-verified with `git check-ignore`).

### 3.5 Phase 4 — Status-code console logging + CORS hardening (2026-09-25, verified)
- **Every API call now logs one line ending in its status code:** `2026-09-25T…Z | GET /api/health → 200 (2.1 ms)` — ISO timestamp, color by class (2xx green, 3xx cyan, 4xx yellow, 5xx red) so failures jump out in Render logs. Verified live: 200/401/404/400/403 lines all print correctly, stderr empty.
- **CORS is typo-proof:** origins are trimmed + trailing slashes stripped at boot, so Render `CLIENT_URL=https://…vercel.app/` (the exact value that broke login) now works identically to the slash-free form. Multi-origin comma lists supported; optional `CLIENT_ALLOW_PREVIEW=true` admits `*.vercel.app` preview deploys. Blocked origins get a clean `403 {error:'Origin not allowed'}` + one log line — no longer a misleading 500 with stack. Boot prints `[cors] allowed origins: …` for debuggability.
- Local `server/.env`: `CLIENT_URL=http://localhost:3000,https://trading-bot-sigma-six.vercel.app` (both dev + prod).
- Verified matrix (fresh boot on :5050): Vercel origin → 200 + correct `Access-Control-Allow-Origin`, localhost → 200, evil → 403, no-token → 401, unknown → 404, bad interval → 400.
- Bonus: `EADDRINUSE` now prints one clear line (`port X already in use — stop the other server or set PORT=5050`) instead of a crash dump. (Found while testing: the user's own `npm run dev` still held :5000 — all "mystery" failures were port collisions, no code bug.)

### 3.6 Phase 5 — Playwright E2E suite, 17/17 green (2026-09-25, verified)
- `client/playwright.config.js` (chromium, serial, 90s timeout) + `client/e2e/api.spec.js` (10 tests: health, JSON 404, 401 matrix, login 400, 4 live prices, klines, market 400s, backtest 400 + happy path, full bot lifecycle incl. malformed-id 404) + `client/e2e/app.spec.js` (7 tests: shell on all 6 routes, form login → Desk, authed portfolio unlock, UI bot deploy → start → stop → retire with dialog accept + cleanup, lab verdict + equity chart, ledger UI, candle canvas + timeframe switch).
- Run: `cd client; npm run test:e2e` (targets running dev servers on :3000/:5000; `E2E_WEB_URL`/`E2E_API_URL` override; webServer entries boot them if absent). Result: **10 passed (3.5s) + 7 passed (35.1s)** vs live Atlas + Binance. One transient flake seen (demo login during a `--watch` reload); clean on rerun.
- Added `@playwright/test` devDependency + `test:e2e` script; browsers live outside the repo (`ms-playwright` cache).

### 3.7 Phase 6 — Prod E2E + Binance geo-failover (2026-09-25)
- Prod API suite vs Render: 7/10 pass (health, auth, validation, bot lifecycle all green). The 3 failures were all Binance-dependent: `/market/prices` returned zeros, `/klines` 500.
- Root cause: `api.binance.com` geo-blocks US datacenter IPs (HTTP 451) — Render Oregon egress is blocked, while local dev works fine.
- Fix in `server/src/services/binance.js`: transparent host failover — try `api.binance.com` (or `BINANCE_HOST` override), fall back to `api.binance.us` (identical REST shape, all 4 symbols listed). Failover logs `[binance] failover in use`. Verified locally: forced dead primary → `.us` served live ETH price + BTC klines; normal path still hits `.com` first.
- Local API suite re-run after fix: 10/10. Awaiting push + Render redeploy, then prod re-run (API + UI suites).
Frontend dev-log review (Next 14.2.35 `next dev`): all 6 routes compile clean — zero warnings, zero errors, zero stderr output; `GET / /bots /login /backtest /history /markets/BTCUSDT` → all 200. Backend log review: pre-login 401s are correct signed-out behavior; post-login portfolio/bots/trades/backtest 200; bot start→stop→delete lifecycle 200; `- - ms - -` lines are aborted prefetch/StrictMode requests (harmless); 304s are Express ETag revalidations (harmless).

### 3.5 Known gaps (stated so reviewers see judgment, not oversights)
- No production URLs yet — Vercel/Render not connected; `NEXT_PUBLIC_API_URL` still points at localhost
- `Backtest` model defined but results are returned, not persisted — persistence is a follow-up
- Market data is REST polling only (no WebSocket streaming, no CoinGecko fallback)
- Daily loss cap is specified but not yet enforced in `tick()`
- Frontend shows an inline hint on 401 instead of a route guard — acceptable for review, polish scheduled

## 4. DATA SOURCE

Live data comes exclusively from the **Binance public REST API** (`server/src/services/binance.js`). No keys required.

| Need | Endpoint | Function |
|---|---|---|
| Live price (scheduler, valuation) | `GET /api/v3/ticker/price?symbol=` | `getPrice()` |
| Quote cards | `GET /api/v3/ticker/24hr?symbol=` | `get24h()` |
| Candles, signals, backtests | `GET /api/v3/klines?symbol=&interval=&limit=` | `getKlines()` |

The browser never contacts Binance. Path: `client/lib/api.js` → `GET /api/market/*` (`server/src/routes/market.js`) → `binance.js` → Binance. A short-lived in-memory cache (5s prices, 15s quotes/klines) keeps Render's free tier inside rate limits. Tracked symbols: `BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT`. CoinGecko was evaluated and rejected as primary (aggressive free-tier limits, no native kline shape); it remains a candidate fallback.

## 5. ARCHITECTURE AND REQUEST FLOW

```
[Next.js — Vercel] -- REST + JWT --> [Express — Render] -- Mongoose --> [MongoDB Atlas]
        |                                     |
        +-- /api/market/* (Binance proxy)     +-- node-cron tick() every 20s
        +-- candles + equity charts           +-- signal → simulated fill → SL/TP
```

- Register: validate → bcrypt-10 hash → persist → issue JWT (7d) → client stores token, axios attaches `Bearer` header.
- Bot lifecycle: `POST /api/bots` (stopped) → `PATCH /api/bots/:id/start` (active) → scheduler picks it up → `PATCH .../stop` or `DELETE`.
- Scheduler tick per active bot: fetch klines → compute signal → BUY allocates full capital (minus fee) into qty, SELL liquidates full qty (minus fee); SL/TP breach forces a `SELL (SL/TP)` and parks the bot as stopped.
- Backtest: `POST /api/backtest {symbol, strategy, timeframe, capital}` → fetch up to 500 klines → replay → JSON result. Live-only concern (SL/TP) is intentionally excluded from replay math and documented in §8.

## 6. DECISION LOG (why each choice — explainable in review)

| Decision | Choice | Rationale | Rejected alternative |
|---|---|---|---|
| Crypto paper trading, USDT | BTC/ETH/SOL/BNB, $100k virtual | Free keyless data, 24/7 market (reviewable anytime), P&L math stays in quote currency | Equities (broker keys, market-hours gating, delayed free feeds) |
| Next.js 14 App Router | `client/` on Vercel | Zero-config Vercel deploy, file-based routing keeps 5 pages obvious, production build proves quality | Vite SPA (fine, but weaker deploy story for this assignment) |
| Express + Mongoose | `server/` on Render | Single JS codebase, deep hiring-pool familiarity, Render free tier runs Node reliably | Python/FastAPI (stronger for quant libs, heavier deploy + second language for one assignment) |
| MongoDB Atlas + JWT | M0 + stateless auth | Trade/bot payloads are naturally documents; JWT survives Render free-tier sleeps where server sessions would not | Session store / Supabase (viable; Atlas chosen for document fit and explicit schema control) |
| Binance REST | Prices + klines | Keyless, generous limits, native OHLCV shape for both charts and backtests | Yahoo Finance (delayed, equity-centric), CoinGecko primary (rate limits) |
| lightweight-charts + Recharts | Candles + equity | Exchange-grade candles; Recharts for the single equity line — avoids a generic chart look | Chart.js-only (reads as non-trading) |
| Tailwind dark theme | Slate + emerald/red semantics | Professional trading feel from a small utility set (`.card/.btn/.input`) | Component kit (heavier, less distinctive) |
| 20s polling scheduler | `node-cron` | Deterministic, sleep-tolerant, trivially explainable in review | Per-bot WebSockets (fragile on free tier, harder to reason about fills) |
| 0.1% fee, 1 position/bot, SL/TP | Risk controls | Mirrors Binance spot fees; prevents degenerate demo states with minimal code | Leverage/margin (out of scope, magnifies review risk) |
| Monorepo | `client/` + `server/` | One clone, one review, correlated deploys | Two repos (splits the narrative) |

## 7. PROJECT STRUCTURE

```
Trading-bot-/
  PROJECT_PLAN.md   build log + decision log (this file)
  README.md         setup, deploy, design notes
  .gitignore        node_modules, .next, .env, .env.local, logs
  package.json      workspace helper scripts
  render.yaml       Render service definition
  server/
    package.json  express, mongoose, jsonwebtoken, bcryptjs, axios, node-cron, technicalindicators, ...
    .env.example  PORT, MONGO_URI, JWT_SECRET, CLIENT_URL, PAPER_CASH, FEE_PCT
    src/index.js  app wiring
    src/config/db.js  src/middleware/auth.js
    src/models/User.js  Bot.js  Trade.js  Backtest.js
    src/services/binance.js  indicators.js  backtestEngine.js  botEngine.js
    src/routes/auth.js  market.js  bots.js  portfolio.js  trades.js  backtest.js
    src/seed.js
  client/
    package.json  next 14, react 18, axios, lightweight-charts, recharts, tailwind
    .env.example  NEXT_PUBLIC_API_URL
    app/layout.js  page.js  globals.css
    app/login/page.js  markets/[symbol]/page.js  bots/page.js  backtest/page.js  history/page.js
    lib/api.js
```

## 8. STRATEGIES, BACKTEST MATH, AND RISK (exact — point reviewers here)

- `SMA_CROSS (9/21)`: fast-minus-slow flips negative→positive = BUY, positive→negative = SELL. Trend-following.
- `RSI_MEAN (14, thresholds 30/70)`: RSI < 30 = BUY (oversold), > 70 = SELL (overbought). Range-trading.
- `MACD_TREND (12,26,9)`: MACD-minus-signal flips negative→positive = BUY, reverse = SELL. Momentum.
- Otherwise HOLD. Minimum ~30 candles before signals are valid. One open position per bot by design.
- Backtest (`backtestEngine.js`): iterate candles from index 30; BUY commits all cash minus fee to qty; SELL liquidates all qty minus fee; equity = cash + qty × price; track peak and max drawdown; round to 2dp; downsample equity 5:1; return last 50 trades plus `{final, returnsPct, maxDrawdownPct, totalTrades, winRatePct}`.
- Live risk (`botEngine.js`): before signal logic, check open position against `stopLossPct` (default 2) / `takeProfitPct` (default 4); breach → market SELL tagged `SL/TP`, position cleared, bot parked as stopped.

## 9. API CONTRACT

```
GET  /api/health
POST /api/auth/register {name,email,password} → {token,user}
POST /api/auth/login {email,password} → {token,user}
GET  /api/market/prices → [{symbol,price,changePct,high,low,volume}]
GET  /api/market/klines/:symbol?interval=1h&limit=200 → [{openTime,open,high,low,close,volume}]
GET  /api/market/price/:symbol → {symbol,price}
GET  /api/bots (auth) → [bots]
POST /api/bots (auth) {name,symbol,strategy,timeframe,capital,stopLossPct,takeProfitPct} → {bot}
PATCH /api/bots/:id/start|stop (auth) → {bot}
DELETE /api/bots/:id (auth) → {ok:true}
GET  /api/portfolio (auth) → {cash,openValue,total,pnl,activeBots,winRate,recent}
GET  /api/trades?botId= (auth) → [trades]
POST /api/backtest (auth) {symbol,strategy,timeframe,capital} → {final,returnsPct,maxDrawdownPct,winRatePct,equity,trades}
```

Authenticated routes require `Authorization: Bearer <jwt>` and are always scoped to the token's user id.

## 10. LOCAL SETUP AND DEPLOY

```bash
# backend
cd server
cp .env.example .env   # MONGO_URI, JWT_SECRET (long random), CLIENT_URL=http://localhost:3000
npm install
npm run dev            # http://localhost:5000/api/health

# frontend (new terminal)
cd client
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:3000
```

Server env: `PORT=5000, MONGO_URI=…, JWT_SECRET=…, CLIENT_URL=…, PAPER_CASH=100000, FEE_PCT=0.001`. Client env: `NEXT_PUBLIC_API_URL=…/api`. Without `MONGO_URI` the API runs in-memory mode (auth/bots/trades work, data resets on restart) — deliberate so reviewers can run it with zero setup.

Deploy: Vercel → root `client/`, env `NEXT_PUBLIC_API_URL=https://<api>.onrender.com/api`. Render → root `server/`, build `npm install`, start `npm start`, Node 20, env `MONGO_URI, JWT_SECRET, CLIENT_URL=https://<app>.vercel.app`. Atlas → M0, app-IP allowlist, database `tradingbot`. Free-tier Render sleeps after inactivity; `/api/health` is the keep-alive target.

## 11. SECURITY AND ENGINEERING NOTES

bcrypt-10 password hashing, 7-day JWTs with per-route verification, request validation on auth inputs, CORS restricted to `CLIENT_URL`, request logging, centralized error handler, user-scoped queries on every data route, enum-constrained schemas, secret-free repo (`.gitignore` verified for `.env*`), explicit fee and quantity math (no negative-qty path).

## 12. REVIEW TALKING POINTS (30-second versions)

- "Paper trading on real market data — same order lifecycle as live, zero custodial or compliance risk."
- "Three canonical strategies, not black boxes — each signal is five lines you can audit."
- "Market data is proxied and cached server-side, so the UI has a stable contract and the free tier stays in rate limits."
- "Risk is server-enforced: one position per bot, explicit fees, SL/TP exits."
- "Backtests replay the same signal functions as live trading, so results and behavior can't drift apart."

## 13. NEXT STEPS

1. Connect Vercel + Render + Atlas; record URLs here.
2. Persist backtest runs (`Backtest` model exists) with strategy-comparison view.
3. Add CoinGecko fallback and WebSocket price streaming.
4. Enforce daily loss cap; add frontend route guards, loading states, mobile nav.
