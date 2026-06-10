import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers';

const PROGRESS_KEY = 'sea-pairs-progress';

// Seed before the app boots so resolveProgress() reads it. Idempotent (only first load).
function seedProgress(args: { key: string; pearls: number }) {
  if (localStorage.getItem(args.key)) return;
  localStorage.setItem(args.key, JSON.stringify({
    version: 2,
    pearls: args.pearls,
    stats: {
      gamesPlayed: 0, gamesWon: 0, pairsMatched: 0,
      bestSeconds: { easy: null, medium: null, hard: null, expert: null },
      winsByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
    },
    unlocked: [],
    equipped: { seaTheme: 'sea.lagoon', cardBack: 'back.classic', uiPalette: 'ui.ocean' },
  }));
}

const pearlsOf = (t: string) => parseInt(t.replace(/\D/g, ''), 10);

// The dev server runs with import.meta.env.DEV === true and no Yandex SDK, so the
// purchase flow takes the simulation branch (grants directly) — letting us e2e the UI.
test.describe('IAP (dev simulation)', () => {
  test('balance pill opens the store; buying a pack grants pearls', async ({ page }) => {
    await page.addInitScript(seedProgress, { key: PROGRESS_KEY, pearls: 100 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    const balance = page.getByTestId('pearl-balance');
    await expect(balance).toBeVisible();
    expect(pearlsOf(await balance.innerText())).toBe(100);

    await balance.click();
    await expect(page.getByTestId('store')).toBeVisible();

    await page.getByTestId('store-pack-pearls_small').getByRole('button').click();

    // dev simulation grants 500 directly; balance updates reactively
    await expect.poll(async () => pearlsOf(await balance.innerText())).toBe(600);
  });

  test('premium cosmetic is buyable for money in the Collection (dev simulation)', async ({ page }) => {
    await page.addInitScript(seedProgress, { key: PROGRESS_KEY, pearls: 0 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    await page.getByTestId('shop-open').click();
    await page.getByTestId('shop-tab-uiPalette').click();
    const card = page.getByTestId('shop-item-ui.sand');
    await expect(card).toBeVisible();

    // pearls=0 → the pearl button is the locked 🔒 one; the money button still works.
    await card.getByTestId('shop-money-ui.sand').click();

    await expect.poll(async () => {
      const s = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), PROGRESS_KEY);
      return s.unlocked as string[];
    }).toContain('ui.sand');
  });

  test('store button: buying a bundle grants all its items + bonus pearls (dev simulation)', async ({ page }) => {
    await page.addInitScript(seedProgress, { key: PROGRESS_KEY, pearls: 0 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    await page.getByTestId('store-open').click();
    await expect(page.getByTestId('store')).toBeVisible();

    // Founder's Pack = ui.aurora + back.prism + 1500 pearls.
    await page.getByTestId('bundle-buy-bundle_founder').click();

    await expect.poll(async () => {
      const s = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), PROGRESS_KEY);
      return s.pearls as number;
    }).toBe(1500);

    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), PROGRESS_KEY);
    expect(saved.unlocked).toEqual(expect.arrayContaining(['ui.aurora', 'back.prism']));
  });
});
