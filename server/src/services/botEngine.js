// Live bot loop: every 20s check active bots -> indicator -> paper trade.
// Works with MongoDB, falls back to in-memory store for demo.
const cron = require('node-cron');
const { getKlines, getPrice } = require('./binance');
const { getSignal } = require('./indicators');
const { FEE } = require('./backtestEngine');

const mem = { bots: [], trades: [], users: new Map() };

function store() {
  const mongoose = require('mongoose');
  const useDb = mongoose.connection.readyState === 1;
  return useDb ? 'db' : 'mem';
}

async function listActiveBots() {
  if (store() === 'db') {
    const Bot = require('../models/Bot');
    return Bot.find({ status: 'active' });
  }
  return mem.bots.filter((b) => b.status === 'active');
}

async function saveTrade(trade) {
  if (store() === 'db') {
    const Trade = require('../models/Trade');
    return Trade.create(trade);
  }
  const t = { ...trade, _id: Date.now().toString(), createdAt: new Date() };
  mem.trades.push(t);
  return t;
}

async function updateBot(bot, patch) {
  Object.assign(bot, patch);
  if (bot.save) await bot.save();
  return bot;
}

async function tick() {
  let bots;
  try {
    bots = await listActiveBots();
  } catch (e) {
    // DB flap must never kill the scheduler process.
    console.log('[bot] list error', e.message);
    return;
  }
  for (const bot of bots) {
    try {
      const klines = await getKlines(bot.symbol, bot.timeframe || '1h', 100);
      const price = (await getPrice(bot.symbol)).price;
      const signal = getSignal(bot.strategy, klines);

      // Stop-loss / take-profit check on open position
      if (bot.position && bot.position.qty > 0) {
        const chg = ((price - bot.position.entryPrice) / bot.position.entryPrice) * 100;
        if (chg <= -(bot.stopLossPct || 2) || chg >= (bot.takeProfitPct || 4)) {
          const proceeds = bot.position.qty * price;
          const fee = proceeds * FEE;
          await saveTrade({ userId: bot.userId, botId: bot._id, symbol: bot.symbol, side: 'SELL', qty: bot.position.qty, price, fee, pnl: proceeds - fee - bot.capital, reason: 'SL/TP' });
          await updateBot(bot, { status: 'stopped', position: { qty: 0, entryPrice: 0 } });
          continue;
        }
      }

      if (signal === 'BUY' && (!bot.position || bot.position.qty === 0)) {
        const qty = (bot.capital * (1 - FEE)) / price;
        await saveTrade({ userId: bot.userId, botId: bot._id, symbol: bot.symbol, side: 'BUY', qty, price, fee: bot.capital * FEE, reason: bot.strategy });
        await updateBot(bot, { position: { qty, entryPrice: price } });
      } else if (signal === 'SELL' && bot.position && bot.position.qty > 0) {
        const proceeds = bot.position.qty * price;
        const fee = proceeds * FEE;
        await saveTrade({ userId: bot.userId, botId: bot._id, symbol: bot.symbol, side: 'SELL', qty: bot.position.qty, price, fee, pnl: proceeds - fee - bot.capital, reason: bot.strategy });
        await updateBot(bot, { position: { qty: 0, entryPrice: 0 } });
      }
    } catch (e) {
      console.log('[bot] tick error', bot.symbol, e.message);
    }
  }
}

function startBotLoop() {
  // Every 20 seconds — deterministic, sleep-tolerant, easy to reason about.
  cron.schedule('*/20 * * * * *', () => tick().catch((e) => console.log('[bot] tick error', e.message)));
  console.log('[bot] loop started (20s)');
}

module.exports = { startBotLoop, tick, mem };
