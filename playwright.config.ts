import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'test-reports/playwright' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'], viewport: { width: 1024, height: 1366 } },
    },
    {
      name: 'Mobile',
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
  ],
  timeout: 90000,
  expect: { timeout: 15000 },
});
