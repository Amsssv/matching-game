import { Page } from '@playwright/test';

/** Return the [i, j] indices of the first matching pair in the seeded deck. */
export function findFirstMatchingPair(deck: string[]): [number, number] {
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      if (deck[i] === deck[j]) return [i, j];
    }
  }
  throw new Error('No matching pair found in deck');
}

/**
 * Read the actual card symbol order from the live GameScene.
 * More reliable than a seeded deck because it doesn't depend on
 * how many Math.random calls Phaser makes before the shuffle.
 */
export async function getActualDeck(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = (window as any).__game;
    const scene = game.scene.getScene('GameScene') as any;
    return (scene.cards as any[]).map((c: any) => c.symbol as string);
  });
}

// ── Page navigation ──────────────────────────────────────────────────────────

/** Wait for Phaser canvas to be ready. */
export async function waitForCanvas(page: Page) {
  await page.waitForSelector('canvas', { state: 'visible' });
  // Extra wait for Phaser boot + fade-in (300ms) to complete
  await page.waitForTimeout(600);
}

/** Navigate directly to GameScene via the exposed game instance. */
export async function goToGameScene(
  page: Page,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy',
  mode: 'classic' | 'timeAttack' | 'survival' | 'noMistakes' = 'classic',
  overrides?: { timeAttackStartSec?: number; timeAttackBonusSec?: number; previewSec?: number },
) {
  await page.evaluate(({ diff, mode, overrides }) => {
    const game = (window as any).__game;
    game.registry.set('difficulty', diff);
    game.registry.set('gameMode', mode);
    if (overrides) game.registry.set('modeTestOverrides', overrides);
    game.registry.set('soundEnabled', false);
    game.scene.start('GameScene');
    // Stop MenuScene so its `shutdown` handler runs setMenu({ active: false });
    // otherwise the React menu overlay stays mounted on top of the game canvas.
    game.scene.stop('MenuScene');
  }, { diff: difficulty, mode, overrides });
  // Wait for scene transition + fade-in
  await page.waitForTimeout(700);
}

// ── Canvas interaction ────────────────────────────────────────────────────────

/**
 * Read a card's on-screen CSS-pixel position from the live GameScene.
 * Phaser positions are in internal coords (DPR-scaled); we divide by displayScale
 * and add the canvas's getBoundingClientRect offset to get viewport CSS pixels
 * that page.mouse expects.
 */
async function getCardViewportPos(page: Page, index: number): Promise<{ x: number; y: number }> {
  const pos = await page.evaluate((i) => {
    const game = (window as any).__game;
    const scene = game?.scene?.getScene('GameScene') as any;
    const card = scene?.cards?.[i];
    if (!card) return null;
    const canvas = game.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const sx = game.scale.displayScale?.x ?? 1;
    const sy = game.scale.displayScale?.y ?? 1;
    return {
      x: rect.left + card.container.x / sx,
      y: rect.top  + card.container.y / sy,
    };
  }, index);
  if (!pos) throw new Error(`Card index ${index} not found in GameScene`);
  return pos;
}

/** Click a card by its index in the current GameScene layout. */
export async function clickCard(page: Page, index: number) {
  const { x, y } = await getCardViewportPos(page, index);
  await page.mouse.click(x, y);
}
/**
 * Wait until GameScene accepts input: no pending pair, not in the noMistakes
 * preview, and the game hasn't ended.
 */
export async function waitForGameUnlocked(page: Page, timeout = 2000) {
  await page.waitForFunction(() => {
    const game = (window as any).__game;
    const scene = game?.scene?.getScene('GameScene') as any;
    if (!scene) return true;
    return !scene.gameEnded && !scene.previewActive && scene.flippedCards?.length === 0;
  }, { timeout });
}

// ── Phaser loop control ──────────────────────────────────────────────────────

/**
 * Wait for the active scene's camera fade-in to finish, then pause the
 * Phaser game loop so the canvas is fully static for screenshots.
 * Falls back to a 600 ms safety timeout so tests never hang.
 */
export async function pausePhaser(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => {
    const game = (window as any).__game;
    if (!game) { resolve(); return; }

    const safety = setTimeout(() => { game.loop.sleep(); resolve(); }, 600);

    function poll() {
      const scenes: any[] = game.scene.getScenes(true);
      const scene = scenes.find((s: any) => s.sys.settings.key !== 'UIScene');
      const fading = scene?.cameras?.main?.fadeEffect?.isRunning;
      if (fading) {
        requestAnimationFrame(poll);
      } else {
        clearTimeout(safety);
        game.loop.sleep();
        resolve();
      }
    }
    poll();
  }));
}

export async function resumePhaser(page: Page) {
  await page.evaluate(() => (window as any).__game?.loop.wake());
}

// ── Progress seeding ─────────────────────────────────────────────────────────

/** Seed persistent progress before page load. xp: 1350 unlocks all modes (level 7 — noMistakes gate).
 * Idempotent by default (matches daily.spec/shop.spec): seeds only on first load, so a later
 * reload keeps whatever the app persisted — persistence assertions stay meaningful.
 * Pass `{ force: true }` to overwrite on every navigation; needed when the app already
 * persisted a fresh profile on boot (reconcilePurchases → persist) and a test reloads to
 * install a leveled-up player (e.g. the mode-unlock menu specs). */
export async function seedProgress(
  page: Page,
  patch: { xp?: number; pearls?: number } = {},
  opts: { force?: boolean } = {},
) {
  await page.addInitScript(({ key, xp, pearls, force }) => {
    if (!force && localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify({ version: 4, pearls, stats: { xp } }));
  }, { key: 'sea-pairs-progress', xp: patch.xp ?? 0, pearls: patch.pearls ?? 0, force: opts.force ?? false });
}

