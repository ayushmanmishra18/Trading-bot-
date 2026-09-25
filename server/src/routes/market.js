const express = require('express');
const { getPrice, get24h, getKlines } = require('../services/binance');

const router = express.Router();
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

router.get('/prices', async (req, res) => {
  try {
    const data = await Promise.all(SYMBOLS.map((s) => get24h(s).catch(() => ({ symbol: s, price: 0, changePct: 0 }))));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/klines/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 200 } = req.query;
    const data = await getKlines(symbol.toUpperCase(), interval, Math.min(parseInt(limit) || 200, 1000));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/price/:symbol', async (req, res) => {
  try {
    res.json(await getPrice(req.params.symbol.toUpperCase()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
