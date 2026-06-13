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

  test('leaderboard panel', async ({ page }) => {
    // Open via the real React path — the old Phaser `openLeaderboardModal` was
    // removed in the React migration. Difficulty defaults to 'medium'; select it
    // explicitly so the (SDK-less) mock leaderboard rows are deterministic.
    await page.getByTestId('diff-medium').click();
    await page.getByTestId('leaderboard-open').click();
    await expect(page.getByTestId('leaderboard')).toBeVisible();
    // Wait for the async mock data to land (null → loading, then lb-table renders).
    await expect(page.getByTestId('lb-table')).toBeVisible();
    await page.waitForTimeout(400); // modal fade-in settle
    await pausePhaser(page);
    await expect(page).toHaveScreenshot('menu-leaderboard.png');
    await resumePhaser(page);
  });
});

test.describe('MenuScene — language variants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await page.waitForTimeout(500);
  });

  // Play-button text per language — wait for the overlay to actually re-render in the
  // target language before snapshotting (lang propagation is async; a fixed wait races it).
  const PLAY_TEXT: Record<string, string> = {
    ru: 'НАЧАТЬ ИГРУ', en: 'START GAME', tr: 'OYUNA BAŞLA',
    es: 'INICIAR JUEGO', pt: 'INICIAR JOGO', ar: 'ابدأ اللعبة',
  };
  for (const lang of ['ru', 'en', 'tr', 'es', 'pt', 'ar'] as const) {
    test(`language: ${lang}`, async ({ page }) => {
      if (lang !== 'ru') {
        // Switch language through the real UI (globe → option) so it runs the production
        // cmd:set-lang → setLang path, which disables render-on-demand across the
        // scene.restart. A direct registry.set + restart races the sleeping menu loop.
        await page.getByTestId('lang-trigger').click();
        await page.getByTestId(`lang-${lang}`).click();
      }
      await expect(page.getByTestId('play')).toContainText(PLAY_TEXT[lang]);
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`menu-lang-${lang}.png`);
      await resumePhaser(page);
    });
  }
});