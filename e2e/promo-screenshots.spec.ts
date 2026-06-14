/**
 * Promo screenshots for the Yandex Games store listing.
 *
 * Unlike store-screenshots.spec.ts (which uses toHaveScreenshot for visual
 * regression), this spec writes raw PNG files into screenshots/promo/ that can
 * be uploaded directly to the developer console.
 *
 * Yandex rule 5.1.1 requires ≥70% of promo screenshots to show gameplay. We
 * produce 5 frames per language per device: 1 menu + 4 gameplay states
 * (= 80% gameplay). Default run covers all 6 supported languages.
 *
 * Run:
 *   npm run screenshots:promo
 *   # restrict to one language (skip the rest):
 *   PROMO_LANG=en npm run screenshots:promo
 *   # restrict to one device:
 *   npx playwright test --project=promo-mobile e2e/promo-screenshots.spec.ts
 */
import { test } from '@playwright/test';
import * as path from 'node:path';
import {
  waitForCanvas,
  pausePhaser,
  resumePhaser,
  clickCard,
  getActualDeck,
  findFirstMatchingPair,
  waitForGameUnlocked,
} from './helpers';

const ALL_LANGS = ['ru', 'en', 'tr', 'es', 'pt', 'ar'] as const;
type Lang = typeof ALL_LANGS[number];

// PROMO_LANG=xx limits the run to a single language; omitted = all of them.
const LANGS: readonly Lang[] = (() => {
  const env = process.env.PROMO_LANG;
  if (!env) return ALL_LANGS;
  if ((ALL_LANGS as readonly string[]).includes(env)) return [env as Lang];
  throw new Error(`PROMO_LANG=${env} is not in [${ALL_LANGS.join(', ')}]`);
})();

const DIFFICULTY = (process.env.PROMO_DIFF ?? 'medium') as
  | 'easy' | 'medium' | 'hard' | 'expert';

async function startGameScene(page: import('@playwright/test').Page, diff: string) {
  await page.evaluate((d) => {
    const g = (window as any).__game;
    g.registry.set('difficulty', d);
    g.registry.set('soundEnabled', false);
    g.scene.stop('MenuScene');
    g.scene.start('GameScene');
  }, diff);
  await page.waitForFunction(() => {
    const g = (window as any).__game;
    const gs = g?.scene?.getScene('GameScene') as any;
    if (!Array.isArray(gs?.cards) || gs.cards.length === 0) return false;
    return typeof gs.events.listenerCount === 'function'
      && gs.events.listenerCount('game-complete') >= 2;
  }, { timeout: 5000 });
  // Let the camera fade-in (300 ms) and the initial card layout settle.
  await page.waitForTimeout(600);
}

/**
 * Match `targetPairs` pairs by clicking through the deck in order. Returns
 * the set of card indices that ended up matched.
 */
async function matchPairs(
  page: import('@playwright/test').Page,
  deck: string[],
  alreadyMatched: Set<number>,
  targetPairs: number,
): Promise<Set<number>> {
  const matched = new Set(alreadyMatched);
  let pairs = Math.floor(matched.size / 2);
  for (let i = 0; pairs < targetPairs && i < deck.length; i++) {
    if (matched.has(i)) continue;
    const partner = deck.findIndex((s, idx) => idx !== i && s === deck[i] && !matched.has(idx));
    if (partner === -1) continue;
    await clickCard(page, i);
    await page.waitForTimeout(220);
    await clickCard(page, partner);
    await page.waitForTimeout(650); // match animation + flip delay
    await waitForGameUnlocked(page);
    matched.add(i);
    matched.add(partner);
    pairs++;
  }
  return matched;
}

/**
 * Make the play clock read ~`targetSec` seconds so the HUD timer looks like a real
 * session instead of 0:0X. Implemented by shifting performance.now() by a constant
 * offset: Phaser's loop is driven by the requestAnimationFrame timestamp (not
 * performance.now()), so frame deltas — and therefore all card flip/match tweens —
 * are unaffected; only the play clock (which reads performance.now() directly) jumps
 * forward. Then wait one 500 ms clock tick so the new value reaches the HUD.
 */
