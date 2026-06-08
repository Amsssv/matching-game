// TEMPORARY self-verification capture harness (deleted before final handoff).
// Saves raw screenshots to /tmp/cap for visual comparison against screenshots/.
import { test, type Page } from '@playwright/test';
import fs from 'node:fs';

const OUT = '/tmp/cap';
const fontsReady = (page: Page) =>
  page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);

test.setTimeout(120_000);

async function setLang(page: Page, lng: string) {
  const flag = page.getByTestId(`lang-${lng}`);
  if ((await flag.count()) && !(await flag.isDisabled())) {
    await flag.click();
    await page.waitForSelector('[data-testid=menu]');
  }
  await page.waitForTimeout(500);
  await fontsReady(page);
}

test('diag', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid=menu]', { timeout: 25_000 });
  await fontsReady(page);
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const f = (document as unknown as { fonts: { check: (s: string) => boolean; [Symbol.iterator]: () => Iterator<{ family: string; status: string }> } }).fonts;
    const cs = (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const s = getComputedStyle(el);
      return { fontFamily: s.fontFamily, color: s.color, fill: s.webkitTextFillColor, bg: s.backgroundImage.slice(0, 30), w: Math.round(el.getBoundingClientRect().width) };
    };
    return {
      check: { indira: f.check('30px "Indira K"'), rubik: f.check('16px "Rubik"'), cinzel: f.check('16px Cinzel') },
      loaded: [...f].map((x) => `${x.family}=${x.status}`),
      title: cs('.menu-title__text'),
      titleBox: cs('.menu-title'),
      sub: cs('.menu-subtitle'),
      btn: cs('.ui-btn__label'),
      titleText: document.querySelector('.menu-title__text')?.textContent,
      titleTextScrollW: (document.querySelector('.menu-title__text') as HTMLElement)?.scrollWidth,
    };
  });
  console.log('DIAGNOSTIC_START' + JSON.stringify(info) + 'DIAGNOSTIC_END');
});

test('capture menu', async ({ page }, info) => {
  fs.mkdirSync(OUT, { recursive: true });
  const dev = info.project.name;
  const langs = (process.env.CAP_LANGS ?? 'en,ru,ar').split(',');
  await page.goto('/');
  await page.waitForSelector('[data-testid=menu]', { timeout: 25_000 });
  await fontsReady(page);
  for (const lng of langs) {
    await setLang(page, lng);
    await page.screenshot({ path: `${OUT}/${dev}_${lng}_menu.png` });
  }
});

test('capture game', async ({ page }, info) => {
  fs.mkdirSync(OUT, { recursive: true });
  const dev = info.project.name;
  const langs = (process.env.CAP_GAME_LANGS ?? 'en,ar').split(',');
  for (const lng of langs) {
    await page.goto('/');
    await page.waitForSelector('[data-testid=menu]', { timeout: 25_000 });
    await setLang(page, lng);
    await page.getByTestId('play').click();
    await page.waitForSelector('[data-testid=hud]', { timeout: 15_000 });
    await page.waitForTimeout(1300); // scene fade + island/cards render
    await fontsReady(page);
    await page.screenshot({ path: `${OUT}/${dev}_${lng}_game.png` });

    // Flip a matching pair (read data-symbol) to verify faces + matched dim + alignment.
    const all = await page.locator('[data-testid^="card-"]').evaluateAll((els) =>
      els.map((e) => ({ id: e.getAttribute('data-testid')!, sym: e.getAttribute('data-symbol')! })),
    );
    const seen = new Map<string, string>();
    let pair: [string, string] | null = null;
    for (const c of all) {
      if (seen.has(c.sym)) { pair = [seen.get(c.sym)!, c.id]; break; }
      seen.set(c.sym, c.id);
    }
    if (pair) {
      // One card up → face at FULL opacity (no match logic fires with a single card).
      await page.getByTestId(pair[0]).click();
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${OUT}/${dev}_${lng}_face.png` });
      // Second card → match resolves at ~300ms; the 2-pulse flash then runs ~720ms.
      await page.getByTestId(pair[1]).click();
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${OUT}/${dev}_${lng}_flash.png` });   // mid-flash: full brightness
      await page.waitForTimeout(950);
      await page.screenshot({ path: `${OUT}/${dev}_${lng}_match.png` });   // settled: dimmed to .45
    }
  }
});

test('animcheck', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid=menu]', { timeout: 25_000 });
  await fontsReady(page);
  await page.getByTestId('play').click();
  await page.waitForSelector('[data-testid=hud]', { timeout: 15_000 });
  await page.waitForTimeout(1300);

  // Hover (on .card) and flip (on .card__inner) must be SEPARATE durations; no 3D perspective.
  const styles = await page.evaluate(() => {
    const card = document.querySelector('[data-testid^="card-"]') as HTMLElement;
    const inner = card.querySelector('.card__inner') as HTMLElement;
    const cs = getComputedStyle(card), is = getComputedStyle(inner);
    return {
      hover_cardDur: cs.transitionDuration, cardPerspective: cs.perspective,
      flip_innerDur: is.transitionDuration, flip_innerEase: is.transitionTimingFunction,
    };
  });
  console.log('STYLES' + JSON.stringify(styles) + 'END');

  // Rendered width of the inner during the flip: a flat squash collapses width → ~0 at
  // the 90° midpoint then expands back (a 3D tilt would not collapse the box like this).
  const widths = await page.evaluate(async () => {
    const inner = document.querySelector('.card__inner') as HTMLElement;
    const card = inner.closest('.card') as HTMLElement;
    const full = Math.round(inner.getBoundingClientRect().width);
    card.click();
    const out: number[] = [];
    for (let i = 0; i < 10; i++) { await new Promise((r) => setTimeout(r, 28)); out.push(Math.round(inner.getBoundingClientRect().width)); }
    return { full, out };
  });
  console.log('WIDTHS' + JSON.stringify(widths) + 'END');
});

