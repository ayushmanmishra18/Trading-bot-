const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const { getPrice } = require('../services/binance');
const { mem } = require('../services/botEngine');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const PAPER_CASH = parseFloat(process.env.PAPER_CASH || '100000');
    const useDb = mongoose.connection.readyState === 1;
    let bots, trades;
    if (useDb) {
      bots = await require('../models/Bot').find({ userId: req.user.id });
      trades = await require('../models/Trade').find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
    } else {
      bots = mem.bots.filter((b) => String(b.userId) === String(req.user.id));
      // mem store is chronological — newest last, so reverse to newest-first
      trades = mem.trades.filter((t) => String(t.userId) === String(req.user.id)).slice(-100).reverse();
    }
    // Live value open positions at current price
    let openValue = 0;
    for (const b of bots) {
      if (b.position && b.position.qty > 0) {
        try {
          const { price } = await getPrice(b.symbol);
          openValue += b.position.qty * price;
        } catch { openValue += b.position.qty * b.position.entryPrice; }
      }
    }
    const invested = bots.reduce((s, b) => s + (b.position && b.position.qty > 0 ? b.capital : 0), 0);
    const cash = PAPER_CASH - invested;
    const total = cash + openValue;
    const sells = trades.filter((t) => t.side === 'SELL');
    const wins = sells.filter((t) => (t.pnl || 0) > 0).length;
    res.json({
      cash: Math.round(cash * 100) / 100,
      openValue: Math.round(openValue * 100) / 100,
      total: Math.round(total * 100) / 100,
      pnl: Math.round((total - PAPER_CASH) * 100) / 100,
      activeBots: bots.filter((b) => b.status === 'active').length,
      winRate: sells.length ? Math.round((wins / sells.length) * 10000) / 100 : 0,
      recent: trades.slice(0, 10)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
