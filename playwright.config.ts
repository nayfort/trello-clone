import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run test:server',
    url: 'http://127.0.0.1:3100/api/health',
    timeout: 180000,
    reuseExistingServer: false,
  },
});