test('capture motion', async ({ page }, info) => {
  fs.mkdirSync(OUT, { recursive: true });
  const dev = info.project.name;
  await page.goto('/');
  await page.waitForSelector('[data-testid=menu]', { timeout: 25_000 });
  await fontsReady(page);

  // Mid scene-transition: click play, grab the overlay partway through the 300ms cross-fade.
  await page.getByTestId('play').click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${dev}_transition.png` });

  await page.waitForSelector('[data-testid=hud]', { timeout: 15_000 });
  await page.waitForTimeout(1300);
  // Decisively prove the flip animates: click a card, sample the inner's computed
  // transform every ~35ms. If animating, the matrix3d progresses 0°→180°; if it
  // were the old instant swap, every sample would already be the final matrix.
  const flip = await page.evaluate(async () => {
    const card = document.querySelector('[data-testid^="card-"]') as HTMLElement;
    const inner = card.querySelector('.card__inner') as HTMLElement;
    const dur = getComputedStyle(inner).transitionDuration;
    card.click();
    const out: string[] = [];
    for (let i = 0; i < 9; i++) {
      await new Promise((r) => setTimeout(r, 35));
      out.push(getComputedStyle(inner).transform);
    }
    return { dur, out };
  });
  console.log('FLIPSAMPLES' + JSON.stringify(flip) + 'ENDFLIP');
  await page.screenshot({ path: `${OUT}/${dev}_flip_done.png` });
});

test('capture modals', async ({ page }, info) => {
  fs.mkdirSync(OUT, { recursive: true });
  const dev = info.project.name;
  const lng = process.env.CAP_MODAL_LANG ?? 'en';
  await page.goto('/');
  await page.waitForSelector('[data-testid=menu]', { timeout: 25_000 });
  await setLang(page, lng);

  // ── Leaderboard modal (from menu) ─────────────────────────────────────────
  await page.getByTestId('leaderboard-open').click();
  await page.waitForSelector('[data-testid=leaderboard]', { timeout: 10_000 });
  await page.waitForTimeout(700); // async fetchLeaderboard → table fills
  await fontsReady(page);
  await page.screenshot({ path: `${OUT}/${dev}_${lng}_leaderboard.png` });
  await page.keyboard.press('Escape'); // ESC-close
  await page.waitForSelector('[data-testid=leaderboard]', { state: 'detached', timeout: 5_000 });

  // ── Victory modal (play an easy game to completion) ──────────────────────
  await page.getByTestId('diff-easy').click();
  await page.getByTestId('play').click();
  await page.waitForSelector('[data-testid=hud]', { timeout: 15_000 });
  await page.waitForTimeout(1300); // scene fade + deal

  const all = await page.locator('[data-testid^="card-"]').evaluateAll((els) =>
    els.map((e) => ({ id: e.getAttribute('data-testid')!, sym: e.getAttribute('data-symbol')! })),
  );
  const bySym = new Map<string, string[]>();
  for (const c of all) {
    const arr = bySym.get(c.sym) ?? [];
    arr.push(c.id);
    bySym.set(c.sym, arr);
  }
  for (const ids of bySym.values()) {
    await page.getByTestId(ids[0]).click();
    await page.getByTestId(ids[1]).click();
    await page.waitForTimeout(500); // cardFlipDelay 300 + match resolve, before next pair
  }
  await page.waitForSelector('[data-testid=victory]', { timeout: 10_000 });
  await page.waitForTimeout(800); // pop animation + compact-LB fetch
  await fontsReady(page);
  await page.screenshot({ path: `${OUT}/${dev}_${lng}_victory.png` });
});

test('musiccheck', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid=menu]', { timeout: 25_000 });
  const snap = () => page.evaluate(() => {
    const g = (window as unknown as { __game?: { sound: { get: (k: string) => { isPlaying?: boolean } | undefined; context?: { state?: string } } } }).__game;
    const m = g?.sound?.get('music');
    return { exists: !!m, isPlaying: m?.isPlaying ?? null, ctx: g?.sound?.context?.state ?? null };
  });
  const before = await snap();
  await page.getByTestId('diff-easy').click();   // a DOM button click (no canvas pointerdown)
  await page.waitForTimeout(250);
  const after = await snap();
  console.log('MUSIC' + JSON.stringify({ before, after }) + 'END');
});

test('canvascheck', async ({ page }, info) => {
  fs.mkdirSync(OUT, { recursive: true });
  const dev = info.project.name;
  await page.goto('/');
  await page.waitForSelector('[data-testid=menu]', { timeout: 25_000 });
  await page.getByTestId('play').click();
  await page.waitForSelector('[data-testid=hud]', { timeout: 15_000 });
  await page.waitForTimeout(1300);
  const before = (await page.getByTestId('hud-moves').textContent())?.trim();
  // Read real card centres from the scene (game px == CSS px at dpr 1) and click them.
  const pos = await page.evaluate(() => {
    const gs = (window as unknown as { __game: { scene: { getScene: (k: string) => { cards: { container: { x: number; y: number } }[] } } } }).__game.scene.getScene('GameScene');
    const a = gs.cards[0].container, b = gs.cards[1].container;
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y };
  });
  await page.mouse.click(pos.ax, pos.ay);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${dev}_canvas_flip1.png` });
  await page.mouse.click(pos.bx, pos.by);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${dev}_canvas_flip2.png` });
  const after = (await page.getByTestId('hud-moves').textContent())?.trim();
  console.log('CANVAS' + JSON.stringify({ before, after }) + 'END');
});
