# TradePilot — Complete Project Documentation

> Everything about this project, start to finish, in plain and simple words.
> New here? Read sections 1 → 2 → 3 → 5 and you will understand the whole thing in 10 minutes.

---

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
- **Binance:** the source of truth for prices. Free public endpoints, no API key needed.

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
| lightweight-charts | The candlestick chart library (made by TradingView) | Looks like a real exchange; fast and free |
| Recharts | The equity-curve line chart library | Simple, clean line charts for backtest results |
| Express (Node.js) | The backend framework | Same language (JavaScript) as the frontend — one language for the whole project |
| Mongoose + MongoDB Atlas | The database + the tool that talks to it | Trades and bots are naturally document-shaped (JSON-like); generous free tier |
| JWT + bcrypt | Login tokens + password scrambling | Industry-standard: passwords are never stored readable; tokens expire in 7 days |
| Axios | The tool the website uses to call the backend | Automatically attaches your login token to every request |
| technicalindicators | Math library for SMA/RSI/MACD | Correct, tested textbook formulas instead of hand-rolled math |
| node-cron | The 20-second alarm clock for bots | Simple, survives free-tier server sleeps, easy to explain |
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

**Settings cheat-sheet:**

Server (`.env`): `PORT=5000` · `MONGO_URI=…` (Atlas connection string, database `tradingbot`) · `JWT_SECRET=…` (long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) · `CLIENT_URL=http://localhost:3000` · `PAPER_CASH=100000` · `FEE_PCT=0.001`

Client (`.env.local`): `NEXT_PUBLIC_API_URL=http://localhost:5000/api` (local) or `https://<your-api>.onrender.com/api` (production).

> Without `MONGO_URI`, the backend runs in **in-memory demo mode** (register/login/bots/trades all work; data resets on restart). This is deliberate so reviewers can run it with zero setup.

---

## 6. Project folders (where everything lives)

```
trading-bot/
├── DOCUMENTATION.md     ← this file (the full guide)
├── PROJECT_PLAN.md      ← build log: what was planned vs what shipped + why each choice
├── README.md            ← short overview + quick start for reviewers
├── package.json         ← helper scripts for the whole repo
├── render.yaml          ← tells Render how to host the backend
├── .gitignore           ← keeps secrets (server/.env) and build files out of git
│
├── server/              ← BACKEND (Express API)
│   ├── package.json     ← backend dependencies + `dev` / `start` / `seed` scripts
│   ├── .env.example     ← template of required settings (no secrets inside)
│   └── src/
│       ├── index.js         ← starts everything: API routes + bot scheduler
│       ├── config/db.js     ← connects to MongoDB (fast-fails to memory mode)
│       ├── middleware/auth.js ← checks your login token on protected routes
│       ├── models/          ← data shapes: User.js, Bot.js, Trade.js, Backtest.js
│       ├── services/
│       │   ├── binance.js       ← fetches live prices/candles (with caching)
│       │   ├── indicators.js    ← SMA / RSI / MACD signal math
│       │   ├── backtestEngine.js← replays history, computes results
│       │   └── botEngine.js     ← the 20-second live trading loop
│       ├── routes/          ← API endpoints: auth, market, bots, portfolio, trades, backtest
│       └── seed.js          ← creates the demo account + sample bot
│
└── client/              ← FRONTEND (Next.js website)
    ├── package.json     ← frontend dependencies + `dev` / `build` / `start`
    ├── .env.example     ← template (backend URL)
    ├── tailwind.config.js ← theme: colours, fonts, animations
    ├── app/
    │   ├── layout.js    ← fonts + page metadata
    │   ├── shell.js     ← app frame: icon rail, ticker tape, top bar, mobile tabs
    │   ├── globals.css  ← the whole design system (panels, buttons, inputs…)
    │   ├── page.js      ← Desk (dashboard)
    │   ├── login/page.js
    │   ├── markets/[symbol]/page.js ← coin terminal
    │   ├── bots/page.js
    │   ├── backtest/page.js
    │   └── history/page.js
    ├── components/ui.js ← shared building blocks (logo, sparklines, badges…)
    └── lib/api.js       ← backend connection + login-token handling
```

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

**Frontend → Vercel:** import the GitHub repo → set Root Directory to `client/` → add env var `NEXT_PUBLIC_API_URL=https://<your-api>.onrender.com/api` → Deploy. You get `https://<app>.vercel.app`.

**Backend → Render:** New → Web Service → same repo, Root Directory `server/` → Build `npm install`, Start `npm start`, Node 20 → add env vars `MONGO_URI`, `JWT_SECRET` (generate a fresh one — don't reuse the local one), `CLIENT_URL=https://<app>.vercel.app` → Deploy. (`render.yaml` in the repo already describes this setup.)

**Database → MongoDB Atlas (M0 free):** create cluster → Database Access user + password → Network Access: allow Render IPs (or `0.0.0.0/0` for a review build) → connect → paste the `mongodb+srv://…` string as `MONGO_URI` (with `/tradingbot` as database name).

**Free-tier notes:** Render sleeps after ~15 min idle (first request wakes it in ~1 min); ping `/api/health` periodically (e.g. UptimeRobot) to keep demos snappy. The 20-second bot loop resumes automatically on wake.

---

## 11. Safety and good practices (what protects users and data)

- Passwords are **scrambled with bcrypt** (never stored readable) and login inputs are validated.
- Login sessions are **JWT tokens** (expire in 7 days); every private endpoint re-checks the token and only ever touches **that user's own** bots/trades.
- The website only talks to the backend; secret keys and the database string live in `server/.env`, which is **never committed to git** (`.gitignore` blocks it — verified).
- The browser only accepts data from the configured website address (CORS allowlist).
- Money math is explicit: 0.1% fee on every fill, no negative quantities possible, capital minimums enforced, full input validation on bot/backtest creation.

---

## 12. How it was tested (proof it works)

- **Backend (17/17 live checks vs Atlas):** health, 404/401/400 paths, register, login, 4 live prices, candles, single price, bot create → start → portfolio → stop → delete, trades read, backtest on live data (ETH/RSI: final $5,748.78 from $5,000).
- **Bot engine math:** synthetic 100-candle series → SMA +5.33%, MACD +5.61% (RSI correctly 0 trades on a monotonic ramp).
- **Frontend:** clean `next build` (7 routes, valid `BUILD_ID`); dev server compiles all 6 pages with zero warnings/errors; production server serves all 6 routes HTTP 200.
- **Full user flow on live DB:** seed → login → portfolio $100,000 → seeded bot listed → backtest → lifecycle — all green.

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
