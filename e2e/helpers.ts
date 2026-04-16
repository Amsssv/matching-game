import { Page } from '@playwright/test';
import { calcLayout, DIFF_ROWS } from '../src/game/layout';
import { SYMBOLS } from '../src/game/assets-config';

const HEADER_H = 56; // DPR=1 in all E2E projects

// ── Seeded random (matches the injected Math.random in tests) ────────────────
const SEED = 42;

function createSeededRandom() {
  let s = SEED;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/** Replicate Phaser.Utils.Array.Shuffle with the seeded Math.random. */
function seededShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  const rand = createSeededRandom();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Return the seeded card deck for a given number of pairs. */
export function getSeededDeck(totalPairs: number): string[] {
  const picked = [...SYMBOLS].slice(0, totalPairs) as string[];
  return seededShuffle([...picked, ...picked]);
}

/** Return the [i, j] indices of the first matching pair in the seeded deck. */
export function findFirstMatchingPair(deck: string[]): [number, number] {
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      if (deck[i] === deck[j]) return [i, j];
    }
  }
  throw new Error('No matching pair found in deck');
}

/** Return the [i, j] indices of the first NON-matching pair in the seeded deck. */
export function findFirstNonMatchingPair(deck: string[]): [number, number] {
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      if (deck[i] !== deck[j]) return [i, j];
    }
  }
  throw new Error('No non-matching pair found in deck');
}

/**
 * Read the actual card symbol order from the live GameScene.
 * More reliable than getSeededDeck() because it doesn't depend on
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

/** Inject seeded Math.random — call BEFORE page.goto(). */
export async function injectSeededRandom(page: Page) {
  await page.addInitScript(() => {
    let s = 42;
    Math.random = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  });
}

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
) {
  await page.evaluate((diff) => {
    const game = (window as any).__game;
    game.registry.set('difficulty', diff);
    game.registry.set('soundEnabled', false);
    game.scene.start('GameScene');
  }, difficulty);
  // Wait for scene transition + fade-in
  await page.waitForTimeout(700);
}

// ── Canvas interaction ────────────────────────────────────────────────────────

/** Click a card by its index in the current GameScene layout. */
export async function clickCard(
  page: Page,
  index: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy',
) {
  const viewport = page.viewportSize()!;
  const layout = calcLayout(DIFF_ROWS[difficulty], viewport.width, viewport.height, HEADER_H);
  const { x, y } = layout.positions[index];
  await page.mouse.click(x, y);
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

/** Hover over a card by its index. */
export async function hoverCard(
  page: Page,
  index: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy',
) {
  const viewport = page.viewportSize()!;
  const layout = calcLayout(DIFF_ROWS[difficulty], viewport.width, viewport.height, HEADER_H);
  const { x, y } = layout.positions[index];
  await page.mouse.move(x, y);
  await page.waitForTimeout(150); // allow hover animation to settle
}