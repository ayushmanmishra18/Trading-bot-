// Paper-trade executor + backtest loop shared logic.
const { getSignal } = require('./indicators');

const FEE = parseFloat(process.env.FEE_PCT || '0.001');

function runBacktest({ klines, strategy, capital = 10000 }) {
  let cash = capital;
  let qty = 0;
  let entry = 0;
  const equity = [];
  const trades = [];
  let peak = capital;
  let maxDD = 0;

  for (let i = 30; i < klines.length; i++) {
    const slice = klines.slice(0, i + 1);
    const price = klines[i].close;
    const signal = getSignal(strategy, slice);

    if (signal === 'BUY' && qty === 0 && cash > 10) {
      const fee = cash * FEE;
      qty = (cash - fee) / price;
      entry = price;
      cash = 0;
      trades.push({ side: 'BUY', price, qty, time: klines[i].openTime });
    } else if (signal === 'SELL' && qty > 0) {
      const proceeds = qty * price;
      const fee = proceeds * FEE;
      const pnl = proceeds - fee - (trades.length ? capital - cash : 0);
      cash = proceeds - fee;
      trades.push({ side: 'SELL', price, qty, time: klines[i].openTime, pnl: proceeds - fee - (trades[trades.length - 1].price * qty) });
      qty = 0;
    }
    const value = cash + qty * price;
    equity.push({ time: klines[i].openTime, value });
    peak = Math.max(peak, value);
    maxDD = Math.min(maxDD, (value - peak) / peak);
  }

  const lastPrice = klines[klines.length - 1].close;
  const finalValue = cash + qty * lastPrice;
  const wins = trades.filter((t) => (t.pnl || 0) > 0).length;
  const sells = trades.filter((t) => t.side === 'SELL').length;

  return {
    initial: capital,
    final: Math.round(finalValue * 100) / 100,
    returnsPct: Math.round(((finalValue - capital) / capital) * 10000) / 100,
    maxDrawdownPct: Math.round(maxDD * 10000) / 100,
    totalTrades: trades.length,
    winRatePct: sells ? Math.round((wins / sells) * 10000) / 100 : 0,
    equity: equity.filter((_, i) => i % 5 === 0),
    trades: trades.slice(-50)
  };
}

module.exports = { runBacktest, FEE };
