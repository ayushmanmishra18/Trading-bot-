require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { startBotLoop } = require('./services/botEngine');

const app = express();

// --- CORS: slash-tolerant, multi-origin, preview-friendly ---
// A trailing slash in CLIENT_URL (e.g. "...vercel.app/") used to silently
// block the real browser origin ("...vercel.app"). Normalize everything so
// a dashboard typo can never break prod again.
function normalizeOrigin(o) {
  return String(o || '').trim().replace(/\/+$/, '');
}
const rawOrigins = (process.env.CLIENT_URL || '*').split(',').map(normalizeOrigin).filter(Boolean);
const allowAll = rawOrigins.includes('*');
const origins = allowAll ? ['*'] : rawOrigins;
// Optional: CLIENT_ALLOW_PREVIEW=true permits *.vercel.app preview deploys
const allowPreview = String(process.env.CLIENT_ALLOW_PREVIEW || '').toLowerCase() === 'true';

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/health-checks have no Origin
    if (allowAll || origins.includes(origin)) return cb(null, true);
    if (allowPreview && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin ${origin}`));
  }
}));
app.use(express.json());

// --- Request log: every API call leaves one line ending in its status code ---
// Format: ISO timestamp | METHOD URL → STATUS (latency), colored by class so
// failures jump out in Render logs: 2xx green, 3xx cyan, 4xx yellow, 5xx red.
morgan.token('status-colored', (req, res) => {
  const s = res.statusCode;
  const color = s >= 500 ? 31 : s >= 400 ? 33 : s >= 300 ? 36 : 32;
  return `\x1b[${color}m${s}\x1b[0m`;
});
app.use(morgan(':date[iso] | :method :url → :status-colored (:response-time ms)'));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/market', require('./routes/market'));
app.use('/api/bots', require('./routes/bots'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/backtest', require('./routes/backtest'));

// JSON 404 for unknown API routes (Express default is HTML)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  // Blocked origins are a client problem, not a server crash: 403, no stack.
  if (err && String(err.message || '').startsWith('CORS blocked')) {
    console.log(`[403] ${req.method} ${req.originalUrl} :: ${err.message}`);
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  // 500s always print method + URL + status + stack — never a silent failure.
  console.error(`[500] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
// A bad MONGO_URI must never crash the API: fall back to in-memory mode.
connectDB(process.env.MONGO_URI).catch((e) => {
  console.log('[db] MongoDB unreachable, running in in-memory demo mode:', e.message);
}).finally(() => {
  const server = app.listen(PORT, () => {
    console.log(`[api] listening on ${PORT}`);
    console.log(`[cors] allowed origins: ${origins.join(', ')}${allowPreview ? ' (+ *.vercel.app previews)' : ''}`);
  });
  // A taken port must print one clear line, not a stack dump (common when
  // a dev server is already running — e.g. `npm run dev` in another shell).
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`[api] port ${PORT} is already in use — stop the other server or set PORT=5050`);
      process.exit(1);
    }
    throw e;
  });
  startBotLoop();
});
