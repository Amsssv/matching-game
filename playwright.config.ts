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
    {
      // Runs only interaction tests (click-based) at real mobile DPR=2.
      // This project would have caught the displayScale double-mapping bug:
      // with displayScale(2,2) + CSS scale(0.5), all taps landed 2× off target
      // and the victory test would time out instead of completing.
      name: 'mobile-dpr2',
      testMatch: '**/game.spec.ts',
      use: {
        ...devices['Pixel 5'],
        deviceScaleFactor: 2,
      },
    },
  ],
});