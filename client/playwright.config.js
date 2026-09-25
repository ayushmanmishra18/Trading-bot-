const { defineConfig } = require('@playwright/test');

const API_URL = process.env.E2E_API_URL || 'http://localhost:5000/api';
const WEB_URL = process.env.E2E_WEB_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false, // bots/backtest share one demo account — run serially
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  // Reuse the dev servers if already running (typical), else boot them.
  webServer: [
    {
      command: 'npm start',
      cwd: '../server',
      url: `${API_URL.replace(/\/api$/, '')}/api/health`,
      reuseExistingServer: true,
      timeout: 90000
    },
    {
      command: 'npm run dev',
      url: WEB_URL,
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
});
