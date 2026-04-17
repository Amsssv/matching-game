import { test, expect } from '@playwright/test';
import {
  waitForCanvas,
  goToGameScene,
  clickCard,
  getActualDeck,
  pausePhaser,
  resumePhaser,
  waitForGameUnlocked,
} from './helpers';

test.describe('GameScene', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy');
  });

  test('initial state — all cards face down', async ({ page }) => {
    // Extra wait to ensure camera fade-in (300ms) is fully complete
    await page.waitForTimeout(600);
    await pausePhaser(page);
    await expect(page).toHaveScreenshot('game-initial.png');
    await resumePhaser(page);
  });

  test('victory screen (complete easy game)', async ({ page }) => {
    // Read the actual card order from the live GameScene — avoids relying on
    // Math.random seed state which differs between WebGL and Canvas renderers.
    const deck = await getActualDeck(page);
    const totalPairs = deck.length / 2;

    // Build a map: symbol → [indices in deck]
    const pairMap = new Map<string, number[]>();
    deck.forEach((sym, i) => {
      const arr = pairMap.get(sym) ?? [];
      arr.push(i);
      pairMap.set(sym, arr);
    });

    // Click each pair in order; wait for the game to unlock between clicks
    for (const indices of pairMap.values()) {
      await waitForGameUnlocked(page);
      await clickCard(page, indices[0]);
      await page.waitForTimeout(350); // allow first card flip animation to start
      await clickCard(page, indices[1]);
      await waitForGameUnlocked(page); // wait for checkMatch (800ms delayedCall) + lock release
    }

    // Wait for victory event + UIScene to render victory overlay
    await page.waitForTimeout(1200);
    await pausePhaser(page);
    await expect(page).toHaveScreenshot('game-victory.png');
    await resumePhaser(page);
  });
});