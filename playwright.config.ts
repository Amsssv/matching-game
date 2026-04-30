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
    // ── Store screenshot projects ─────────────────────────────────────────────
    // CSS 360×640 × dpr3 → physical 1080×1920 (9:16 portrait, Yandex mobile).
    // Pixel 5 (Chromium) is used instead of iPhone 12 (WebKit) — WebKit is not
    // installed. Android UA still satisfies isMobileDevice() → 2×2 grid layout.
    {
      name: 'store-mobile',
      testMatch: '**/store-screenshots.spec.ts',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 3,
      },
    },
    // 1280×720 (16:9 landscape, Yandex desktop)
    {
      name: 'store-desktop',
      testMatch: '**/store-screenshots.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      },
    },
  ],
});