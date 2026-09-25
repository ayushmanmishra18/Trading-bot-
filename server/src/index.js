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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).finally(() => {
  app.listen(PORT, () => console.log(`[api] listening on ${PORT}`));
  startBotLoop();
});
