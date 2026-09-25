const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  symbol: { type: String, default: 'BTCUSDT' },
  strategy: { type: String, enum: ['SMA_CROSS', 'RSI_MEAN', 'MACD_TREND'], required: true },
  timeframe: { type: String, default: '1h' },
  capital: { type: Number, required: true },
  stopLossPct: { type: Number, default: 2 },
  takeProfitPct: { type: Number, default: 4 },
  status: { type: String, enum: ['active', 'stopped'], default: 'stopped' },
  position: {
    qty: { type: Number, default: 0 },
    entryPrice: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Bot', botSchema);
