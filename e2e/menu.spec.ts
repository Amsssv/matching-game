import { test, expect } from '@playwright/test';
import { waitForCanvas, pausePhaser, resumePhaser, seedProgress } from './helpers';

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

  test('mode picker: all modes unlocked at level 5', async ({ page }) => {
    // beforeEach already loaded the page as a fresh player; re-seed and reload.
    await seedProgress(page, { xp: 700 });
    await page.reload();
    await waitForCanvas(page);
    await page.waitForTimeout(500);
    await expect(page.getByTestId('mode-noMistakes')).toBeEnabled();
    await pausePhaser(page);
    await expect(page).toHaveScreenshot('menu-modes-unlocked.png');
    await resumePhaser(page);
  });

  test('mode start modal (difficulty select)', async ({ page }) => {
    await seedProgress(page, { xp: 700 });
    await page.reload();
    await waitForCanvas(page);
    await page.waitForTimeout(500);
    await page.getByTestId('mode-timeAttack').click();
    await expect(page.getByTestId('mode-start')).toBeVisible();
    await page.waitForTimeout(400); // modal fade-in settle
    await pausePhaser(page);
    await expect(page).toHaveScreenshot('menu-mode-start.png');
    await resumePhaser(page);
  });

  test('locked modes are disabled for a fresh player', async ({ page }) => {
    await expect(page.getByTestId('mode-classic')).toBeEnabled();
    await expect(page.getByTestId('mode-timeAttack')).toBeDisabled();
    await expect(page.getByTestId('mode-survival')).toBeDisabled();
    await expect(page.getByTestId('mode-noMistakes')).toBeDisabled();
  });

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
    // removed in the React migration. Difficulty defaults to 'medium' in the ui
    // store, so the (SDK-less) mock leaderboard rows are deterministic without
    // any selection click.
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

  // Classic mode-card label per language — wait for the overlay to actually re-render in the
  // target language before snapshotting (lang propagation is async; a fixed wait races it).
  const MODE_TEXT: Record<string, string> = {
    ru: 'КЛАССИКА', en: 'CLASSIC', tr: 'KLASİK',
    es: 'CLÁSICO', pt: 'CLÁSSICO', ar: 'كلاسيكي',
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
      await expect(page.getByTestId('mode-classic')).toContainText(MODE_TEXT[lang]);
      await pausePhaser(page);
      await expect(page).toHaveScreenshot(`menu-lang-${lang}.png`);
      await resumePhaser(page);
    });
  }
});