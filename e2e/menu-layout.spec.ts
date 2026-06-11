import { test, expect } from '@playwright/test';

// Mobile-first layout guard: on small/short viewports the menu footer
// (bottom action pills + sound toggle) must be fully visible — never pushed
// off-screen and never under the reserved iOS sticky-banner strip.
// Assertion-based (not screenshots): checks the footer's bottom edge vs the
// viewport. Runs at the plain URL where the menu is the React overlay.

const SMALL = [
  { name: '320x568', width: 320, height: 568 }, // iPhone SE (1st gen) class
  { name: '360x640', width: 360, height: 640 }, // common small Android
];

const BANNER = 54; // matches STICKY_BANNER_H reserved in GameMount.tsx

test.describe('MainMenu — small-screen layout', () => {
  // Layout-only guard with explicit viewports — no per-project (UA/DPR) behavior.
  // Run once (on `desktop`) instead of redundantly across every Playwright project.
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop', 'runs once on desktop project');
  });

  for (const vp of SMALL) {
    test(`footer fully visible @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForSelector('[data-testid="menu"]', { state: 'visible' });
      await page.waitForTimeout(300); // settle scene transition

      const footer = await page.getByTestId('menu-footer').boundingBox();
      expect(footer).not.toBeNull();
      // Footer's bottom edge must sit within the viewport.
      expect(footer!.y + footer!.height).toBeLessThanOrEqual(vp.height + 1);

      // No scroll: every zone must fit on screen (nothing clipped by overflow:hidden).
      // Top of the difficulty grid and bottom of the Play button stay in the viewport.
      const diff = await page.getByTestId('difficulty').boundingBox();
      const play = await page.getByTestId('play').boundingBox();
      expect(diff!.y).toBeGreaterThanOrEqual(-1);
      expect(play!.y + play!.height).toBeLessThanOrEqual(vp.height + 1);
      // The whole document must not scroll vertically.
      const scrolls = await page.evaluate(() =>
        document.scrollingElement!.scrollHeight > document.scrollingElement!.clientHeight + 1);
      expect(scrolls).toBe(false);
    });

    test(`footer clears the iOS banner @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForSelector('[data-testid="menu"]', { state: 'visible' });
      // Emulate the Yandex sticky banner the same way GameMount does.
      await page.evaluate((h) => {
        document.documentElement.style.setProperty('--banner-height', `${h}px`);
      }, BANNER);
      await page.waitForTimeout(300); // settle reflow + transition

      const box = await page.getByTestId('menu-footer').boundingBox();
      expect(box).not.toBeNull();
      // Footer must sit ABOVE the reserved banner strip at the bottom.
      expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height - BANNER + 1);
    });
  }
});
