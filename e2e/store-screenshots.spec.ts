import { test, expect } from '@playwright/test';
import { waitForCanvas, pausePhaser } from './helpers';

const LANGS = ['ru', 'en', 'tr', 'es', 'pt', 'ar'] as const;
type Lang = typeof LANGS[number];

for (const lang of LANGS) {
  test.describe(`store / ${lang}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((l: string) => {
        localStorage.setItem('sea-pairs-lang', l);
      }, lang);
      await page.goto('/?canvas=1');
      await waitForCanvas(page);
      await page.waitForTimeout(1500);
    });

    test('menu', async ({ page }) => {
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`${lang}_menu.png`);
    });

    test('game', async ({ page }) => {
      await page.evaluate((l: string) => {
        const g = (window as any).__game;
        g.registry.set('difficulty', 'medium');
        g.registry.set('soundEnabled', false);
        g.registry.set('lang', l);
        g.scene.stop('MenuScene');
        g.scene.start('GameScene');
      }, lang);
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`${lang}_game.png`);
    });

    test('victory', async ({ page }) => {
      await page.evaluate((l: string) => {
        const g = (window as any).__game;
        g.registry.set('difficulty', 'medium');
        g.registry.set('soundEnabled', false);
        g.registry.set('lang', l);
        g.scene.stop('MenuScene');
        g.scene.start('GameScene');
      }, lang);
      await pausePhaser(page);
      // Wake loop so the victory modal animation can run
      await page.evaluate(() => {
        const g = (window as any).__game;
        g?.loop.wake();
        g?.scene?.getScene('GameScene')?.events.emit('game-complete', 18);
      });
      await page.waitForTimeout(1500);
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`${lang}_victory.png`);
    });
  });
}