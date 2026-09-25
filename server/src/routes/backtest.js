const express = require('express');
const { auth } = require('../middleware/auth');
const { getKlines } = require('../services/binance');
const { runBacktest } = require('../services/backtestEngine');

const router = express.Router();
router.use(auth);

router.post('/', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', strategy = 'SMA_CROSS', timeframe = '1h', capital = 10000 } = req.body;
    const klines = await getKlines(symbol, timeframe, 500);
    const result = runBacktest({ klines, strategy, capital });
    res.json({ symbol, strategy, timeframe, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
