import { test, expect } from '@playwright/test';
import { waitForCanvas, pausePhaser, seedProgress } from './helpers';

const LANGS = ['ru', 'en', 'tr', 'es', 'pt'] as const;

for (const lang of LANGS) {
  test.describe(`store / ${lang}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((l: string) => {
        localStorage.setItem('sea-pairs-lang', l);
      }, lang);
      await seedProgress(page);   // suppress the daily auto-popup over the store screenshots
      await page.goto('/?canvas=1');
      await waitForCanvas(page);
      await page.waitForTimeout(1500);
    });

    test('menu', async ({ page }) => {
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`${lang}_menu.png`);
    });

    const startGameScene = async (page: import('@playwright/test').Page, l: string) => {
      await page.evaluate((lng: string) => {
        const g = (window as any).__game;
        g.registry.set('difficulty', 'medium');
        g.registry.set('soundEnabled', false);
        g.registry.set('lang', lng);
        g.scene.stop('MenuScene');
        g.scene.start('GameScene');
      }, l);
      // Wait until GameScene has dealt cards AND UIScene has registered the
      // 'game-complete' listener. Emitting the event before subscription is a
      // silent no-op → produces an empty/game screenshot instead of the modal.
      await page.waitForFunction(() => {
        const g = (window as any).__game;
        const gs = g?.scene?.getScene('GameScene') as any;
        if (!Array.isArray(gs?.cards) || gs.cards.length === 0) return false;
        // GameScene registers its own once-listener (count=1); UIScene adds
        // its handler in create() → count=2. Wait until both are present.
        return typeof gs.events.listenerCount === 'function'
          && gs.events.listenerCount('game-complete') >= 2;
      }, { timeout: 5000 });
    };

    test('game', async ({ page }) => {
      await startGameScene(page, lang);
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`${lang}_game.png`);
    });

    test('victory', async ({ page }) => {
      await startGameScene(page, lang);
      await pausePhaser(page);
      // Wake loop so the victory modal animation can run
      await page.evaluate(() => {
        const g = (window as any).__game;
        g?.loop.wake();
        g?.scene?.getScene('GameScene')?.events.emit('game-complete', 18);
      });
      // Wait until the React victory modal is actually rendered (it's a DOM overlay
      // now, not a Phaser object) — replaces a stale depth-20 Phaser check.
      await page.getByTestId('victory').waitFor({ state: 'visible', timeout: 5000 });
      // Let modal fade-in tween settle
      await page.waitForTimeout(400);
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`${lang}_victory.png`);
    });
  });
}