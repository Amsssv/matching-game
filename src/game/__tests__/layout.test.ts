import { describe, it, expect } from 'vitest';
import { DIFF_ROWS, calcLayout } from '../layout';

// Helper: call calcLayout with a centered card area derived from W × availH
// so existing screen-size tests stay readable.
function layoutForScreen(
  rows: readonly number[],
  W: number,
  H: number,
  headerH: number,
) {
  const availH = H - headerH;
  return calcLayout(rows, W, availH, W / 2, headerH + availH / 2);
}

describe('DIFF_ROWS', () => {
  it('easy yields 12 cards (6 pairs)', () => {
    expect(DIFF_ROWS.easy.reduce((s, n) => s + n, 0)).toBe(12);
  });
  it('medium yields 20 cards (10 pairs)', () => {
    expect(DIFF_ROWS.medium.reduce((s, n) => s + n, 0)).toBe(20);
  });
  it('hard yields 24 cards (12 pairs)', () => {
    expect(DIFF_ROWS.hard.reduce((s, n) => s + n, 0)).toBe(24);
  });
  it('expert yields 28 cards (14 pairs)', () => {
    expect(DIFF_ROWS.expert.reduce((s, n) => s + n, 0)).toBe(28);
  });
  it('all difficulties have even card count', () => {
    for (const rows of Object.values(DIFF_ROWS)) {
      expect(rows.reduce((s, n) => s + n, 0) % 2).toBe(0);
    }
  });
});

describe('calcLayout', () => {
  const HEADER_H = 56;

  it('returns correct number of positions', () => {
    const rows = DIFF_ROWS.easy;
    const layout = layoutForScreen(rows, 800, 600, HEADER_H);
    expect(layout.positions.length).toBe(rows.reduce((s, n) => s + n, 0));
  });

  it('card aspect ratio is 3:4 (height/width ≈ 1.333)', () => {
    const { cardW, cardH } = layoutForScreen(DIFF_ROWS.easy, 800, 600, HEADER_H);
    expect(cardH / cardW).toBeCloseTo(4 / 3, 1);
  });

  it('all x positions keep cards within the area', () => {
    const W = 800, availH = 600 - HEADER_H;
    const originX = W / 2, originY = HEADER_H + availH / 2;
    const { positions, cardW } = calcLayout(DIFF_ROWS.easy, W, availH, originX, originY);
    for (const { x } of positions) {
      expect(x - cardW / 2).toBeGreaterThanOrEqual(0);
      expect(x + cardW / 2).toBeLessThanOrEqual(W);
    }
  });

  it('all y positions keep cards within the area', () => {
    const W = 800, H = 600, availH = H - HEADER_H;
    const originX = W / 2, originY = HEADER_H + availH / 2;
    const { positions, cardH } = calcLayout(DIFF_ROWS.easy, W, availH, originX, originY);
    for (const { y } of positions) {
      expect(y - cardH / 2).toBeGreaterThanOrEqual(HEADER_H);
      expect(y + cardH / 2).toBeLessThanOrEqual(H);
    }
  });

  it('grid is centered around originX and originY', () => {
    const areaW = 600, areaH = 400, originX = 400, originY = 300;
    const { positions, cardW, cardH } = calcLayout(DIFF_ROWS.easy, areaW, areaH, originX, originY);
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const midX = (Math.min(...xs) - cardW / 2 + Math.max(...xs) + cardW / 2) / 2;
    const midY = (Math.min(...ys) - cardH / 2 + Math.max(...ys) + cardH / 2) / 2;
    expect(midX).toBeCloseTo(originX, 0);
    expect(midY).toBeCloseTo(originY, 0);
  });

  it('small mobile screen (360×640) — valid layout', () => {
    const layout = layoutForScreen(DIFF_ROWS.easy, 360, 640, HEADER_H);
    expect(layout.positions.length).toBe(12);
    expect(layout.cardW).toBeGreaterThan(0);
    expect(layout.cardH).toBeGreaterThan(0);
  });

  it('large desktop screen (1920×1080) — valid layout', () => {
    const layout = layoutForScreen(DIFF_ROWS.expert, 1920, 1080, HEADER_H);
    expect(layout.positions.length).toBe(28);
    expect(layout.cardW).toBeGreaterThan(0);
  });

  it('square screen (600×600) — height constrains card size', () => {
    const layout = layoutForScreen(DIFF_ROWS.medium, 600, 600, HEADER_H);
    expect(layout.positions.length).toBe(20);
    const availH = 600 - HEADER_H;
    for (const { y } of layout.positions) {
      expect(y - layout.cardH / 2).toBeGreaterThanOrEqual(HEADER_H);
      expect(y + layout.cardH / 2).toBeLessThanOrEqual(HEADER_H + availH);
    }
  });
});