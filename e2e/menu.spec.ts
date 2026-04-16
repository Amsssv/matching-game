import { test, expect } from '@playwright/test';
import { waitForCanvas, pausePhaser, resumePhaser } from './helpers';

test.describe('MenuScene', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    // Extra settle time: BootScene font-load + MenuScene 300ms fadeIn
    await page.waitForTimeout(500);
  });

  test('default state', async ({ page }) => {
    await pausePhaser(page);
    await expect(page).toHaveScreenshot('menu-default.png');
    await resumePhaser(page);
  });

  for (const diff of ['easy', 'medium', 'hard', 'expert'] as const) {
    test(`difficulty selected: ${diff}`, async ({ page }) => {
      await page.evaluate((d) => {
        const game = (window as any).__game;
        game.registry.set('difficulty', d);
        game.scene.getScene('MenuScene').scene.restart();
      }, diff);
      await page.waitForTimeout(400);
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`menu-difficulty-${diff}.png`);
      await resumePhaser(page);
    });
  }

  test('sound toggled off', async ({ page }) => {
    await page.evaluate(() => {
      const game = (window as any).__game;
      game.registry.set('soundEnabled', false);
      game.scene.getScene('MenuScene').scene.restart();
    });
    await page.waitForTimeout(400);
    await pausePhaser(page);
    await expect(page).toHaveScreenshot('menu-sound-off.png');
    await resumePhaser(page);
  });
});

test.describe('MenuScene — language variants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await page.waitForTimeout(500);
  });

  for (const lang of ['ru', 'en', 'tr', 'es', 'pt', 'ar'] as const) {
    test(`language: ${lang}`, async ({ page }) => {
      if (lang !== 'ru') {
        await page.evaluate((l) => {
          const game = (window as any).__game;
          game.registry.set('lang', l);
          game.scene.getScene('MenuScene').scene.restart();
        }, lang);
        await page.waitForTimeout(500);
      }
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`menu-lang-${lang}.png`);
      await resumePhaser(page);
    });
  }
});