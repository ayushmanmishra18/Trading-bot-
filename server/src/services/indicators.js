const { SMA, RSI, MACD } = require('technicalindicators');

function closes(klines) { return klines.map((k) => k.close); }

function smaSignal(klines, fast = 9, slow = 21) {
  const c = closes(klines);
  const f = SMA.calculate({ period: fast, values: c });
  const s = SMA.calculate({ period: slow, values: c });
  if (f.length < 2 || s.length < 2) return 'HOLD';
  const prev = f[f.length - 2] - s[s.length - 2];
  const last = f[f.length - 1] - s[s.length - 1];
  if (prev <= 0 && last > 0) return 'BUY';
  if (prev >= 0 && last < 0) return 'SELL';
  return 'HOLD';
}

function rsiSignal(klines, period = 14, low = 30, high = 70) {
  const r = RSI.calculate({ period, values: closes(klines) });
  if (!r.length) return 'HOLD';
  const last = r[r.length - 1];
  if (last < low) return 'BUY';
  if (last > high) return 'SELL';
  return 'HOLD';
}

function macdSignal(klines) {
  const m = MACD.calculate({
    fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false, values: closes(klines)
  });
  if (m.length < 2) return 'HOLD';
  const prev = m[m.length - 2].MACD - m[m.length - 2].signal;
  const last = m[m.length - 1].MACD - m[m.length - 1].signal;
  if (prev <= 0 && last > 0) return 'BUY';
  if (prev >= 0 && last < 0) return 'SELL';
  return 'HOLD';
}

function getSignal(strategy, klines) {
  if (strategy === 'SMA_CROSS') return smaSignal(klines);
  if (strategy === 'RSI_MEAN') return rsiSignal(klines);
  if (strategy === 'MACD_TREND') return macdSignal(klines);
  return 'HOLD';
}

module.exports = { getSignal, smaSignal, rsiSignal, macdSignal };
