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

  test('exit-to-menu completes even when the render loop is asleep (regression)', async ({ page }) => {
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy');
    await expect.poll(() => loopAsleep(page), { timeout: 4000 }).toBe(true);

    // Exit while asleep. goToMenu's camera fade-out is a camera *effect*, not a
    // tween, so render-on-demand must be torn down first — otherwise the loop
    // sleeps mid-fade and the transition (camerafadeoutcomplete → scene.start)
    // never fires, leaving a frozen canvas until the next tap.
    await page.evaluate(() => {
      const ui = (window as { __game?: { scene: { getScene(k: string): { exitToMenu(): void } | null } } }).__game?.scene.getScene('UIScene');
      ui?.exitToMenu();
    });

    await expect.poll(
      () => page.evaluate(() => (window as { __game?: { scene: { isActive(k: string): boolean } } }).__game?.scene.isActive('MenuScene') === true),
      { timeout: 4000 },
    ).toBe(true);
    expect(await loopAsleep(page)).toBe(false);
  });
});
