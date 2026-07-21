import { test, expect, type Page } from '@playwright/test';
import { waitForCanvas, goToGameScene, seedProgress } from './helpers';

// ── Helpers ───────────────────────────────────────────────────────────────────

function readHitboxes(page: Page) {
  return page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('GameScene') as any;
    return (scene.cards as any[]).map((card: any) => ({
      inputNull:    card.container.input == null,
      inputEnabled: (card.container.input?.enabled ?? false) as boolean,
      hitAreaX:     (card.container.input?.hitArea?.x)     as number | undefined,
      hitAreaY:     (card.container.input?.hitArea?.y)     as number | undefined,
      hitAreaW:     (card.container.input?.hitArea?.width)  as number | undefined,
      hitAreaH:     (card.container.input?.hitArea?.height) as number | undefined,
      containerW:   card.container.width  as number,
      containerH:   card.container.height as number,
    }));
  });
}

/** Emit N resize events synchronously in one JS task — the F11 / Yandex fullscreen scenario. */
function fireRapidResizes(page: Page, count: number, w: number, h: number) {
  return page.evaluate(({ count, w, h }) => {
    const game = (window as any).__game;
    const size = { width: w, height: h };
    for (let i = 0; i < count; i++) game.scale.emit('resize', size, size);
  }, { count, w, h });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Card hitbox', () => {
  test.beforeEach(async ({ page }) => {
    await seedProgress(page);   // stamp daily as shown so it can't auto-pop before navigating
    await page.goto('/?canvas=1');
    await waitForCanvas(page);
    await goToGameScene(page, 'easy');
    await page.waitForTimeout(300); // let fade-in finish
  });

  // ── Baseline ──────────────────────────────────────────────────────────────────

  test('all cards start interactive with hitbox matching container size', async ({ page }) => {
    const boxes = await readHitboxes(page);
    for (const b of boxes) {
      expect(b.inputNull,    'card has no input object').toBe(false);
      expect(b.inputEnabled, 'card input is disabled').toBe(true);
      expect(b.hitAreaW).toBe(b.containerW);
      expect(b.hitAreaH).toBe(b.containerH);
    }
  });

  // Phaser's pointWithinHitArea adds displayOriginX (= width/2) before testing,
  // so the raw Rectangle must start at (0,0) — not (-w/2,-h/2).
  // If the origin were (-w/2,-h/2), Phaser's offset would double it and only
  // the top-left quadrant of each card would register clicks.
  test('hitbox origin is (0,0) — Phaser adds displayOriginX offset internally', async ({ page }) => {
    const boxes = await readHitboxes(page);
    for (const b of boxes) {
      expect(b.hitAreaX).toBe(0);
      expect(b.hitAreaY).toBe(0);
    }
  });

  // ── Single resize ─────────────────────────────────────────────────────────────

  test('hitbox updates to match new card size after viewport resize', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(150);

    const boxes = await readHitboxes(page);
    for (const b of boxes) {
      expect(b.inputNull, 'card lost its input after resize').toBe(false);
      expect(b.hitAreaW).toBe(b.containerW);
      expect(b.hitAreaH).toBe(b.containerH);
    }
  });

  // ── Rapid resize — F11 / Yandex fullscreen regression ────────────────────────
  //
  // Bug: onResize called removeInteractive()+setInteractive() on each card.
  // When fired N times per frame, preUpdate's pending-removal pass called
  // clear() a second time, nullifying the input set by the last setInteractive().
  // Result: every card ended up with input=null and was completely unclickable.
  // Fix: mutate hitArea in-place instead of going through the queue system.

  test('all cards remain interactive after 3 rapid resize events in one frame', async ({ page }) => {
    const vp = page.viewportSize()!;
    await fireRapidResizes(page, 3, vp.width, vp.height);
    // Wait one frame for InputPlugin.preUpdate to run.
    await page.waitForTimeout(50);

    const boxes = await readHitboxes(page);
    for (const b of boxes) {
      expect(b.inputNull,    'card.input became null after rapid resize').toBe(false);
      expect(b.inputEnabled, 'card.input.enabled is false after rapid resize').toBe(true);
    }
  });

  test('card flips on click after 3 rapid resize events', async ({ page }) => {
    const vp = page.viewportSize()!;
    await fireRapidResizes(page, 3, vp.width, vp.height);
    await page.waitForTimeout(50);

    // DPR=1 in tests: game coordinates equal CSS pixels.
    const { x, y } = await page.evaluate(() => {
      const scene = (window as any).__game.scene.getScene('GameScene') as any;
      const c = scene.cards[0].container;
      return { x: c.x as number, y: c.y as number };
    });

    await page.mouse.click(x, y);
    await page.waitForTimeout(200);

    const isFlipped = await page.evaluate(() => {
      const scene = (window as any).__game.scene.getScene('GameScene') as any;
      return scene.cards[0].isFlipped as boolean;
    });
    expect(isFlipped, 'card did not flip — click was not registered').toBe(true);
  });
});
