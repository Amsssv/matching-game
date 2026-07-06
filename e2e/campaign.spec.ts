import { test, expect } from '@playwright/test';
import {
  waitForCanvas,
  getActualDeck,
  clickCard,
  waitForGameUnlocked,
  seedProgress,
} from './helpers';

test.describe('Campaign', () => {
  test.beforeEach(async ({ page }) => {
    // Returning-player seed avoids any first-run gating on the menu and keeps
    // the flow deterministic; energy itself defaults to a fresh 5/5 regardless.
    await seedProgress(page, { xp: 100, pearls: 500 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
  });

  test('map gating: only chapter 1 is unlocked', async ({ page }) => {
    await page.getByTestId('journey').click();
    await expect(page.getByTestId('campaign-map')).toBeVisible();
    await expect(page.getByTestId('chapter-lagoon')).toBeEnabled();
    await expect(page.getByTestId('chapter-reef')).toBeDisabled();
  });

  test('play level 1, win, unlock level 2 and spend energy', async ({ page }) => {
    await page.getByTestId('journey').click();
    await page.getByTestId('chapter-lagoon').click();
    await expect(page.getByTestId('island-lagoon')).toBeVisible();
    await expect(page.getByTestId('level-lagoon-1')).toBeEnabled();
    await expect(page.getByTestId('level-lagoon-2')).toBeDisabled();

    await page.getByTestId('level-lagoon-1').click();
    await expect(page.getByTestId('level-start')).toBeVisible();
    await page.getByTestId('level-play').click();

    // Clicking level-play triggers the cover-fade scene transition
    // (MenuScene -> GameScene, ~300ms) before GameScene.create() populates
    // its cards; wait for that before reading the deck, else the deck is
    // empty and the win loop below silently no-ops.
    await page.waitForFunction(() => {
      const game = (window as any).__game;
      const scene = game?.scene?.getScene('GameScene') as any;
      return !!scene && Array.isArray(scene.cards) && scene.cards.length > 0;
    });

    // lagoon-1 is a classic EASY board (6 pairs). Win it the same way
    // game.spec.ts's victory test does: read the live deck, flip each
    // matching pair in order, and settle between clicks.
    await waitForGameUnlocked(page);
    const deck = await getActualDeck(page);
    const bySymbol = new Map<string, number[]>();
    deck.forEach((sym, i) => {
      const a = bySymbol.get(sym) ?? [];
      a.push(i);
      bySymbol.set(sym, a);
    });
    for (const indices of bySymbol.values()) {
      await waitForGameUnlocked(page);
      await clickCard(page, indices[0]);
      await page.waitForTimeout(350); // allow first card flip animation to start
      await clickCard(page, indices[1]);
      await waitForGameUnlocked(page); // let the match settle before the next pair
    }

    // Auto-retrying assertions absorb the win → finishLevel → exitToMenu scene
    // transition (cover fade + scene.start('MenuScene')).
    await expect(page.getByTestId('level-result')).toBeVisible();
    await expect(page.getByTestId('level-result-stars')).toBeVisible();
    await page.getByTestId('level-result-close').click();

    // level-result-close reopens the island (openIsland) for the same chapter.
    await expect(page.getByTestId('island-lagoon')).toBeVisible();
    await expect(page.getByTestId('level-lagoon-2')).toBeEnabled();

    // The energy meter lives in the menu's top-left cluster, underneath the
    // island overlay. Back out of the island to expose it, then confirm one
    // life was spent at level start (5/5 -> 4/5); the 25-min regen window
    // can't tick within the test.
    await page.getByTestId('island-back').click();
    await expect(page.getByTestId('energy-meter')).toContainText('4/5');
  });
});
