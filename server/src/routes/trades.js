const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const { mem } = require('../services/botEngine');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const useDb = mongoose.connection.readyState === 1;
  if (useDb) {
    const q = { userId: req.user.id };
    if (req.query.botId) q.botId = req.query.botId;
    return res.json(await require('../models/Trade').find(q).sort({ createdAt: -1 }).limit(200));
  }
  let t = mem.trades.filter((x) => String(x.userId) === String(req.user.id));
  if (req.query.botId) t = t.filter((x) => String(x.botId) === String(req.query.botId));
  res.json(t.slice(-200).reverse());
});

module.exports = router;
