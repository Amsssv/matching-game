import { describe, it, expect } from 'vitest';
import { CHAPTERS, LEVELS_PER_CHAPTER, computeStars, difficultyForPairs } from '../campaign';

const chapter = (biome: string) => CHAPTERS.find((c) => c.biome === biome)!;

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
  it('every chapter has a mobile map position', () => {
    for (const c of CHAPTERS) {
      expect(typeof c.mobilePosition.x).toBe('number');
      expect(typeof c.mobilePosition.y).toBe('number');
    }
  });
});

describe('pair-count curve', () => {
  it('follows the approved escalation-with-breather curve', () => {
    expect(chapter('lagoon').levels.map((l) => l.pairs)).toEqual([2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6]);
    expect(chapter('volcano').levels.map((l) => l.pairs)).toEqual([4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8]);
    expect(chapter('abyss').levels.map((l) => l.pairs)).toEqual([10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14]);
  });
  it('every level has 2..14 pairs and a difficulty label derived from pairs', () => {
    for (const c of CHAPTERS) for (const l of c.levels) {
      expect(l.pairs).toBeGreaterThanOrEqual(2);
      expect(l.pairs).toBeLessThanOrEqual(14);
      expect(l.difficulty).toBe(difficultyForPairs(l.pairs));
    }
  });
  it('difficultyForPairs bands', () => {
    expect(difficultyForPairs(2)).toBe('easy');
    expect(difficultyForPairs(6)).toBe('easy');
    expect(difficultyForPairs(7)).toBe('medium');
    expect(difficultyForPairs(9)).toBe('medium');
    expect(difficultyForPairs(10)).toBe('hard');
    expect(difficultyForPairs(12)).toBe('hard');
    expect(difficultyForPairs(13)).toBe('expert');
    expect(difficultyForPairs(14)).toBe('expert');
  });
  it('goals scale with pairs and tighten by location + level', () => {
    // lagoon-1: N=2, loc 1.0, i=0 → moves max(4, round(4)), sec max(8, round(15))
    expect(chapter('lagoon').levels[0].goals).toEqual({ maxMoves: 4, maxSeconds: 15 });
    // abyss-12: N=14, loc 0.72, i=11 → t=0.665 → moves round(26.6)=27, sec round(69.8)=70
    expect(chapter('abyss').levels[11].goals).toEqual({ maxMoves: 27, maxSeconds: 70 });
    // ⭐2 always achievable: maxMoves >= pairs
    for (const c of CHAPTERS) for (const l of c.levels) {
      expect(l.goals.maxMoves!).toBeGreaterThanOrEqual(l.pairs);
    }
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
