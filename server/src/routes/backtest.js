const express = require('express');
const { auth } = require('../middleware/auth');
const { getKlines } = require('../services/binance');
const { runBacktest } = require('../services/backtestEngine');

const router = express.Router();
router.use(auth);

router.post('/', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', strategy = 'SMA_CROSS', timeframe = '1h', capital = 10000 } = req.body;
    const STRATEGIES = ['SMA_CROSS', 'RSI_MEAN', 'MACD_TREND'];
    const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
    const TIMEFRAMES = ['15m', '1h', '4h', '1d'];
    if (!SYMBOLS.includes(symbol)) return res.status(400).json({ error: `symbol must be one of ${SYMBOLS.join(', ')}` });
    if (!STRATEGIES.includes(strategy)) return res.status(400).json({ error: `strategy must be one of ${STRATEGIES.join(', ')}` });
    if (!TIMEFRAMES.includes(timeframe)) return res.status(400).json({ error: `timeframe must be one of ${TIMEFRAMES.join(', ')}` });
    if (!(Number(capital) >= 100)) return res.status(400).json({ error: 'capital must be at least 100' });
    const klines = await getKlines(symbol, timeframe, 500);
    const result = runBacktest({ klines, strategy, capital: Number(capital) });
    res.json({ symbol, strategy, timeframe, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
