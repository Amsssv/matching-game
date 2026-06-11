import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers';

// Landscape board guard: a phone (mobile UA) in landscape must use the WIDE grid
// pattern — more columns than rows — so cards aren't squeezed into the short
// viewport height. Portrait keeps the tall pattern (covered by other specs).
// Runs only on the `mobile` project (mobile UA → isMobileDevice() is true); the
// landscape viewport is set per-test.
test.describe('Landscape board layout', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'mobile', 'mobile UA only');
  });

  test('phone landscape uses the wide pattern (cols > rows)', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await page.evaluate(() => {
      const g = (window as { __game?: import('phaser').Game }).__game!;
      g.registry.set('difficulty', 'medium');
      g.registry.set('soundEnabled', false);
      g.scene.start('GameScene');
      g.scene.stop('MenuScene');
    });
    await page.waitForTimeout(700);

    const dims = await page.evaluate(() => {
      const scene = (window as { __game?: import('phaser').Game }).__game!
        .scene.getScene('GameScene') as unknown as { rowWidths: number[] };
      return { rows: scene.rowWidths.length, cols: Math.max(...scene.rowWidths) };
    });
    // medium wide pattern is [4,6,6,4] → 4 rows, 6 cols. Tall portrait would be the
    // opposite (6 rows, 4 cols), so cols > rows proves the landscape arrangement.
    expect(dims.cols).toBeGreaterThan(dims.rows);
  });
});
