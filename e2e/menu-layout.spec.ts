import { test, expect } from '@playwright/test';
import { seedProgress } from './helpers';

// Mobile-first layout guard: on small/short viewports the menu footer
// (bottom action pills + sound toggle) must be fully visible — never pushed
// off-screen and the center content must fit without scrolling.
// Assertion-based (not screenshots): checks the footer's bottom edge vs the
// viewport. Runs at the plain URL where the menu is the React overlay.
// (No banner test: the Yandex sticky banner shrinks the viewport, so the
// inset:0 overlay already sits above it — the menu reserves no banner space.)

const SMALL = [
  { name: '320x568', width: 320, height: 568 }, // iPhone SE (1st gen) class
  { name: '360x640', width: 360, height: 640 }, // common small Android
];

test.describe('MainMenu — small-screen layout', () => {
  // Layout-only guard with explicit viewports — no per-project (UA/DPR) behavior.
  // Run once (on `desktop`) instead of redundantly across every Playwright project.
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop', 'runs once on desktop project');
  });

  for (const vp of SMALL) {
    test(`footer fully visible @ ${vp.name}`, async ({ page }) => {
      await seedProgress(page);   // suppress the daily auto-popup during layout measurement
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForSelector('[data-testid="menu"]', { state: 'visible' });
      await page.waitForTimeout(300); // settle scene transition

      const footer = await page.getByTestId('menu-footer').boundingBox();
      expect(footer).not.toBeNull();
      // Footer's bottom edge must sit within the viewport.
      expect(footer!.y + footer!.height).toBeLessThanOrEqual(vp.height + 1);

      // No scroll: every zone must fit on screen (nothing clipped by overflow:hidden).
      // Top and bottom of the mode picker stay in the viewport.
      const modes = await page.getByTestId('modes').boundingBox();
      expect(modes).not.toBeNull();
      expect(modes!.y).toBeGreaterThanOrEqual(-1);
      expect(modes!.y + modes!.height).toBeLessThanOrEqual(vp.height + 1);
      // The whole document must not scroll vertically.
      const scrolls = await page.evaluate(() =>
        document.scrollingElement!.scrollHeight > document.scrollingElement!.clientHeight + 1);
      expect(scrolls).toBe(false);
    });
  }
});
