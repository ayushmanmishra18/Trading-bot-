# TradePilot — Complete Project Documentation

> Everything about this project, start to finish, in plain and simple words.
> This document has **two parts** — read only the one you need:
>
> - **PART A — USER MANUAL (§1, §2, §7, §8, §12B–C, §13, §14, §15):** for anyone who *uses* the app. No technical knowledge needed. Sharing with a non-technical user? Send them this file and tell them: "read Part A only, start at §15."
> - **PART B — DEVELOPER DOCUMENTATION (§3, §4, §5, §6, §9, §10, §11, §12A, §12D, §16):** for anyone who *runs, reviews, modifies, or extends* the code — tech stack with reasons, architecture, every file's role, API logic, data flows, testing, deployment.
>
> In a hurry? Users read §15 (30-minute handbook). Developers read §16 (internals) + §6 (file map).

---

# PART A — USER MANUAL (no technical knowledge needed)

> Sections 1–2, 7–8, 12B–C, 13–15. If someone only ever uses the app, everything they need is in this part.

## 1. What is TradePilot?

**One-line answer:** TradePilot is a website where you practise crypto trading with fake money, using real live market prices.

**Slightly longer answer:** You sign up and get **$100,000 in virtual cash** (not real money — just numbers on screen). You then create **trading bots** — small automatic programs that watch the market and buy/sell for you based on rules you pick. You can also **backtest** a strategy, which means: "show me how this strategy would have performed on past market data." Everything runs on **real live prices** from Binance (the world's biggest crypto exchange), so it feels real, but **no real money is ever involved**.

**Who is it for?** Anyone who wants to learn how trading bots work — how they read prices, decide when to buy/sell, manage risk, and how you test a strategy before trusting it.

---

## 2. What can you do in the app? (The user journey)

There are 6 screens. Here is the natural order to use them:

### Step 1 — Login (`/login`)
- Create an account (name, email, password) or sign in.
- New accounts start with **$100,000 virtual cash**.
- Reviewer shortcut: email `demo@tradepilot.app`, password `demo1234` (works after running `npm run seed` on the backend).

### Step 2 — Desk (`/`, the home page)
- Your command centre. At the top you see:
  - **Net worth** — your total virtual money right now (cash + value of open positions).
  - **P&L (Profit & Loss)** — how much you are up or down since you started ($100,000).
  - **Win rate** — out of all completed sell trades, how many made money.
  - **Active bots** — how many bots are currently running.
- Below that: an **exposure bar** showing where your money sits (cash vs coins), a **latest executions** feed (your most recent buy/sell fills), and **market cards** for Bitcoin, Ethereum, Solana and BNB with live prices, 24h change, and mini trend charts. Click any coin to open its terminal.

### Step 3 — Markets (`/markets/BTCUSDT` etc.)
- A full trading terminal for one coin: big **candlestick chart** (each candle = price movement in one time period; green = price went up, red = went down).
- Switch timeframes: `15m`, `1h`, `4h`, `1d`.
- A **launch ticket** on the side: pick a strategy and capital, press one button, and a bot starts trading this coin immediately.

### Step 4 — Bots (`/bots`)
- **Pick a strategy** from 3 ready-made cards (explained in section 7).
- **Fill a deploy ticket:** give the bot a name, a coin, starting capital (e.g. $5,000), a stop-loss % (auto-sell if it drops this much) and a take-profit % (auto-sell if it rises this much).
- Press **Deploy**, then flip the switch to **start** it. From that moment, every 20 seconds the server checks the market and the bot may buy or sell.
- Each bot card shows its status (running/stopped), whether it currently **holds coins or is waiting (flat)**, and a visual of its stop/target safety rails. You can stop or retire (delete) any bot anytime.

### Step 5 — Lab (`/backtest`)
- Before trusting a strategy with (virtual) money, test it on history: pick a coin, strategy, timeframe and stake, press **Run replay**.
- You get a **verdict banner** ("beats buy-and-hold" or "underperforms"), **final value, number of trades, max drawdown** (biggest dip from a peak — explained in section 8), **win rate**, an **equity curve** (a line showing how the money grew/shrank over time, with the worst moment marked), and the last fills from the replay.

### Step 6 — Ledger (`/history`)
- Every single buy/sell your bots ever made, newest first: time, coin, side (BUY/SELL), quantity, price, profit/loss, and reason (strategy name or `SL/TP` for safety exits).
- Filter by BUY/SELL or search a coin, and **export everything to CSV** (a spreadsheet file) with one click.

---

# PART B — DEVELOPER DOCUMENTATION (for building, reviewing, extending)

> Sections 3–6, 9–11, 12A, 12D, 16. Assumes basic JavaScript. Every file's role is listed in §6; every behaviour's reason is in §16 (and the full decision log in PROJECT_PLAN.md §6).

## 3. How does it all fit together? (Architecture in simple words)

The project has **two programs** that talk to each other over the internet:

```
┌─────────────────────┐      internet       ┌─────────────────────┐     ┌──────────────┐
│   FRONTEND (what    │  ─── requests ───►  │   BACKEND (the      │────►│   DATABASE   │
│   you see/click)    │  ◄─── answers ────  │   brain/worker)     │     │  (memory)    │
│   Next.js on Vercel │                     │   Express on Render │     │ MongoDB Atlas│
└─────────────────────┘                     └─────────┬───────────┘     └──────────────┘
                                                      │ live prices
                                                      ▼
                                            ┌──────────────────┐
                                            │  BINANCE (free   │
                                            │  public market   │
                                            │  data, no key)   │
                                            └──────────────────┘
```

- **Frontend (`client/` folder):** the website. Buttons, charts, pages. Built with Next.js, deployed free on **Vercel**. It never talks to Binance directly.
- **Backend (`server/` folder):** the brain. It handles login, stores your bots/trades, fetches live prices from Binance, runs the bots every 20 seconds, and computes backtests. Built with Express (Node.js), deployed free on **Render**.
- **Database (MongoDB Atlas, free tier):** the memory. Remembers users, bots, and trades even after restarts. If no database is configured, the backend still works using temporary in-memory storage (data resets on restart) — so anyone can run it with zero setup.
- **Binance:** the source of truth for prices. Free public endpoints, no API key needed. US datacenter IPs are geo-blocked by `api.binance.com`, so the backend transparently fails over to `api.binance.us` (identical API) — see §16.3.

**A request's journey, step by step (example: you open the dashboard):**
1. Your browser asks the backend: `GET /api/portfolio` (with your login token).
2. The backend finds your bots, asks Binance for current prices, values your open positions, and replies with cash, total value, P&L, win rate.
3. The website displays it in the net-worth hero panel. Total trip: well under a second.

**A bot trade's journey (example: your SMA bot buys Bitcoin):**
1. Every 20 seconds, a scheduler (`node-cron`) wakes up and looks at all running bots.
2. For your bot, it downloads the last 100 hourly candles for BTC, computes the strategy signal (BUY / SELL / HOLD).
3. On BUY with no open position: it "buys" — converts the bot's capital into coin quantity at the live price, minus a 0.1% fee (like a real exchange charges), and saves a trade record.
4. On SELL (or if the stop-loss/take-profit safety rails are breached): it "sells" everything at the live price, records profit/loss, and clears the position.

---

## 4. Tech stack (what tools were used, and why — in plain words)

| Tool | What it is (simple) | Why this one |
|---|---|---|
| Next.js 14 + React | The framework the website is built with | Deploys to Vercel with zero setup; page-based routing keeps 6 screens obvious |
| Tailwind CSS | A styling system (colours, spacing, layout) | Custom dark "trading terminal" look without a bulky component library |
| lightweight-charts v4 | The candlestick chart library (made by TradingView) | Looks like a real exchange; fast and free (pinned v4 API) |
| Recharts | The equity-curve line chart library | Simple, clean line charts for backtest results |
| Express (Node.js) | The backend framework | Same language (JavaScript) as the frontend — one language for the whole project |
| Mongoose + MongoDB Atlas | The database + the tool that talks to it | Trades and bots are naturally document-shaped (JSON-like); generous free tier |
| JWT + bcrypt | Login tokens + password scrambling | Industry-standard: passwords are never stored readable; tokens expire in 7 days |
| Axios | The tool the website uses to call the backend | Automatically attaches your login token to every request; drops dead tokens on 401 |
| technicalindicators | Math library for SMA/RSI/MACD | Correct, tested textbook formulas instead of hand-rolled math |
| node-cron | The 20-second alarm clock for bots | Simple, survives free-tier server sleeps, easy to explain |
| Playwright | Browser automation for end-to-end tests | Clicks the real UI + calls the real API: 17 checks, one command |
| Vercel + Render | Free hosting for website + backend | Free tiers, made for exactly these frameworks |

---

## 5. Run it on your computer (copy-paste)

You need **Node.js 20+** installed. Two terminals.

**Terminal 1 — backend:**
```bash
cd server
cp .env.example .env
# open .env and set: MONGO_URI, JWT_SECRET (any long random text), CLIENT_URL=http://localhost:3000
npm install
npm run dev
# check: http://localhost:5000/api/health  →  {"ok": true, ...}
```

**Terminal 2 — frontend:**
```bash
cd client
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api  (already the default)
npm install
npm run dev
# open: http://localhost:3000
```

**Create the demo account (needs `MONGO_URI` working):**
```bash
cd server
npm run seed
# login with demo@tradepilot.app / demo1234
```

**Run the end-to-end tests:**
```bash
cd client
npm run test:e2e   # 17 checks vs running dev servers; see §12A
```

**Settings cheat-sheet:**

Server (`.env`): `PORT=5000` · `MONGO_URI=…` (Atlas connection string, database `tradingbot`) · `JWT_SECRET=…` (long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) · `CLIENT_URL=http://localhost:3000` (+ prod URL, comma-separated) · `CLIENT_ALLOW_PREVIEW=true` (optional, admits `*.vercel.app`) · `PAPER_CASH=100000` · `FEE_PCT=0.001` · `BINANCE_HOST=` (optional feed override)

Client (`.env.local`): `NEXT_PUBLIC_API_URL=http://localhost:5000/api` (local) or `https://<your-api>.onrender.com/api` (production).

> Without `MONGO_URI`, the backend runs in **in-memory demo mode** (register/login/bots/trades all work; data resets on restart). This is deliberate so reviewers can run it with zero setup.

---

## 6. Every file's role (developer file map)

*The full repo, file by file: what it is, what it does, why it exists. Generated folders (`node_modules/`, `.next/`, `package-lock.json`) and secrets (`server/.env`) are intentionally not documented line-by-line.*

### Root — repo contract + docs

| File | Role | Why it exists |
|---|---|---|
| `DOCUMENTATION.md` | This file: user manual (Part A) + developer docs (Part B) | Single shareable source of truth |
| `PROJECT_PLAN.md` | Build log: Plan vs Implemented + decision log per choice | Proves what shipped and why |
| `README.md` | Short overview + quick start for reviewers | First impression in 2 minutes |
| `package.json` | Workspace helpers (`install:all`, `dev:server`, `dev:client`) | One-command multi-folder workflows |
| `render.yaml` | Backend hosting contract (root `server/`, `npm install` → `npm start`, Node 20, env keys) | One-click Render Blueprint deploy |
| `.gitignore` | Blocks secrets (`.env*` all variants), builds (`.next/`, `out/`), OS/CLI clutter, test output | Secrets can never be committed by accident |

### Backend — `server/` (Express API + bot worker)

| File | Role | Why it exists |
|---|---|---|
| `server/package.json` | Deps + scripts: `dev` (watch), `start` (prod), `seed` (demo data) | Render runs `npm install` → `npm start`; no build step needed (plain Node) |
| `server/.env.example` | Template of all settings, no real values | Reviewers know what to configure without seeing secrets |
| `server/.env` | **Local secrets only** (Atlas URI, JWT secret) — gitignored, never committed | Keeps production credentials off GitHub |
| `server/src/index.js` | Boot: dotenv → CORS (normalized allowlist) → JSON → status logger → 6 routers → JSON 404 → error handler → DB connect (fail-fast to memory) → listen + CORS log → scheduler + `EADDRINUSE` guard | One file shows the entire backend assembly order |
| `server/src/config/db.js` | `connectDB()`: Mongoose connect with 5s `serverSelectionTimeoutMS`; empty URI → memory mode | Bad Atlas config degrades to demo mode instead of crashing |
| `server/src/middleware/auth.js` | Verifies `Bearer` JWT → `req.user`; 401 otherwise | Single gate every private route shares |
| `server/src/models/User.js` | Shape: name, unique lowercase email, bcrypt hash, cash=100000 | Login + balance in one document |
| `server/src/models/Bot.js` | Shape: owner, name, symbol, strategy enum, timeframe, capital, SL/TP, status enum, open position | A bot is one document the scheduler scans |
| `server/src/models/Trade.js` | Shape: owner, bot, symbol, BUY/SELL, qty, price, fee, pnl, reason | Immutable fill history = the audit trail |
| `server/src/models/Backtest.js` | Shape for persisted runs (reserved) | Results currently returned, not stored (known gap) |
| `server/src/services/binance.js` | `getPrice`/`get24h`/`getKlines` via `bget()` host failover (`.com` → `.us`) + 5–15s cache | Sole market-data gateway; survives US geo-blocking + rate limits |
| `server/src/services/indicators.js` | `smaSignal`/`rsiSignal`/`macdSignal` + `getSignal()` dispatcher | Textbook math in one auditable place |
| `server/src/services/backtestEngine.js` | `runBacktest()`: replay loop → final/returns/drawdown/win-rate/equity/trades | Same signals as live = results can't drift |
| `server/src/services/botEngine.js` | 20s `tick()`: SL/TP first → signal → paper fills; DB-or-`mem` store; crash-proof scheduler | The live trading heart; DB flaps can't kill it |
| `server/src/routes/auth.js` | `POST /auth/register`, `POST /auth/login` (validate → normalize → bcrypt → JWT; mem fallback) | Entry point for every user |
| `server/src/routes/market.js` | `GET /market/prices|klines/:symbol|price/:symbol` (interval whitelist, symbol regex) | Cached Binance proxy the UI consumes |
| `server/src/routes/bots.js` | Bot CRUD + `PATCH :id/start|stop` (full input whitelists, ObjectId guards, per-user scoping) | Bot lifecycle API; garbage in → 400, never zombie bots |
| `server/src/routes/portfolio.js` | Values positions at live prices → cash/openValue/total/P&L/win-rate/recent | One call powers the whole Desk |
| `server/src/routes/trades.js` | Trade history, optional `botId` filter, newest-first both stores | Ledger data source + CSV input |
| `server/src/routes/backtest.js` | Validates symbol/strategy/timeframe/capital → 500 klines → `runBacktest()` | Lab data source |
| `server/src/seed.js` | Idempotent demo account + sample bot (`npm run seed`) | Reviewers log in in 30 seconds |

### Frontend — `client/` (Next.js terminal UI)

| File | Role | Why it exists |
|---|---|---|
| `client/package.json` | Deps (next 14, axios, lightweight-charts v4, recharts, tailwind) + `dev`/`build`/`start`/`test:e2e` | Vercel runs `build`; Playwright runs `test:e2e` |
| `client/.env.example` | Template: `NEXT_PUBLIC_API_URL` | Reviewers know the one var to set |
| `client/next.config.js` | `reactStrictMode: true` | Catches effect bugs in dev |
| `client/tailwind.config.js` | Ink/mint/coral theme, 3 font families, tape/blink/rise/drift animations | The whole visual identity in one config |
| `client/postcss.config.js` | Tailwind + autoprefixer pipeline | Required build wiring |
| `client/playwright.config.js` | Chromium project, serial, 90s timeout, env-overridable URLs, reuse-or-boot servers | One-command E2E locally or vs prod |
| `client/app/layout.js` | Fonts (Google), metadata, grain backdrop, mounts shell | Every page inherits identity + frame |
| `client/app/shell.js` | Icon rail, live ticker tape (20s poll), top bar, mobile tabs, sign-out | App frame shared by all routes |
| `client/app/globals.css` | Design system: panels, buttons, inputs, pills, ledger, switch, skeletons | No component library — custom classes only |
| `client/app/page.js` | Desk: net-worth hero, exposure rail, executions, coin cards + sparklines | "How am I doing" in one screen |
| `client/app/login/page.js` | Split brand panel + login/register form, token → localStorage → `/` | Entry + first impression combined |
| `client/app/markets/[symbol]/page.js` | Candle terminal (lightweight-charts), timeframe switcher, launch ticket, feed-error banner | One coin under a microscope |
| `client/app/bots/page.js` | Strategy picker, deploy ticket, dossier cards with SL/TP rail + switch + retire | Bot command floor |
| `client/app/backtest/page.js` | Param rail, verdict banner, equity chart with worst-print dot, replay fills | Strategy grading bench |
| `client/app/history/page.js` | Filter pills, symbol search, ledger table, CSV export | Permanent memory UI |
| `client/components/ui.js` | `Mark, Spark, Sigil, TickerTape, SectionHead, Verdict, Empty, fmt$` | Hand-drawn primitives — the anti-generic-kit |
| `client/lib/api.js` | Axios instance: base URL, token injector, 401 token-drop + `logout()` | Every backend call flows through here |
| `client/e2e/api.spec.js` | 10 API tests (endpoints + 400/401/404 paths + lifecycle) | Backend proof, runnable |
| `client/e2e/app.spec.js` | 7 UI tests (shell, login, desk, bot CRUD, lab, ledger, candles) | Feature proof, self-cleaning |

---

## 7. The 3 strategies (in plain words)

A **strategy** is just a rule that looks at past prices and answers: BUY, SELL, or do nothing (HOLD). The app has three classic ones (the same ones taught in trading textbooks):

1. **SMA Crossover (trend rider)** — SMA = Simple Moving Average (average price over the last N hours). The bot watches two averages: fast (9 hours) and slow (21 hours). When the fast line crosses **above** the slow line, momentum is building → **BUY**. When it crosses **below** → **SELL**. Best when the market is clearly trending up or down.
2. **RSI Reversion (fade the extremes)** — RSI = Relative Strength Index (a 0–100 score of how overheated/oversold the market is). Below **30** = panic selling, probably bounces back → **BUY**. Above **70** = euphoria, probably cools off → **SELL**. Best when the market moves sideways.
3. **MACD Momentum (the balanced one)** — MACD tracks the gap between two averages and its own signal line. When MACD crosses above its signal line → **BUY**; below → **SELL**. Fewer false alarms than SMA, faster than RSI. Good all-rounder.

**House rules every bot follows:** one open position at a time · a BUY uses the whole ticket capital · a SELL closes everything · every fill pays **0.1% fee** (like Binance spot) · at least ~30 candles of history needed before signals count.

---

## 8. Backtesting and risk (in plain words)

**Backtesting = time travel for strategies.** Instead of waiting weeks to see if a strategy works, the computer replays up to 500 past candles in milliseconds, pretending to trade at each candle's closing price, and reports:

- **Final value** — what your stake grew/shrank to.
- **Returns %** — profit/loss as a percentage of the starting stake.
- **Max drawdown %** — the biggest fall from a peak along the way (a strategy that made +20% but once dropped −35% is scarier than it looks — this number reveals that).
- **Win rate %** — share of completed sell trades that made money.
- **Equity curve** — a line chart of your money over time (the worst dip is marked with a dot).
- **Trade list** — the individual buys/sells from the replay.

**Important honesty rule:** the backtest uses the *exact same signal functions* as live trading, so results and real behaviour can't drift apart. And past performance never promises future results — the verdict banner says exactly that.

**Risk controls (the safety rails):** each bot has a **stop-loss %** (e.g. 2% — if the position drops 2% below entry, auto-sell and stop the bot) and a **take-profit %** (e.g. 4% — lock in gains the same way). These are checked *before* strategy signals on every loop, and safety exits are tagged `SL/TP` in the ledger so you can tell them apart from strategy sells.

---

## 9. All API endpoints (the backend's menu)

Base URL locally: `http://localhost:5000/api`. Routes with 🔒 need login: send header `Authorization: Bearer <your-token>`.

| Method | Endpoint | 🔒 | What it does (plain words) |
|---|---|---|---|
| GET | `/health` | – | "Are you alive?" → `{ok: true}` |
| POST | `/auth/register` | – | Create account `{name, email, password}` → token + $100k user |
| POST | `/auth/login` | – | Sign in → token + user |
| GET | `/market/prices` | – | Live quotes for all 4 coins (price, 24h change, high/low) |
| GET | `/market/klines/:symbol?interval=1h&limit=200` | – | Candles for charts/signals/backtests |
| GET | `/market/price/:symbol` | – | One live price |
| GET | `/bots` | 🔒 | List your bots |
| POST | `/bots` | 🔒 | Create a bot (name, coin, strategy, capital, stop/target) |
| PATCH | `/bots/:id/start` | 🔒 | Start a bot |
| PATCH | `/bots/:id/stop` | 🔒 | Stop a bot |
| DELETE | `/bots/:id` | 🔒 | Retire a bot |
| GET | `/portfolio` | 🔒 | Cash, open value, total, P&L, win rate, recent trades |
| GET | `/trades?botId=` | 🔒 | Trade history (optionally one bot's) |
| POST | `/backtest` | 🔒 | Run a replay (coin, strategy, timeframe, stake) → results |

Bad input gets clear `400` errors (e.g. unknown strategy, capital under $100, bad timeframe); unknown bot IDs get `404`; unknown API paths get JSON `404`.

---

## 10. Deploying to the internet (Vercel + Render + Atlas)

**Frontend → Vercel:** import the GitHub repo → set Root Directory to `client/` → add env var `NEXT_PUBLIC_API_URL=https://<your-api>.onrender.com/api` → Deploy. You get `https://<app>.vercel.app`. Redeploy after changing `NEXT_PUBLIC_*` vars (they bake in at build time).

**Backend → Render:** New → Web Service → same repo, Root Directory `server/` → Build `npm install`, Start `npm start`, Node 20 → add env vars `MONGO_URI`, `JWT_SECRET` (generate a fresh one — don't reuse the local one), `CLIENT_URL=https://<app>.vercel.app` → Deploy. (`render.yaml` in the repo already describes this setup.)

**Database → MongoDB Atlas (M0 free):** create cluster → Database Access user + password → Network Access: allow Render IPs (or `0.0.0.0/0` for a review build) → connect → paste the `mongodb+srv://…` string as `MONGO_URI` (with `/tradingbot` as database name).

**Free-tier notes:** Render sleeps after ~15 min idle (first request wakes it in ~1 min); ping `/api/health` periodically (e.g. UptimeRobot) to keep demos snappy. The 20-second bot loop resumes automatically on wake.

---

## 11. Safety and good practices (what protects users and data)

- Passwords are **scrambled with bcrypt** (never stored readable) and login inputs are validated.
- Login sessions are **JWT tokens** (expire in 7 days); every private endpoint re-checks the token and only ever touches **that user's own** bots/trades.
- The website only talks to the backend; secret keys and the database string live in `server/.env`, which is **never committed to git** (`.gitignore` blocks it — verified).
- The browser only accepts data from the configured website address (CORS allowlist: slash-tolerant, logged at boot).
- Money math is explicit: 0.1% fee on every fill, no negative quantities possible, capital minimums enforced, full input validation on bot/backtest creation.

---

## 12. How to test the complete app (for users)

Three ways, from fastest to most thorough. Pick any — they all prove the same thing: every button does what it says.

### 12A. Automatic test — one command (2 minutes)

```bash
cd client
npm run test:e2e
```

This launches a real browser (Chromium) that clicks through the app like a human and calls every API like a program — **17 checks total**:
- **10 API checks:** health, unknown-page 404, login-required 401s, bad-input 400s, 4 live prices, candles, backtest math, full bot lifecycle (create → start → stop → delete).
- **7 feature checks:** all 6 pages load, login form works, dashboard unlocks, a bot can be deployed/started/stopped/retired through the UI (then cleaned up), backtest shows verdict + chart, ledger loads, candles draw.

Green output looks like `10 passed` + `7 passed`. The tests use the running dev servers (`:3000`/`:5000`); point at staging/prod with `E2E_WEB_URL=` / `E2E_API_URL=`. Full green runs recorded locally (17/17) and against production (17/17 after the Binance failover fix).

### 12B. Manual click test — 10 minutes, no tools

Do exactly this, in order. Expected result after each step is in brackets.

1. Open `http://localhost:3000` (or the Vercel URL). [Ticker tape scrolls with 4 live prices.]
2. Go to **Login**, sign in (`demo@tradepilot.app / demo1234`). [Lands on Desk, token saved.]
3. Desk shows **$100,000 net worth**, exposure bar, market cards with sparklines. [Numbers, not skeletons.]
4. Open **Markets → SOL**, switch timeframe `1h → 15m`. [Candles redraw.]
5. Use the **launch ticket**: RSI strategy, $1,000 → Launch & start. [Confirmation message appears.]
6. Go to **Bots**. [Your new bot card shows `active` + `FLAT · awaiting signal`.]
7. Go to **Lab**, run RSI on SOLUSDT/1h/$10,000. [Verdict banner + equity curve + fills.]
8. Go to **Ledger**. [Table loads; export CSV downloads a file.]
9. Back on **Bots**, stop then **Retire** the test bot (confirm the dialog). [Card disappears.]
10. Click the person icon (bottom of icon rail). [Signed out; portfolio shows the sign-in hint.]

If all 10 behave as bracketed, the app works end to end.

### 12C. Watching it actually work — follow one trade

Understanding the working is easiest by watching a single fill happen:

1. **Backend log = the app's heartbeat.** Every API call prints one line ending in its status code:
   `2026-09-25T…Z | GET /api/health → 200 (2.1 ms)` — green 200s are success, yellow 4xx are rejected bad input, red 5xx are server faults. A blocked website origin prints `[403] … CORS blocked`.
2. **The 20-second loop.** Started bots are checked every 20 seconds (`[bot] loop started (20s)` at boot). Each check downloads fresh candles, computes the signal, and only trades on BUY/SELL — most checks end in HOLD, so **no trade for a while is normal**, not a bug.
3. **Realistic timing.** On the `1h` timeframe signals can take minutes to hours to fire. To see action fast: use the **`15m` timeframe** (more candles, faster crosses) on a volatile coin like SOL, or run a **backtest** for instant proof (same signal code, 500 candles in seconds).
4. **The fill appears in two places at once:** a new row in **Ledger** (side, qty, price, reason) and a **Latest executions** entry on the Desk. Safety exits are tagged `SL/TP` so you can tell them apart from strategy sells.
5. **Stop-loss / take-profit on demand:** deploy with an extreme target (e.g. take-profit `0.5%`) — the next small up-move triggers an auto-sell and parks the bot as stopped. That is the safety rail working, live.

### 12D. Proof summary (what was verified)

- **Backend (17/17 live checks vs Atlas):** health, 404/401/400 paths, register, login, 4 live prices, candles, single price, bot create → start → portfolio → stop → delete, trades read, backtest on live data (ETH/RSI: final $5,748.78 from $5,000).
- **Bot engine math:** synthetic 100-candle series → SMA +5.33%, MACD +5.61% (RSI correctly 0 trades on a monotonic ramp).
- **Frontend:** clean `next build` (7 routes, valid `BUILD_ID`); dev server compiles all 6 pages with zero warnings/errors; production server serves all 6 routes HTTP 200.
- **Full user flow on live DB:** seed → login → portfolio $100,000 → seeded bot listed → backtest → lifecycle — all green.
- **Playwright E2E: 17/17 green locally and vs production** (prod needed the Binance `.us` failover first — US datacenters are geo-blocked by `api.binance.com`).

---

## 13. FAQ / Troubleshooting

**"I see 401 errors in the backend log."** Normal — that's a signed-out browser asking for private data. Sign in and they become 200s.

**"Chart is empty / feed error banner."** Binance unreachable or ad-blocker interfering. Retry in a few seconds; check the backend is running.

**"`'next' is not recognized`"** — a past `npm install` was interrupted. Run `npm install` fully again in `client/`, then `npm run build`.

**"Weird `Cannot find module './749.js'` in dev"** — corrupted `.next` cache. Stop the server, delete `client/.next`, restart.

**"Backend exits with bad MONGO_URI"** — it shouldn't (it falls back to memory mode); make sure you pulled the latest `server/src/index.js` + `config/db.js`.

**"No bots/trades after restart"** — you're in in-memory mode (no `MONGO_URI`). Set it to persist.

---

## 14. Small glossary (words used in the app)

- **Paper trading** — trading with fake money on real prices. All learning, no risk.
- **Bot** — an automatic trader following fixed rules. Yours run every 20 seconds.
- **Candle / Kline** — one period's price story: opened at X, went up to H, down to L, closed at C.
- **Signal** — a strategy's decision: BUY, SELL, or HOLD.
- **Position** — coins you currently hold (vs **flat** = holding none, waiting in cash).
- **P&L** — profit and loss vs your $100,000 start.
- **Drawdown** — biggest peak-to-dip fall. Measures scariness, not just profit.
- **Stop-loss / Take-profit** — automatic emergency exits at −X% / +Y%.
- **Backtest** — replaying history to grade a strategy.
- **Equity curve** — your money's journey drawn as a line.
- **Ledger** — the full list of every fill. The app's memory of what happened.
- **Fee (0.1%)** — exchange-style cut on each trade, included so results stay honest.

---

## 15. Beginner's handbook — your first 30 minutes (user POV)

*Read this if you have never used a trading app. No prior knowledge needed. Every feature explained: what it is, why it exists, and exactly what to click.*

### 15.1 Before you start: the one idea

Normal trading = **you** watch prices and click buy/sell. This app = **bots** watch prices and trade for you, and a **lab** grades strategies on history first. Your job is three decisions: *which strategy, which coin, how much virtual money*. The app does everything else. Nothing here uses real money — the $100,000 is play money on real live prices.

### 15.2 Feature 1 — Account (Login page)

**What it does:** remembers who you are, so your money, bots, and history persist.
**Why it exists:** without accounts, everyone's bots would mix together.
**How to use:**
1. Open the app → you land on Login (or click the person icon).
2. First time: click *"New here? Claim a $100k desk"* → enter name, email, password (min 6 chars) → Create. Done — $100,000 appears on your Desk.
3. Returning: enter email + password → *"Enter terminal"* → you land on the Desk.
**What happens behind the curtain:** password is scrambled (never stored readable), server hands your browser a 7-day login token it attaches to every later request.
**Beginner mistakes:** using different email capitalisation on two devices (use one consistent lowercase email); forgetting that the demo account only exists after `npm run seed`.

### 15.3 Feature 2 — Desk (home page `/`)

**What it does:** answers *"how am I doing?"* in one glance.
**The four numbers, decoded:**
- **Net worth** = cash in hand + current market value of coins your bots hold. Goes up and down with live prices.
- **P&L** = net worth minus $100,000. Green = profit, red = loss. It is *unrealised* until bots sell (prices move, so it breathes).
- **Win rate** = completed sell trades that made money ÷ all completed sells. Needs at least one SELL to mean anything.
- **Active bots** = bots currently switched on (they check the market every 20s).
**Also here:** exposure bar (cash vs coins at a glance), latest executions (your newest fills), market cards (live price + 24h % + sparkline per coin; click → terminal).
**Beginner mistakes:** panicking when P&L flickers red seconds after a buy (0.1% fee + spread — tiny dips on entry are normal); expecting win rate with zero trades (it shows — until sells exist).

### 15.4 Feature 3 — Market terminal (`/markets/:symbol`)

**What it does:** one coin under a microscope.
**Reading candles (30-second primer):** each candle = one period (`15m`/`1h`/`4h`/`1d` switcher). Body = open→close; green closed higher, red closed lower; thin wicks = extremes visited. A staircase of green = uptrend; long wicks = indecision.
**Launch ticket (the shortcut):** strategy + capital → *"Launch & start"* creates AND starts a bot on this coin in one click. Use it when a chart convinces you.
**Beginner mistakes:** assuming green candles mean "bot will buy" (bots follow their rule, not candle colour — SMA buys on average-crosses, which often come *after* the green run starts).

### 15.5 Feature 4 — Bots (`/bots`)

**What each control means:**
- **Strategy cards** — the rulebook. SMA = trend rider, RSI = fade extremes, MACD = balanced. Pick by market mood (§7), not by favourite colour.
- **Desk name** — just a label for you (auto-filled if skipped).
- **Market** — which coin this bot may touch (one bot = one coin, always).
- **Capital** — max virtual dollars this bot may deploy (min $100).
- **Stop % / Target %** — the safety rails (§8). Start with defaults 2 / 4.
- **The switch** — off = parked (ignores market), on = live (checked every 20s).
- **Status pill + position line** — `active`/`stopped`; `IN POSITION 0.05 @ $83,900` (holding) vs `FLAT` (cash, waiting).
- **Retire** — deletes the bot (history stays in the Ledger). Asks for confirmation first.
**Beginner mistakes:** deploying 5 bots on the same coin with full capital each (they'd each trade independently — overlap, not diversification); starting a bot then closing the laptop and assuming it stopped (bots live on the *server* — they keep trading until you stop them; that's the point, but know it).

### 15.6 Feature 5 — Lab backtest (`/backtest`)

**What it does:** grades a strategy on up to 500 past candles in seconds.
**Reading the report:** verdict banner first (plain-English conclusion) → terminal value + returns (did it grow?) → max drawdown (how scary was the ride?) → win rate → equity curve (the journey; orange dot = worst dip) → last fills (the actual trades).
**Beginner mistakes:** trusting one green backtest as proof (try 2–3 timeframes; a strategy green on all three is sturdier); backtesting tiny capital (fees eat small stakes — results mislead); forgetting backtests exclude stop/target exits (live bots have extra safety backtests don't).

### 15.7 Feature 6 — Ledger (`/history`)

**What it does:** the permanent memory — every fill, newest first, with reason (`SMA_CROSS` = strategy decided; `SL/TP` = safety rail fired).
**How to use:** filter BUY/SELL pills, search a coin, export CSV for spreadsheets. Realised P&L lives here (only SELL rows have it — profit exists only when you sell).
**Beginner mistakes:** adding up BUY rows as "spent" and SELL rows as "earned" across bots (each bot's capital recycles — read per-bot via the `botId` filter idea, or compare Desk P&L).

### 15.8 Your first 30 minutes — scripted

Minutes 0–5: register → Desk shows $100,000 → click every market card once.
Minutes 5–12: Lab → run all 3 strategies on BTCUSDT/1h/$10,000 → note which wins.
Minutes 12–18: Markets → SOL → launch ticket (winning strategy, $1,000) → bot starts.
Minutes 18–25: Bots → watch your card; Ledger → empty (normal — signals take time; drop a timeframe to 15m on the *next* bot if impatient).
Minutes 25–30: Lab again on 15m → compare with 1h → retire the test bot → export CSV → sign out via rail icon.
You now understand every feature: *account remembers, Desk reports, terminal shows, bots act, Lab grades, Ledger remembers.*

---

## 16. Developer POV — end-to-end internals

*Read this if you will run, modify, review, or extend the code. Assumes basic JavaScript. Short snippets are quoted verbatim from the repo.*

### 16.1 Boot sequence (`server/src/index.js`)

Order matters — middleware runs top-down:
1. `dotenv` loads `server/.env` → Express app → **CORS** (normalized allowlist, slash-tolerant, optional `*.vercel.app` previews) → `express.json()` → **morgan** status-line logger.
2. Health route + 6 routers mounted (`/api/auth|market|bots|portfolio|trades|backtest`).
3. JSON 404 for unknown `/api/*` → central error handler (CORS 403 branch + 500 branch).
4. `connectDB()` with 5s fail-fast → `.catch` falls back to memory mode → `.finally` listens, prints `[cors] allowed origins: …`, starts the 20s scheduler.
5. `EADDRINUSE` prints one clear line instead of a stack dump.

### 16.2 Auth flow (`routes/auth.js` + `middleware/auth.js`)

- Register: validate (email format, password ≥ 6, name) → normalize email (trim + lowercase) → `bcrypt.hash(pw, 10)` → create user with `cash = PAPER_CASH` → sign JWT `{id, email}` 7d → return `{token, user}`.
- Login: same normalization → `bcrypt.compare` → identical token shape. Wrong password and unknown email both return 401 with the same message (no user enumeration).
- `auth` middleware: reads `Authorization: Bearer <t>`, `jwt.verify` with `JWT_SECRET`, attaches `req.user`. Every data route is scoped to `req.user.id` — cross-user reads are impossible by construction.
- No `MONGO_URI`? Same routes run against an in-process `Map` (`global.__memUsers`) — zero-setup review mode.

### 16.3 Market data (`services/binance.js`)

- Three functions, three TTLs: `getPrice` 5s · `get24h` 15s · `getKlines` 15s — one shared `Map` cache keyed `price-/24h-/kl-…`. TTLs chosen so the 20s tape poll + bot loop stay inside Binance rate limits on free hosting.
- Host failover (`bget`): tries `BINANCE_HOST || api.binance.com`, falls back to `api.binance.us` (identical REST shape) — because US datacenter IPs get HTTP 451 from `.com`. Override per-env via `BINANCE_HOST`. Failover logs `[binance] failover in use`.
- Frontend never touches Binance: `lib/api.js` → `GET /api/market/*` (`routes/market.js` validates `interval` whitelist + symbol regex) → `binance.js`.

### 16.4 Bot tick (`services/botEngine.js`) — the heart

Every 20s (`node-cron`), `tick()` runs; list-failures return early and scheduler-level rejections are caught, so a DB flap can never kill the process:

```
for each active bot:
  klines ← getKlines(symbol, timeframe, 100)
  price  ← getPrice(symbol)
  if holding and (drop ≤ −SL% or rise ≥ +TP%):
      SELL all at live price, tag SL/TP, park bot as stopped; continue
  signal ← getSignal(strategy, klines)   // BUY | SELL | HOLD
  if BUY and flat:  qty = capital·(1−FEE)/price; save BUY trade; position={qty,entryPrice}
  if SELL and holding: proceeds = qty·price; pnl = proceeds−fee−capital; save SELL; clear position
  (any per-bot exception → logged, loop continues)
```

Fill math, verbatim logic: `qty = (capital * (1 - FEE)) / price`, `fee = proceeds * FEE`, `FEE = 0.001`. One position per bot by design — no partial sizing, no leverage. `store()` picks DB vs `mem` per call, so mixed states can't corrupt either backend.

### 16.5 Backtest (`services/backtestEngine.js`)

`runBacktest({klines, strategy, capital})`: iterate candles from index 30 (indicator warmup) → same `getSignal()` as live (no drift possible) → BUY commits all cash minus fee, SELL liquidates all minus fee → track `equity`, running `peak`/`maxDD` → return `{final, returnsPct, maxDrawdownPct, totalTrades, winRatePct, equity (5:1 downsampled), trades (last 50)}`, rounded to 2dp. SL/TP intentionally excluded (live-only concern, documented in UI copy).

### 16.6 Portfolio math (`routes/portfolio.js`)

`invested` = sum of capital of bots currently holding → `cash = PAPER_CASH − invested` → `openValue` = Σ qty × live price (falls back to entry price if feed hiccups) → `total = cash + openValue`, `pnl = total − PAPER_CASH`. Win rate from SELL trades' stored `pnl`. Mem-mode trades reversed to newest-first (matches DB sort). Note the honest simplification: cash is derived, not ledgered per fill — fine for paper scope, called out for reviewers.

### 16.7 Frontend data flow (per page)

- `lib/api.js`: axios base `NEXT_PUBLIC_API_URL`, request interceptor attaches token, response interceptor drops dead tokens on 401 (UI falls back to signed-out state instead of looping). `logout()` clears the token.
- `shell.js`: ticker tape polls `/market/prices` every 20s; `authed` derived from localStorage; rail + mobile tabs share one `NAV` + `isActive()`; rail icon toggles sign-in vs sign-out.
- `/` Desk: `/portfolio` (once) + `/market/prices` + per-coin `/market/klines?…limit=40` for sparklines; signed-out → inline hint, market still renders.
- `/markets/[s]`: parallel klines + prices fetch → `lightweight-charts` v4 `addCandlestickSeries` → interval switcher refetches; fetch failure → error banner (never blank). Quick-launch ticket creates + starts a bot in two calls.
- `/bots`: `GET /bots` → strategy picker (local state) → `POST /bots` (server validates whitelists) → `PATCH :id/start|stop`, `DELETE` behind `confirm()`.
- `/backtest`: `POST /backtest` → verdict + Recharts equity (`ReferenceDot` marks worst print) + last-8 fills.
- `/history`: `GET /trades` → client-side side/symbol filters → CSV export via Blob.
- `/login`: `POST /auth/login|register` → token to localStorage → `router.push('/')`; server message surfaced verbatim in error box.

### 16.8 Database schemas (Mongoose)

- **User:** `name*`, `email* unique lowercase`, `passwordHash*`, `cash=100000`, timestamps.
- **Bot:** `userId*`, `name*`, `symbol`, `strategy ∈ SMA_CROSS|RSI_MEAN|MACD_TREND`, `timeframe`, `capital*`, `stopLossPct=2`, `takeProfitPct=4`, `status ∈ active|stopped`, `position{qty, entryPrice}`, timestamps.
- **Trade:** `userId*`, `botId`, `symbol*`, `side ∈ BUY|SELL`, `qty*`, `price*`, `fee`, `pnl`, `reason`, timestamps.
- **Backtest:** defined for future persistence (`userId, symbol, strategy, timeframe, params, result`) — currently results are returned, not stored (known gap, PROJECT_PLAN.md §3.5).

### 16.9 Environment reference

Server (`server/.env`, never committed): `PORT=5000` · `MONGO_URI` (required for persistence; absent → memory mode) · `JWT_SECRET` (required in prod; generate 48 random bytes) · `CLIENT_URL` (comma list, slash-tolerant) · `CLIENT_ALLOW_PREVIEW` (`true` admits `*.vercel.app`) · `PAPER_CASH=100000` · `FEE_PCT=0.001` · `BINANCE_HOST` (override primary feed host).
Client (`client/.env.local`): `NEXT_PUBLIC_API_URL` (baked at build time — redeploy after changing).

### 16.10 Scripts reference

Server: `npm run dev` (watch) · `npm start` (prod/Render) · `npm run seed` (demo account + sample bot, idempotent).
Client: `npm run dev` (:3000) · `npm run build` (must pass before deploy) · `npm start` (prod) · `npm run test:e2e` (Playwright, 17 tests).
Root: `npm run install:all` · `dev:server` · `dev:client` (helpers only).

### 16.11 Cookbook: add a 4th strategy (3 files, ~15 minutes)

1. `server/src/services/indicators.js`: export `mySignal(klines)` returning `'BUY'|'SELL'|'HOLD'`, add branch in `getSignal()`.
2. `server/src/routes/bots.js` + `backtest.js`: append the id to both `STRATEGIES` whitelists (server rejects unknown strategies — this step is the gate).
3. `client/app/bots/page.js` (+ backtest strategy buttons): add card entry `{id, name, code, desc, best}` and a `Sigil` map entry in `components/ui.js`.
4. Verify: unit-check the signal on synthetic candles → `POST /backtest` with the new id → Playwright run → push.

### 16.12 Logging, errors, and failure design

- Request log (morgan custom): `:date[iso] | :method :url → :status-colored (:response-time ms)` — every call ends in its code; 2xx green, 3xx cyan, 4xx yellow, 5xx red (ANSI renders on Render).
- Error handler: CORS rejections → `403 {error:'Origin not allowed'}` + one `[403]` line (client problem, no stack); everything else → `500 {error:'Server error'}` + `[500] METHOD URL` + stack.
- Boot is crash-proof by policy: bad DB → memory mode; taken port → one-line `EADDRINUSE` message; tick/scheduler failures → caught and logged, never fatal.
- Validation philosophy: reject garbage at the boundary with `400` + plain message (strategy/symbol/timeframe whitelists, capital ≥ 100, ObjectId guards → 404) so bugs surface as readable errors, never 500s or zombie bots.

### 16.13 Deploy pipeline + constraints

GitHub `main` → Render (root `server/`, `npm install` → `npm start`, Node 20, 6 env vars) + Vercel (root `client/`, `NEXT_PUBLIC_API_URL`, redeploy on change). Atlas M0 + `0.0.0.0/0` for review builds. Free-tier realities encoded in design: 20s polling (not sockets) survives sleeps; `/api/health` is the keep-alive target; 5–15s feed cache respects Binance limits; JWT statelessness survives restarts. `render.yaml` declares the backend contract.

### 16.14 Key trade-offs (full log in PROJECT_PLAN.md section 6)

Polling over WebSockets (deterministic on free tier) · Express over FastAPI (one language) · Atlas documents over relational rows (trade-shaped JSON) · JWT over sessions (sleep-proof) · Binance REST over scrapers (keyless klines) · paper-only scope (same order lifecycle, zero compliance risk) · monorepo (one review, correlated deploys) · backtest/live signal sharing (results can't drift from behaviour).
