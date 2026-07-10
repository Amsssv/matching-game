import { describe, it, expect } from 'vitest';
import { mobileNodeLayout, pebbleDots } from '../levelTrail';

describe('mobileNodeLayout', () => {
  it('returns 12 nodes with coordinates inside 0..100', () => {
    const l = mobileNodeLayout();
    expect(l).toHaveLength(12);
    for (const p of l) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });
  it('snakes: level 4 sits above level 5 (right edge), level 8 above level 9 (left edge)', () => {
    const l = mobileNodeLayout();
    expect(l[3].x).toBe(l[4].x); // L4 over L5
    expect(l[7].x).toBe(l[8].x); // L8 over L9
    expect(l[3].x).toBeGreaterThan(l[7].x); // opposite edges
  });
  it('has exactly three distinct rows', () => {
    const l = mobileNodeLayout();
    expect(new Set(l.map((p) => p.y)).size).toBe(3);
  });
});

describe('pebbleDots', () => {
  it('places dots between nodes, inside bounds, never on a node center', () => {
    const layout = mobileNodeLayout();
    const dots = pebbleDots(layout);
    expect(dots.length).toBeGreaterThanOrEqual(layout.length - 1);
    const nodeKeys = new Set(layout.map((p) => `${p.x},${p.y}`));
    for (const d of dots) {
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(100);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(100);
      expect(nodeKeys.has(`${d.x},${d.y}`)).toBe(false);
    }
  });
});
