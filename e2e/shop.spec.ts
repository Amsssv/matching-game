import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers';

const PROGRESS_KEY = 'sea-pairs-progress';

// Runs in the page before the app boots so resolveProgress() reads it.
// Idempotent: only seeds on first load — on reload it keeps whatever the app
// persisted (e.g. a purchase) so the persistence assertion stays meaningful.
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

// Interaction-only smoke test (no screenshots) — exercises the real
// open → switch tab → buy → equip → persist flow of the Collection shop.
test.describe('Shop (Collection)', () => {
  test('open from menu, switch tabs, buy + equip a palette → applies live and persists', async ({ page }) => {
    await page.addInitScript(seedProgress, { key: PROGRESS_KEY, pearls: 500 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    // Collection button is in the menu actions.
    await page.getByTestId('shop-open').click();
    await expect(page.getByTestId('shop')).toBeVisible();
    await expect(page.getByTestId('shop-tabs')).toBeVisible();

    // Default tab = seaTheme → sea items present.
    await expect(page.getByTestId('shop-item-sea.reef')).toBeVisible();

    // Switch to the palette tab.
    await page.getByTestId('shop-tab-uiPalette').click();
    const sunset = page.getByTestId('shop-item-ui.sunset');
    await expect(sunset).toBeVisible();

    // Buy (the only button in an unowned card) → auto-equips on success.
    await sunset.getByRole('button').click();

    // The React palette applied live: --color-blue is now sunset's blue.
    await expect.poll(() =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-blue').trim()),
    ).toBe('#b5532e');

    // Persisted: pearls deducted (500 − 100), unlocked + equipped saved.
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), PROGRESS_KEY);
    expect(saved.pearls).toBe(400);
    expect(saved.unlocked).toContain('ui.sunset');
    expect(saved.equipped.uiPalette).toBe('ui.sunset');

    // Survives a reload (re-resolved from localStorage at startup).
    await page.reload();
    await waitForCanvas(page);
    await expect.poll(() =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-blue').trim()),
    ).toBe('#b5532e');
  });

  test('buy button is disabled when the player cannot afford it', async ({ page }) => {
    await page.addInitScript(seedProgress, { key: PROGRESS_KEY, pearls: 0 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    await page.getByTestId('shop-open').click();
    // sea.reef costs 80; with 0 pearls its buy button is disabled.
    await expect(page.getByTestId('shop-item-sea.reef').getByRole('button')).toBeDisabled();
  });

  test('Escape closes the shop', async ({ page }) => {
    await page.addInitScript(seedProgress, { key: PROGRESS_KEY, pearls: 500 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    await page.getByTestId('shop-open').click();
    await expect(page.getByTestId('shop')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shop')).toHaveCount(0);
  });

  test('item cards show a real visual preview, not a flat swatch', async ({ page }) => {
    await page.addInitScript(seedProgress, { key: PROGRESS_KEY, pearls: 500 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await page.getByTestId('shop-open').click();

    // Sea tab: preview uses the real bg asset and the image actually loaded.
    const seaImg = page.getByTestId('shop-item-sea.reef').locator('img').first();
    await expect(seaImg).toBeVisible();
    await expect(seaImg).toHaveJSProperty('complete', true);
    expect(await seaImg.evaluate((n: HTMLImageElement) => n.naturalWidth)).toBeGreaterThan(0);
    expect(await seaImg.getAttribute('src')).toContain('assets/bg.webp');

    // Card-back tab: preview uses the real card-back asset.
    await page.getByTestId('shop-tab-cardBack').click();
    const backImg = page.getByTestId('shop-item-back.gold').locator('img').first();
    await expect(backImg).toBeVisible();
    expect(await backImg.evaluate((n: HTMLImageElement) => n.naturalWidth)).toBeGreaterThan(0);
    expect(await backImg.getAttribute('src')).toContain('assets/cards/back.webp');

    // Palette tab: DOM mock (no <img>), but the card still renders a preview block.
    await page.getByTestId('shop-tab-uiPalette').click();
    await expect(page.getByTestId('shop-item-ui.sunset')).toBeVisible();
    expect(await page.getByTestId('shop-item-ui.sunset').locator('img').count()).toBe(0);
  });
});
