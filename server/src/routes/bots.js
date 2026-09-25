const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const { mem } = require('../services/botEngine');

const router = express.Router();
router.use(auth);

function useDb() { return mongoose.connection.readyState === 1; }
function BotModel() { return require('../models/Bot'); }

const STRATEGIES = ['SMA_CROSS', 'RSI_MEAN', 'MACD_TREND'];
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
const TIMEFRAMES = ['15m', '1h', '4h', '1d'];

function validateBotInput({ name, symbol, strategy, timeframe, capital, stopLossPct, takeProfitPct }) {
  if (!name || !String(name).trim()) return 'name is required';
  if (String(name).length > 60) return 'name must be under 60 characters';
  if (!STRATEGIES.includes(strategy)) return `strategy must be one of ${STRATEGIES.join(', ')}`;
  if (!SYMBOLS.includes(symbol)) return `symbol must be one of ${SYMBOLS.join(', ')}`;
  if (!TIMEFRAMES.includes(timeframe)) return `timeframe must be one of ${TIMEFRAMES.join(', ')}`;
  if (!(capital >= 100)) return 'capital must be at least 100';
  if (!(stopLossPct > 0 && stopLossPct <= 50)) return 'stopLossPct must be 0–50';
  if (!(takeProfitPct > 0 && takeProfitPct <= 200)) return 'takeProfitPct must be 0–200';
  return null;
}

function badId(id) { return useDb() && !mongoose.isValidObjectId(id); }

router.get('/', async (req, res) => {
  if (useDb()) return res.json(await BotModel().find({ userId: req.user.id }).sort({ createdAt: -1 }));
  res.json(mem.bots.filter((b) => String(b.userId) === String(req.user.id)));
});

router.post('/', async (req, res) => {
  const { name, symbol = 'BTCUSDT', strategy, timeframe = '1h', capital, stopLossPct = 2, takeProfitPct = 4 } = req.body;
  const err = validateBotInput({ name, symbol, strategy, timeframe, capital: Number(capital), stopLossPct: Number(stopLossPct), takeProfitPct: Number(takeProfitPct) });
  if (err) return res.status(400).json({ error: err });
  const doc = { userId: req.user.id, name: String(name).trim(), symbol, strategy, timeframe, capital: Number(capital), stopLossPct: Number(stopLossPct), takeProfitPct: Number(takeProfitPct), status: 'stopped', position: { qty: 0, entryPrice: 0 } };
  if (useDb()) return res.status(201).json(await BotModel().create(doc));
  const b = { ...doc, _id: Date.now().toString(), createdAt: new Date() };
  mem.bots.push(b);
  res.status(201).json(b);
});

router.patch('/:id/:action', async (req, res) => {
  const { id, action } = req.params;
  if (!['start', 'stop'].includes(action)) return res.status(400).json({ error: 'bad action' });
  if (badId(id)) return res.status(404).json({ error: 'Not found' });
  const status = action === 'start' ? 'active' : 'stopped';
  if (useDb()) {
    const b = await BotModel().findOne({ _id: id, userId: req.user.id });
    if (!b) return res.status(404).json({ error: 'Not found' });
    b.status = status;
    await b.save();
    return res.json(b);
  }
  const b = mem.bots.find((x) => String(x._id) === String(id));
  if (!b) return res.status(404).json({ error: 'Not found' });
  b.status = status;
  res.json(b);
});

router.delete('/:id', async (req, res) => {
  if (badId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  if (useDb()) {
    await BotModel().deleteOne({ _id: req.params.id, userId: req.user.id });
    return res.json({ ok: true });
  }
  const i = mem.bots.findIndex((x) => String(x._id) === String(req.params.id));
  if (i >= 0) mem.bots.splice(i, 1);
  res.json({ ok: true });
});

module.exports = router;
