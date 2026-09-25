require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { startBotLoop } = require('./services/botEngine');

const app = express();
app.use(cors({ origin: (process.env.CLIENT_URL || '*').split(',') }));
app.use(express.json());
app.use(morgan('dev'));

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
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
// A bad MONGO_URI must never crash the API: fall back to in-memory mode.
connectDB(process.env.MONGO_URI).catch((e) => {
  console.log('[db] MongoDB unreachable, running in in-memory demo mode:', e.message);
}).finally(() => {
  app.listen(PORT, () => console.log(`[api] listening on ${PORT}`));
  startBotLoop();
});
