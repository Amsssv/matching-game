import { describe, it, expect } from 'vitest';
import { DIFF_ROWS, calcLayout } from '../layout';

const HEADER_H = 56; // DPR=1 in tests

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
  it('all difficulties have even card count (every card has a pair)', () => {
    for (const rows of Object.values(DIFF_ROWS)) {
      expect(rows.reduce((s, n) => s + n, 0) % 2).toBe(0);
    }
  });
});

describe('calcLayout', () => {
  it('returns correct number of positions', () => {
    const rows = DIFF_ROWS.easy;
    const layout = calcLayout(rows, 800, 600, HEADER_H);
    expect(layout.positions.length).toBe(rows.reduce((s, n) => s + n, 0));
  });

  it('card aspect ratio is 3:4 (height/width ≈ 1.333)', () => {
    const { cardW, cardH } = calcLayout(DIFF_ROWS.easy, 800, 600, HEADER_H);
    expect(cardH / cardW).toBeCloseTo(4 / 3, 1);
  });

  it('all x positions keep cards within [0, W]', () => {
    const W = 800;
    const { positions, cardW } = calcLayout(DIFF_ROWS.easy, W, 600, HEADER_H);
    for (const { x } of positions) {
      expect(x - cardW / 2).toBeGreaterThanOrEqual(0);
      expect(x + cardW / 2).toBeLessThanOrEqual(W);
    }
  });

  it('all y positions keep cards within [0, H]', () => {
    const H = 600;
    const { positions, cardH } = calcLayout(DIFF_ROWS.easy, 800, H, HEADER_H);
    for (const { y } of positions) {
      expect(y - cardH / 2).toBeGreaterThanOrEqual(0);
      expect(y + cardH / 2).toBeLessThanOrEqual(H);
    }
  });

  it('small mobile screen (360×640) — valid layout', () => {
    const layout = calcLayout(DIFF_ROWS.easy, 360, 640, HEADER_H);
    expect(layout.positions.length).toBe(12);
    expect(layout.cardW).toBeGreaterThan(0);
    expect(layout.cardH).toBeGreaterThan(0);
  });

  it('large desktop screen (1920×1080) — valid layout', () => {
    const layout = calcLayout(DIFF_ROWS.expert, 1920, 1080, HEADER_H);
    expect(layout.positions.length).toBe(28);
    expect(layout.cardW).toBeGreaterThan(0);
  });

  it('square screen (600×600) — height constrains card size', () => {
    const layout = calcLayout(DIFF_ROWS.medium, 600, 600, HEADER_H);
    expect(layout.positions.length).toBe(20);
    for (const { y } of layout.positions) {
      expect(y - layout.cardH / 2).toBeGreaterThanOrEqual(0);
      expect(y + layout.cardH / 2).toBeLessThanOrEqual(600);
    }
  });
});