import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, ACH_BY_ID } from '../achievements';
const sig = (o: Partial<import('../achievements').AchSignals> = {}) => ({
  gamesWon: 0, pairsMatched: 0, winsByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
  perfectWins: 0, fastWins: 0, pearlsEarnedTotal: 0, streakBest: 0, unlockedCount: 0, ...o,
});
describe('achievement conditions', () => {
  it('firstWin needs 1 win; win10 needs 10', () => {
    expect(ACH_BY_ID.firstWin.done(sig({ gamesWon: 1 }))).toBe(true);
    expect(ACH_BY_ID.firstWin.done(sig({ gamesWon: 0 }))).toBe(false);
    expect(ACH_BY_ID.win10.done(sig({ gamesWon: 9 }))).toBe(false);
    expect(ACH_BY_ID.win10.done(sig({ gamesWon: 10 }))).toBe(true);
  });
  it('allDifficulties needs a win on each', () => {
    expect(ACH_BY_ID.allDifficulties.done(sig({ winsByDifficulty: { easy: 1, medium: 1, hard: 1, expert: 0 } }))).toBe(false);
    expect(ACH_BY_ID.allDifficulties.done(sig({ winsByDifficulty: { easy: 1, medium: 1, hard: 1, expert: 1 } }))).toBe(true);
  });
  it('streak7 / rich / collector thresholds', () => {
    expect(ACH_BY_ID.streak7.done(sig({ streakBest: 7 }))).toBe(true);
    expect(ACH_BY_ID.rich.done(sig({ pearlsEarnedTotal: 1000 }))).toBe(true);
    expect(ACH_BY_ID.collector.done(sig({ unlockedCount: 5 }))).toBe(true);
  });
  it('every achievement has a unique id + i18n key + positive reward', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    ACHIEVEMENTS.forEach((a) => { expect(a.nameKey).toBeTruthy(); expect(a.reward).toBeGreaterThan(0); });
  });
});
