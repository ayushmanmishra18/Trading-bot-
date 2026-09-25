const mongoose = require('mongoose');

const backtestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  symbol: String,
  strategy: String,
  timeframe: { type: String, default: '1h' },
  params: Object,
  result: Object
}, { timestamps: true });

module.exports = mongoose.model('Backtest', backtestSchema);
