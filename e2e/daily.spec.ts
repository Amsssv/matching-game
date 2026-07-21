import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers';

const KEY = 'sea-pairs-progress';

function todayLocal(): string {
  const n = new Date();
  return `${n.getFullYear()}-${`${n.getMonth() + 1}`.padStart(2, '0')}-${`${n.getDate()}`.padStart(2, '0')}`;
}

// Fresh progress, never claimed → a daily IS available (day 1). autoShownDate is
// stamped to today so it does NOT auto-pop here — this spec drives the 🎁 button
// flow. (The auto-pop path has its own test below.)
function seedButtonDriven({ k, today }: { k: string; today: string }) {
  if (localStorage.getItem(k)) return;
  localStorage.setItem(k, JSON.stringify({
    version: 3, pearls: 0,
    stats: { gamesPlayed: 0, gamesWon: 0, pairsMatched: 0, bestSeconds: { easy: null, medium: null, hard: null, expert: null }, winsByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 } },
    unlocked: [], equipped: { seaTheme: 'sea.lagoon', cardBack: 'back.classic', uiPalette: 'ui.ocean' },
    streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null, autoShownDate: today },
  }));
}

// Same, but never auto-shown → the reward auto-pops on the first menu entry.
function seedAutoPop(k: string) {
  if (localStorage.getItem(k)) return;
  localStorage.setItem(k, JSON.stringify({
    version: 3, pearls: 0,
    stats: { gamesPlayed: 0, gamesWon: 0, pairsMatched: 0, bestSeconds: { easy: null, medium: null, hard: null, expert: null }, winsByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 } },
    unlocked: [], equipped: { seaTheme: 'sea.lagoon', cardBack: 'back.classic', uiPalette: 'ui.ocean' },
    streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null, autoShownDate: null },
  }));
}

test.describe('Daily streak (button-driven)', () => {
  test('no auto-popup; 🎁 button opens it, claim awards + persists, reopen shows claimed state', async ({ page }) => {
    await page.addInitScript(seedButtonDriven, { k: KEY, today: todayLocal() });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    // No auto-popup — the modal is NOT shown on load.
    await expect(page.getByTestId('daily')).toHaveCount(0);

    // The button is present and shows the "available" badge (its only child <span>) when a claim is pending.
    const btn = page.getByTestId('daily-open');
    await expect(btn).toBeVisible();
    expect(await btn.locator('span').count()).toBe(1);

    // Open via the button → claimable (day 1).
    await btn.click();
    await expect(page.getByTestId('daily')).toBeVisible();
    await page.getByTestId('daily-claim').click();

    // Day 1 = 10 pearls; streak advances to 1; persisted.
    await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).pearls, KEY)).toBe(10);
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
    expect(saved.streak.current).toBe(1);

    await page.getByTestId('daily-close').click();

    // Badge is gone now (already claimed today).
    await expect.poll(() => btn.locator('span').count()).toBe(0);

    // Reopen → claimed state: no claim button (already claimed today).
    await btn.click();
    await expect(page.getByTestId('daily')).toBeVisible();
    await expect(page.getByTestId('daily-claim')).toHaveCount(0);
  });
});

test.describe('Daily streak (auto-open)', () => {
  test('auto-pops on first menu entry when claimable; does not re-pop the same day', async ({ page }) => {
    await page.addInitScript(seedAutoPop, KEY);
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    // Pops by itself (no click) shortly after the menu appears.
    await expect(page.getByTestId('daily')).toBeVisible();
    // autoShownDate is stamped + persisted so it won't fire again today.
    await expect
      .poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).streak.autoShownDate, KEY))
      .not.toBeNull();

    // Close WITHOUT claiming (Esc — the unclaimed modal has no close button), reload
    // → must stay closed the same day.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('daily')).toHaveCount(0);
    await page.reload();
    await waitForCanvas(page);
    await page.waitForTimeout(1200);   // well past the ~600ms auto-open delay
    await expect(page.getByTestId('daily')).toHaveCount(0);
  });
});
