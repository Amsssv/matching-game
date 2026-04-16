import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  snapshotDir: './e2e/__screenshots__',
  // Phaser WebGL renders non-deterministically across parallel workers.
  // Running sequentially ensures consistent GPU state for screenshot comparisons.
  workers: 1,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.10, timeout: 15000 },
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        deviceScaleFactor: 1,
      },
    },
  ],
});