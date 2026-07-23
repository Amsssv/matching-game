import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers';

// A leveled player (xp 2700 → level 10, all modes unlocked) with distinct best times
// per mode: classic lives in bestSeconds, the others in modeBests.
const SEED = {
  version: 4, pearls: 0,
  stats: {
    xp: 2700, gamesPlayed: 10, gamesWon: 8, pairsMatched: 40,
    bestSeconds: { easy: 6, medium: 22, hard: 48, expert: 95 },
    modeBests: {
      timeAttack: { easy: 9, medium: 28, hard: 61, expert: null },
      survival:   { easy: 14, medium: 40, hard: null, expert: null },
      noMistakes: { easy: 33, medium: null, hard: null, expert: null },
    },
  },
};

test.describe('Profile — records per mode', () => {
  test('mode tabs switch which mode\'s best times are shown', async ({ page }) => {
    await page.addInitScript((seed) => {
      const now = new Date();
      const today = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`;
      localStorage.setItem('sea-pairs-progress', JSON.stringify({
        ...seed,
        streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null, autoShownDate: today },
      }));
    }, SEED);
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    await page.getByTestId('profile-open').click();
    const modal = page.getByTestId('profile');
    await expect(modal).toBeVisible();

    // All four modes are unlocked at level 10 → four tabs.
    await expect(page.getByTestId('profile-mode-classic')).toBeVisible();
    await expect(page.getByTestId('profile-mode-timeAttack')).toBeVisible();
    await expect(page.getByTestId('profile-mode-noMistakes')).toBeVisible();

    // Default tab = classic: easy best is 0:06.
    await expect(modal).toContainText('0:06');

    // Switch to Time Attack: easy best is 0:09, and classic's 0:06 is no longer shown.
    await page.getByTestId('profile-mode-timeAttack').click();
    await expect(modal).toContainText('0:09');
    await expect(modal).not.toContainText('0:06');

    // Survival easy best is 0:14.
    await page.getByTestId('profile-mode-survival').click();
    await expect(modal).toContainText('0:14');
  });
});
