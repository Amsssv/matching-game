import { test, expect } from '@playwright/test';
import {
  waitForCanvas, goToGameScene, seedProgress,
  getActualDeck, findFirstMatchingPair, clickCard, waitForGameUnlocked,
} from './helpers';

// Real waits (preview seconds, countdown expiry) — run once, on the desktop project.
test.beforeEach(() => {
  test.skip(test.info().project.name !== 'desktop', 'runs once on desktop project');
});

/** First [i, j] with deck[i] !== deck[j] — a guaranteed mismatch. */
function findFirstMismatch(deck: string[]): [number, number] {
  for (let j = 1; j < deck.length; j++) if (deck[j] !== deck[0]) return [0, j];
  throw new Error('No mismatch found in deck');
}

test.describe('mode start flow', () => {
  test('menu → mode card → pick difficulty → play starts the right mode', async ({ page }) => {
    await seedProgress(page, { xp: 1000 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await page.waitForTimeout(500);
    await page.getByTestId('mode-survival').click();
    await expect(page.getByTestId('mode-start')).toBeVisible();
    // Tapping a difficulty only SELECTS it; the game starts from the CTA.
    await page.getByTestId('mode-diff-easy').click();
    await expect(page.getByTestId('mode-start')).toBeVisible();   // still open — no instant start
    await page.getByTestId('mode-start-play').click();
    await expect(page.getByTestId('hud')).toBeVisible();
    await expect(page.getByTestId('mode-start')).toHaveCount(0);   // modal must not survive the start
    await expect(page.getByTestId('hud-mode')).toHaveText('🛡️');
    const mode = await page.evaluate(() => (window as any).__game.registry.get('gameMode'));
    expect(mode).toBe('survival');
  });
});

test.describe('timeAttack', () => {
  test('expiry ends the game with a defeat modal; restart works', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy', 'timeAttack', { timeAttackStartSec: 2 });
    // 2s budget, no matches → defeat. Clock ticks every 500ms.
    await expect(page.getByTestId('defeat')).toBeVisible({ timeout: 6000 });
    await page.getByTestId('defeat-restart').click();
    await expect(page.getByTestId('defeat')).toHaveCount(0);
    await expect(page.getByTestId('hud')).toBeVisible();
  });

  test('a matched pair credits bonus time (no premature death)', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy', 'timeAttack', { timeAttackStartSec: 4, timeAttackBonusSec: 60 });
    await waitForGameUnlocked(page);
    const deck = await getActualDeck(page);
    const [i, j] = findFirstMatchingPair(deck);
    await clickCard(page, i);
    await clickCard(page, j);
    // +60s bonus: 3 seconds later the game must still be alive.
    await page.waitForTimeout(3000);
    await expect(page.getByTestId('defeat')).toHaveCount(0);
    await expect(page.getByTestId('hud')).toBeVisible();
  });
});

test.describe('survival', () => {
  test('a mismatch flips all matched pairs back', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy', 'survival');
    await waitForGameUnlocked(page);
    const deck = await getActualDeck(page);
    const [i, j] = findFirstMatchingPair(deck);
    await clickCard(page, i);
    await clickCard(page, j);
    await expect(page.getByTestId('hud-pairs')).toContainText('1/6');
    await waitForGameUnlocked(page);
    // Now a guaranteed mismatch among the remaining cards.
    const remaining = deck.map((s, idx) => idx).filter(idx => idx !== i && idx !== j);
    const a = remaining.find(idx => deck[idx] !== deck[remaining[0]]) ?? remaining[1];
    await clickCard(page, remaining[0]);
    await clickCard(page, a);
    // All pairs reset: HUD back to 0 and every card face-down + unmatched.
    await expect(page.getByTestId('hud-pairs')).toContainText('0/6');
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).__game.scene.getScene('GameScene') as any;
      return scene.cards.every((c: any) => !c.isMatched && !c.isFlipped) && scene.matchedPairs === 0;
    }), { timeout: 3000 }).toBe(true);
  });
});

test.describe('noMistakes', () => {
  test('preview shows, then one mistake ends the game', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy', 'noMistakes', { previewSec: 1 });
    await expect(page.getByTestId('preview-overlay')).toBeVisible({ timeout: 3000 });
    // Preview ends → overlay disappears, input unlocks.
    await expect(page.getByTestId('preview-overlay')).toHaveCount(0, { timeout: 5000 });
    await waitForGameUnlocked(page, 5000);
    const deck = await getActualDeck(page);
    const [x, y] = findFirstMismatch(deck);
    await clickCard(page, x);
    await clickCard(page, y);
    await expect(page.getByTestId('defeat')).toBeVisible({ timeout: 4000 });
  });

  test('a perfect run wins', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy', 'noMistakes', { previewSec: 1 });
    await expect(page.getByTestId('preview-overlay')).toHaveCount(0, { timeout: 5000 });
    await waitForGameUnlocked(page, 5000);
    const deck = await getActualDeck(page);
    // Pair up indices by symbol and clear the whole board without a single mismatch.
    const bySymbol = new Map<string, number[]>();
    deck.forEach((s, idx) => bySymbol.set(s, [...(bySymbol.get(s) ?? []), idx]));
    for (const [, [i, j]] of bySymbol) {
      await clickCard(page, i);
      await clickCard(page, j);
      await waitForGameUnlocked(page, 4000);
    }
    await expect(page.getByTestId('victory')).toBeVisible({ timeout: 6000 });
  });
});
