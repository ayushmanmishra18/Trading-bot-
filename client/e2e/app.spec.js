const { test, expect } = require('@playwright/test');

const API = process.env.E2E_API_URL || 'http://localhost:5000/api';
const DEMO = { email: 'demo@tradepilot.app', password: 'demo1234' };

async function apiToken(request) {
  const r = await request.post(`${API}/auth/login`, { data: DEMO });
  expect(r.status()).toBe(200);
  return (await r.json()).token;
}

async function loginAs(page, request) {
  const token = await apiToken(request);
  await page.addInitScript((t) => localStorage.setItem('token', t), token);
}

test('all pages render the TradePilot shell', async ({ page }) => {
  for (const u of ['/', '/login', '/bots', '/backtest', '/history', '/markets/BTCUSDT']) {
    await page.goto(u);
    await expect(page.getByText('TradePilot terminal', { exact: false }).first()).toBeVisible();
  }
});

test('login form signs in and lands on Desk', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('you@firm.com').fill(DEMO.email);
  await page.locator('input[type="password"]').fill(DEMO.password);
  await page.getByRole('button', { name: /enter terminal/i }).click();
  await page.waitForURL('/');
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token && token.length).toBeGreaterThan(20);
  await expect(page.getByText('Good evening, trader.')).toBeVisible();
});

test('dashboard unlocks portfolio when authed', async ({ page, request }) => {
  await loginAs(page, request);
  await page.goto('/');
  await expect(page.getByText('Net worth', { exact: false }).first()).toBeVisible();
  // Net worth shows a dollar figure once /api/portfolio resolves (not a skeleton).
  await expect(page.locator('.num').first()).toContainText('$', { timeout: 20000 });
});

test('bots: deploy → start → stop → retire via UI', async ({ page, request }) => {
  await loginAs(page, request);
  await page.goto('/bots');
  const name = `PW ${Date.now()}`;
  await page.getByPlaceholder('e.g. Night Owl BTC').fill(name);
  await page.getByRole('button', { name: /deploy/i }).click();
  const card = page.locator('.panel', { hasText: name });
  await expect(card).toBeVisible({ timeout: 15000 });

  await card.locator('.switch').click(); // start
  await expect(card.getByText(/running — tap to stop/i)).toBeVisible({ timeout: 15000 });
  await card.locator('.switch').click(); // stop
  await expect(card.getByText(/stopped — tap to run/i)).toBeVisible({ timeout: 15000 });

  page.once('dialog', (d) => d.accept());
  await card.getByRole('button', { name: /retire/i }).click();
  await expect(page.locator('.panel', { hasText: name })).toHaveCount(0, { timeout: 15000 });
});

test('backtest lab produces a verdict + equity chart', async ({ page, request }) => {
  await loginAs(page, request);
  await page.goto('/backtest');
  await page.getByRole('button', { name: /run replay/i }).click();
  await expect(page.getByText(/beats buy-and-hold|underperforms/i)).toBeVisible({ timeout: 60000 });
  await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
});

test('ledger shows history UI when authed', async ({ page, request }) => {
  await loginAs(page, request);
  await page.goto('/history');
  await expect(page.getByText('Execution history.')).toBeVisible();
  await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible();
});

test('market terminal draws candles', async ({ page }) => {
  await page.goto('/markets/SOLUSDT');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: '4h' }).click();
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
});
