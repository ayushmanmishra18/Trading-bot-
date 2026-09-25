const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const { mem } = require('../services/botEngine');

const router = express.Router();
router.use(auth);

function useDb() { return mongoose.connection.readyState === 1; }
function BotModel() { return require('../models/Bot'); }

router.get('/', async (req, res) => {
  if (useDb()) return res.json(await BotModel().find({ userId: req.user.id }).sort({ createdAt: -1 }));
  res.json(mem.bots.filter((b) => String(b.userId) === String(req.user.id)));
});

router.post('/', async (req, res) => {
  const { name, symbol = 'BTCUSDT', strategy, timeframe = '1h', capital, stopLossPct = 2, takeProfitPct = 4 } = req.body;
  if (!name || !strategy || !capital) return res.status(400).json({ error: 'name, strategy, capital required' });
  const doc = { userId: req.user.id, name, symbol, strategy, timeframe, capital, stopLossPct, takeProfitPct, status: 'stopped', position: { qty: 0, entryPrice: 0 } };
  if (useDb()) return res.status(201).json(await BotModel().create(doc));
  const b = { ...doc, _id: Date.now().toString(), createdAt: new Date() };
  mem.bots.push(b);
  res.status(201).json(b);
});

router.patch('/:id/:action', async (req, res) => {
  const { id, action } = req.params;
  if (!['start', 'stop'].includes(action)) return res.status(400).json({ error: 'bad action' });
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
  if (useDb()) {
    await BotModel().deleteOne({ _id: req.params.id, userId: req.user.id });
    return res.json({ ok: true });
  }
  const i = mem.bots.findIndex((x) => String(x._id) === String(req.params.id));
  if (i >= 0) mem.bots.splice(i, 1);
  res.json({ ok: true });
});

module.exports = router;
