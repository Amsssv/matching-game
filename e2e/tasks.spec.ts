import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers';

const KEY = 'sea-pairs-progress';

// Seed a v4 progress with gamesWon:1 → the `firstWin` achievement is claimable
// (so the 📋 badge shows). Quests board is empty in the seed; main.tsx's
// ensureTodayQuests seeds today's 3 on load.
function seed(k: string) {
  if (localStorage.getItem(k)) return;
  const n = new Date();
  const today = `${n.getFullYear()}-${`${n.getMonth() + 1}`.padStart(2, '0')}-${`${n.getDate()}`.padStart(2, '0')}`;
  localStorage.setItem(k, JSON.stringify({
    version: 4, pearls: 0,
    stats: { gamesPlayed: 5, gamesWon: 1, pairsMatched: 6, bestSeconds: { easy: null, medium: null, hard: null, expert: null }, winsByDifficulty: { easy: 1, medium: 0, hard: 0, expert: 0 }, perfectWins: 0, fastWins: 0, pearlsEarnedTotal: 0 },
    unlocked: [], equipped: { seaTheme: 'sea.lagoon', cardBack: 'back.classic', uiPalette: 'ui.ocean' },
    // Stamp today so the daily reward doesn't auto-pop over the tasks flow.
    streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null, autoShownDate: today },
    quests: { date: null, active: [], rerolls: 0 },
    achievements: { claimed: [] },
  }));
}

test.describe('Tasks (quests + achievements)', () => {
  test('badge; open; quests board seeded; claim a ready achievement → pearls + persist', async ({ page }) => {
    await page.addInitScript(seed, KEY);
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    // 📋 button shows the claimable badge (firstWin is ready).
    const btn = page.getByTestId('tasks-open');
    await expect(btn).toBeVisible();
    expect(await btn.locator('span').count()).toBe(1);

    await btn.click();
    await expect(page.getByTestId('tasks')).toBeVisible();

    // Quests tab (default) shows today's 3-quest board (seeded at startup).
    expect(await page.getByTestId('tasks').locator('[data-testid^="quest-"]').count()).toBe(3);

    // Achievements tab → claim the ready firstWin → +10 pearls, persisted.
    await page.getByTestId('tasks-tab-achievements').click();
    await page.getByTestId('ach-firstWin').getByRole('button').click();
    await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).pearls, KEY)).toBe(10);
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
    expect(saved.achievements.claimed).toContain('firstWin');

    // The only claimable was firstWin → after claiming, the badge clears.
    await page.getByTestId('tasks-close').click();
    await expect.poll(() => btn.locator('span').count()).toBe(0);
  });
});
