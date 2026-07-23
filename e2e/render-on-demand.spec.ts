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

  test('a resize while the loop is asleep still re-fits the background (fullscreen regression)', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/?canvas=1');
    await waitForCanvas(page);

    // The static menu background lets the loop sleep. While asleep Phaser's RAF is
    // stopped, so ScaleManager.step() never runs and a plain window 'resize' (what a
    // fullscreen toggle / URL-bar / split-screen fires) only sets dirty=true — the
    // RESIZE event never emits and the background never re-fits. GameMount pumps
    // scale.refresh() on resize-while-asleep to close that gap.
    await expect.poll(() => loopAsleep(page), { timeout: 4000 }).toBe(true);
    const scaleWBefore = await page.evaluate(
      () => Math.round((window as { __game?: { scale: { width: number } } }).__game!.scale.width),
    );

    // Enlarge the viewport (like entering fullscreen) with NO pointer interaction.
    await page.setViewportSize({ width: 1280, height: 900 });

    // The background follows the canvas to the new size without a tap…
    await expect.poll(
      () => page.evaluate((prev) => {
        const g = (window as { __game?: any }).__game;
        const bg = g?.scene?.getScene('MenuScene')?.bgObj;
        if (!bg) return 'no-bg';
        const fills = Math.round(bg.displayWidth) === Math.round(g.scale.width)
          && Math.round(bg.displayHeight) === Math.round(g.scale.height);
        return fills && Math.round(g.scale.width) > prev ? 'ok' : 'stale';
      }, scaleWBefore),
      { timeout: 4000 },
    ).toBe('ok');

    // …and render-on-demand is preserved: the loop settles back to sleep.
    await expect.poll(() => loopAsleep(page), { timeout: 4000 }).toBe(true);
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
