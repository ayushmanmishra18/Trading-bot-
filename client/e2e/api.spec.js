const { test, expect } = require('@playwright/test');

const API = process.env.E2E_API_URL || 'http://localhost:5000/api';
let token;

test.beforeAll(async ({ request }) => {
  // Fresh throwaway account proves register; demo account proves seeded login.
  const email = `e2e${Date.now()}@t.co`;
  const reg = await request.post(`${API}/auth/register`, {
    data: { name: 'E2E', email, password: '123456' }
  });
  expect(reg.status()).toBe(200);
  const body = await reg.json();
  expect(body.token.length).toBeGreaterThan(20);
  expect(body.user.cash).toBe(100000);

  const login = await request.post(`${API}/auth/login`, {
    data: { email: 'demo@tradepilot.app', password: 'demo1234' }
  });
  expect(login.status()).toBe(200);
  token = (await login.json()).token;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

test('health is ok', async ({ request }) => {
  const r = await request.get(`${API}/health`);
  expect(r.status()).toBe(200);
  expect((await r.json()).ok).toBe(true);
});

test('unknown route is JSON 404', async ({ request }) => {
  const r = await request.get(`${API}/nope`);
  expect(r.status()).toBe(404);
});

test('protected routes reject missing token with 401', async ({ request }) => {
  for (const u of ['/bots', '/portfolio', '/trades', '/backtest']) {
    const r = u === '/backtest'
      ? await request.post(`${API}${u}`, { data: {} })
      : await request.get(`${API}${u}`);
    expect(r.status(), u).toBe(401);
  }
});

test('login validation rejects bad input with 400', async ({ request }) => {
  const r = await request.post(`${API}/auth/login`, { data: { email: 'nope', password: 'x' } });
  expect(r.status()).toBe(400);
});

test('market prices: 4 live symbols', async ({ request }) => {
  const r = await request.get(`${API}/market/prices`);
  expect(r.status()).toBe(200);
  const p = await r.json();
  expect(p).toHaveLength(4);
  for (const q of p) expect(q.price).toBeGreaterThan(0);
});

test('klines + single price', async ({ request }) => {
  const k = await request.get(`${API}/market/klines/BTCUSDT?interval=1h&limit=5`);
  expect(k.status()).toBe(200);
  const candles = await k.json();
  expect(candles).toHaveLength(5);
  expect(candles[0].close).toBeGreaterThan(0);
  const s = await request.get(`${API}/market/price/ETHUSDT`);
  expect((await s.json()).price).toBeGreaterThan(0);
});

test('market validation: bad interval + bad symbol are 400', async ({ request }) => {
  expect((await request.get(`${API}/market/klines/BTCUSDT?interval=9x`)).status()).toBe(400);
  expect((await request.get(`${API}/market/price/!!!`)).status()).toBe(400);
});

test('backtest validation is 400', async ({ request }) => {
  const r = await request.post(`${API}/backtest`, {
    headers: auth(), data: { symbol: 'XXX', strategy: 'NOPE', capital: -5 }
  });
  expect(r.status()).toBe(400);
});

test('backtest happy path computes results', async ({ request }) => {
  const r = await request.post(`${API}/backtest`, {
    headers: auth(), data: { symbol: 'BTCUSDT', strategy: 'SMA_CROSS', timeframe: '1h', capital: 10000 }
  });
  expect(r.status()).toBe(200);
  const b = await r.json();
  expect(b.final).toBeGreaterThan(0);
  expect(b.equity.length).toBeGreaterThan(10);
  expect(b.totalTrades).toBeGreaterThanOrEqual(0);
});

test('bot lifecycle: create → start → stop → delete', async ({ request }) => {
  const name = `E2E ${Date.now()}`;
  const c = await request.post(`${API}/bots`, {
    headers: auth(),
    data: { name, symbol: 'SOLUSDT', strategy: 'RSI_MEAN', timeframe: '1h', capital: 1500 }
  });
  expect(c.status()).toBe(201);
  const bot = await c.json();
  expect(bot.status).toBe('stopped');

  const bad = await request.post(`${API}/bots`, {
    headers: auth(), data: { name: 'x', strategy: 'NOPE', capital: -1 }
  });
  expect(bad.status()).toBe(400);

  const gone = await request.patch(`${API}/bots/abc/start`, { headers: auth() });
  expect(gone.status()).toBe(404);

  const start = await request.patch(`${API}/bots/${bot._id}/start`, { headers: auth() });
  expect((await start.json()).status).toBe('active');

  const pf = await request.get(`${API}/portfolio`, { headers: auth() });
  expect((await pf.json()).total).toBeGreaterThan(0);

  const stop = await request.patch(`${API}/bots/${bot._id}/stop`, { headers: auth() });
  expect((await stop.json()).status).toBe('stopped');

  const tr = await request.get(`${API}/trades`, { headers: auth() });
  expect(tr.status()).toBe(200);

  const del = await request.delete(`${API}/bots/${bot._id}`, { headers: auth() });
  expect((await del.json()).ok).toBe(true);
});