async function setClock(page: import('@playwright/test').Page, targetSec: number) {
  await page.evaluate((target) => {
    const w = window as unknown as { __realNow?: () => number; __nowOffset: number; __game: import('phaser').Game };
    if (!w.__realNow) {
      w.__realNow = performance.now.bind(performance);
      w.__nowOffset = 0;
      performance.now = () => (w.__realNow as () => number)() + w.__nowOffset;
    }
    const ui = w.__game?.scene?.getScene('UIScene') as unknown as { clock?: { seconds: () => number } };
    const cur = ui?.clock ? ui.clock.seconds() : 0;
    w.__nowOffset += (target - cur) * 1000;
  }, targetSec);
  await page.waitForTimeout(650);
}

for (const lang of LANGS) {
  test.describe(`promo screenshots / ${lang}`, () => {
    // Promo capture is sequential by design — restarting the game between frames
    // would be slower than driving one continuous session.
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript((l: string) => {
        localStorage.setItem('sea-pairs-lang', l);
      }, lang);
      await page.goto('/?canvas=1');
      await waitForCanvas(page);
      await page.waitForTimeout(1200); // menu fade-in + font swap
    });

    test('capture promo frames', async ({ page }, testInfo) => {
      const project = testInfo.project.name; // promo-mobile | promo-desktop
      const device = project.replace('promo-', ''); // mobile | desktop — the committed dirs
      const outDir = path.resolve(testInfo.config.rootDir, '../screenshots', device);
      const shot = (name: string) =>
        page.screenshot({ path: path.join(outDir, `${lang}_${name}.png`), animations: 'disabled' });

      // 1 / 5 — Menu (non-gameplay; 20% of the set)
      await pausePhaser(page);
      await shot('01_menu');

      // 2 / 5 — Fresh board: all cards face-down (just started)
      await resumePhaser(page);
      await startGameScene(page, DIFFICULTY);
      await setClock(page, 2);
      await pausePhaser(page);
      await shot('02_board');

      // 3 / 5 — Just-matched pair (shows highlight / matched state)
      await resumePhaser(page);
      const deck = await getActualDeck(page);
      const [a, b] = findFirstMatchingPair(deck);
      await clickCard(page, a);
      await page.waitForTimeout(220);
      await clickCard(page, b);
      await page.waitForTimeout(650);
      await waitForGameUnlocked(page);
      await setClock(page, 9);
      await pausePhaser(page);
      await shot('03_match');

      // 4 / 5 — Mid-game: ~40% of pairs matched
      await resumePhaser(page);
      const totalPairs = deck.length / 2;
      const midTarget = Math.max(2, Math.floor(totalPairs * 0.4));
      const midState = await matchPairs(page, deck, new Set([a, b]), midTarget);
      await setClock(page, 33);
      await pausePhaser(page);
      await shot('04_midgame');

      // 5 / 5 — Decision moment: two non-matching cards revealed mid-flip
      await resumePhaser(page);
      // Bump the clock BEFORE revealing the cards — setClock waits 650ms, which would
      // otherwise let the auto-flip-back (~UI.animation.cardFlipDelay) hide them.
      await setClock(page, 51);
      const remaining = deck.map((_, idx) => idx).filter(idx => !midState.has(idx));
      const first = remaining[0];
      const second = remaining.find(idx => deck[idx] !== deck[first]) ?? remaining[1];
      if (first !== undefined && second !== undefined) {
        await clickCard(page, first);
        await page.waitForTimeout(200);
        await clickCard(page, second);
        // Snap the frame BEFORE the auto-flip-back kicks in (~UI.animation.cardFlipDelay).
        await page.waitForTimeout(350);
      }
      await pausePhaser(page);
      await shot('05_decision');
    });
  });
}
