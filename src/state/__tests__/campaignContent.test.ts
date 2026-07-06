import { describe, it, expect } from 'vitest';
import { CHAPTERS, LEVELS_PER_CHAPTER, computeStars } from '../campaign';

describe('campaign content', () => {
  it('has 5 chapters in ramp order, each with 12 levels and unique ids', () => {
    expect(CHAPTERS.map(c => c.biome)).toEqual(['lagoon', 'volcano', 'reef', 'arctic', 'abyss']);
    const ids = CHAPTERS.flatMap(c => c.levels.map(l => l.id));
    expect(ids.length).toBe(5 * LEVELS_PER_CHAPTER);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('chapter 1 opens for free; later chapters require prior stars', () => {
    expect(CHAPTERS[0].starsToUnlock).toBe(0);
    expect(CHAPTERS[1].starsToUnlock).toBeGreaterThan(0);
  });
});

describe('computeStars', () => {
  const goals = { maxMoves: 20, maxSeconds: 60, noMistakes: true };
  it('0 stars when lost', () => {
    expect(computeStars({ won: false, seconds: 10, moves: 5, mistakes: 0 }, goals)).toBe(0);
  });
  it('1 star for a bare win', () => {
    expect(computeStars({ won: true, seconds: 999, moves: 999, mistakes: 5 }, goals)).toBe(1);
  });
  it('adds a star per met objective', () => {
    // meets moves + time but not no-mistakes → 1 + 2 = 3? no: only 2 objectives met → 3 capped
    expect(computeStars({ won: true, seconds: 30, moves: 10, mistakes: 1 }, goals)).toBe(3);
    expect(computeStars({ won: true, seconds: 30, moves: 99, mistakes: 0 }, goals)).toBe(3);
    expect(computeStars({ won: true, seconds: 99, moves: 99, mistakes: 3 }, goals)).toBe(1);
  });
});
