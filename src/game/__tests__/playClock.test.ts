import { describe, it, expect } from 'vitest';
import { computeElapsed } from '../playClock';

describe('computeElapsed', () => {
  it('counts whole seconds from start', () => {
    expect(computeElapsed({ startedAt: 1000, pausedTotal: 0, pausedAt: null }, 4500)).toBe(3);
  });
  it('freezes while paused', () => {
    expect(computeElapsed({ startedAt: 0, pausedTotal: 0, pausedAt: 2000 }, 9000)).toBe(2);
  });
  it('excludes accumulated paused time', () => {
    expect(computeElapsed({ startedAt: 0, pausedTotal: 5000, pausedAt: null }, 12000)).toBe(7);
  });
  it('never negative', () => {
    expect(computeElapsed({ startedAt: 9000, pausedTotal: 0, pausedAt: null }, 1000)).toBe(0);
  });
});
