const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['BUY', 'SELL'], required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  pnl: { type: Number, default: 0 },
  reason: { type: String, default: 'signal' }
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);
