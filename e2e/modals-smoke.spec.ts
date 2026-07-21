import { test, expect } from '@playwright/test';
import { waitForCanvas, goToGameScene, getActualDeck, clickCard, waitForGameUnlocked, seedProgress } from './helpers';

// Smoke test: every modal in the app opens (and the dismissible ones close).
// Visibility-only — no screenshots/baselines. Guards against a broken open path
// (controller, store flag, App render wiring, or the shared @ui/Modal shell).

const PROGRESS_KEY = 'sea-pairs-progress';

test.describe('modals open', () => {
  test('menu-openable modals open and close', async ({ page }) => {
    await seedProgress(page);   // stamp daily as shown so it can't auto-pop and steal a click mid-loop
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await expect(page.getByTestId('menu')).toBeVisible();

    // [open-button testid, modal backdrop testid]
    const cases: [string, string][] = [
      ['leaderboard-open', 'leaderboard'],
      ['shop-open', 'shop'],
      ['store-open', 'store'],
      ['daily-open', 'daily'],
      ['tasks-open', 'tasks'],
      ['profile-open', 'profile'],
      ['help-open', 'help'],
    ];
    for (const [opener, modal] of cases) {
      await page.getByTestId(opener).click();
      await expect(page.getByTestId(modal), `${modal} should open`).toBeVisible();
      await page.keyboard.press('Escape'); // dismissible via the shared Modal shell
      await expect(page.getByTestId(modal), `${modal} should close on Escape`).toHaveCount(0);
    }
  });

  test('mode-start modal opens from a mode tile', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await page.getByTestId('mode-classic').click(); // classic is always unlocked
    await expect(page.getByTestId('mode-start')).toBeVisible();
  });

  test('level-up modal opens in the menu when a level is unacknowledged', async ({ page }) => {
    // Seed xp for level 3 but seenLevel 1 → MainMenu mount shows the celebration.
    await page.addInitScript((key) => {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, JSON.stringify({
        version: 4, pearls: 0,
        stats: {
          gamesPlayed: 1, gamesWon: 1, pairsMatched: 6,
          bestSeconds: { easy: null, medium: null, hard: null, expert: null },
          winsByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
          xp: 300, seenLevel: 1,
        },
        unlocked: [],
        equipped: { seaTheme: 'sea.lagoon', cardBack: 'back.classic', uiPalette: 'ui.ocean' },
      }));
    }, PROGRESS_KEY);
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await expect(page.getByTestId('levelup')).toBeVisible();
  });

  test('victory modal opens on completing a game', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy');

    const deck = await getActualDeck(page);
    const pairMap = new Map<string, number[]>();
    deck.forEach((sym, i) => { const a = pairMap.get(sym) ?? []; a.push(i); pairMap.set(sym, a); });
    for (const indices of pairMap.values()) {
      await waitForGameUnlocked(page);
      await clickCard(page, indices[0]);
      await page.waitForTimeout(350); // let the first flip animation start
      await clickCard(page, indices[1]);
      await waitForGameUnlocked(page); // wait out checkMatch + lock release
    }
    await expect(page.getByTestId('victory')).toBeVisible({ timeout: 4000 });
  });

  test('defeat modal opens on a timeAttack timeout', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy', 'timeAttack', { timeAttackStartSec: 2 });
    await expect(page.getByTestId('defeat')).toBeVisible({ timeout: 6000 });
  });
});
