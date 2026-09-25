const axios = require('axios');

const BINANCE = 'https://api.binance.com';
const cache = new Map(); // key -> { ts, data }

function cached(key, ms, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ms) return Promise.resolve(hit.data);
  return fn().then((data) => { cache.set(key, { ts: Date.now(), data }); return data; });
}

async function getPrice(symbol) {
  return cached(`price-${symbol}`, 5000, async () => {
    const { data } = await axios.get(`${BINANCE}/api/v3/ticker/price`, { params: { symbol } });
    return { symbol, price: parseFloat(data.price) };
  });
}

async function get24h(symbol) {
  return cached(`24h-${symbol}`, 15000, async () => {
    const { data } = await axios.get(`${BINANCE}/api/v3/ticker/24hr`, { params: { symbol } });
    return {
      symbol,
      price: parseFloat(data.lastPrice),
      changePct: parseFloat(data.priceChangePercent),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      volume: parseFloat(data.volume)
    };
  });
}

async function getKlines(symbol, interval = '1h', limit = 200) {
  return cached(`kl-${symbol}-${interval}-${limit}`, 15000, async () => {
    const { data } = await axios.get(`${BINANCE}/api/v3/klines`, { params: { symbol, interval, limit } });
    return data.map((k) => ({
      openTime: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));
  });
}

module.exports = { getPrice, get24h, getKlines };
