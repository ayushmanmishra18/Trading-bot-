const express = require('express');
const { getPrice, get24h, getKlines } = require('../services/binance');

const router = express.Router();
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
const INTERVALS = ['15m', '1h', '4h', '1d'];

router.get('/prices', async (req, res) => {
  try {
    const data = await Promise.all(SYMBOLS.map((s) => get24h(s).catch(() => ({ symbol: s, price: 0, changePct: 0 }))));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/klines/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    if (!/^[A-Z]{6,12}$/.test(symbol)) return res.status(400).json({ error: 'bad symbol' });
    const { interval = '1h', limit = 200 } = req.query;
    if (!INTERVALS.includes(interval)) return res.status(400).json({ error: `interval must be one of ${INTERVALS.join(', ')}` });
    const data = await getKlines(symbol, interval, Math.min(parseInt(limit) || 200, 1000));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/price/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    if (!/^[A-Z]{6,12}$/.test(symbol)) return res.status(400).json({ error: 'bad symbol' });
    res.json(await getPrice(symbol));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
