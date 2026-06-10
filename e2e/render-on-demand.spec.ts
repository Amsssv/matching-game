import { test, expect } from '@playwright/test';
import { waitForCanvas, goToGameScene, clickCard, getActualDeck } from './helpers';

// Phaser TimeStep.sleep() toggles `running` to false; wake() back to true.
const loopAsleep = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as any).__game?.loop?.running === false);

test.describe('render-on-demand', () => {
  test('loop sleeps when the board is idle, wakes on tap, and the clock keeps counting', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy');

    // After the fade-in + grace the static board lets the loop sleep.
    await expect.poll(() => loopAsleep(page), { timeout: 4000 }).toBe(true);

    // The DOM play-clock keeps advancing even though the render loop is asleep.
    const t0 = await page.getByTestId('hud-timer').innerText().catch(() => '');
    await expect.poll(async () => page.getByTestId('hud-timer').innerText().catch(() => ''), { timeout: 3000 }).not.toBe(t0);

    // A tap wakes the loop and the move still works.
    const deck = await getActualDeck(page);
    expect(deck.length).toBeGreaterThan(0);
    await clickCard(page, 0);
    expect(await loopAsleep(page)).toBe(false);
  });
});
