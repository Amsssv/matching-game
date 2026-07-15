import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, ACH_BY_ID } from '../achievements';
const sig = (o: Partial<import('../achievements').AchSignals> = {}) => ({
  gamesWon: 0, pairsMatched: 0, winsByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
  perfectWins: 0, fastWins: 0, pearlsEarnedTotal: 0, streakBest: 0, unlockedCount: 0,
  gamesPlayed: 0, level: 1,
  winsByMode: { classic: 0, timeAttack: 0, survival: 0, noMistakes: 0 },
  ownedByAxis: { seaTheme: 0, cardBack: 0, uiPalette: 0 },
  campaignStars: 0, campaignLevelsCleared: 0, campaignChaptersComplete: 0,
  ...o,
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
  it('B6.1 tiers: games-played / level / difficulty-mastery thresholds', () => {
    expect(ACH_BY_ID.play100.done(sig({ gamesPlayed: 99 }))).toBe(false);
    expect(ACH_BY_ID.play100.done(sig({ gamesPlayed: 100 }))).toBe(true);
    expect(ACH_BY_ID.level5.done(sig({ level: 4 }))).toBe(false);
    expect(ACH_BY_ID.level10.done(sig({ level: 10 }))).toBe(true);
    expect(ACH_BY_ID.hardMaster.done(sig({ winsByDifficulty: { easy: 0, medium: 0, hard: 10, expert: 0 } }))).toBe(true);
    expect(ACH_BY_ID.collector15.done(sig({ unlockedCount: 15 }))).toBe(true);
  });
  it('every achievement has a unique id + i18n key + positive reward', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    ACHIEVEMENTS.forEach((a) => { expect(a.nameKey).toBeTruthy(); expect(a.reward).toBeGreaterThan(0); });
  });
});

describe('mode + collection achievements', () => {
  it('mode wins gate on winsByMode', () => {
    expect(ACH_BY_ID.taWin.done(sig({ winsByMode: { classic: 0, timeAttack: 1, survival: 0, noMistakes: 0 } }))).toBe(true);
    expect(ACH_BY_ID.survWin10.done(sig({ winsByMode: { classic: 0, timeAttack: 0, survival: 9, noMistakes: 0 } }))).toBe(false);
    expect(ACH_BY_ID.survWin10.done(sig({ winsByMode: { classic: 0, timeAttack: 0, survival: 10, noMistakes: 0 } }))).toBe(true);
  });
  it('allModes needs every mode won', () => {
    expect(ACH_BY_ID.allModes.done(sig({ winsByMode: { classic: 1, timeAttack: 1, survival: 1, noMistakes: 0 } }))).toBe(false);
    const all = { classic: 1, timeAttack: 1, survival: 1, noMistakes: 1 };
    expect(ACH_BY_ID.allModes.done(sig({ winsByMode: all }))).toBe(true);
    expect(ACH_BY_ID.allModes.progress(sig({ winsByMode: { classic: 1, timeAttack: 1, survival: 0, noMistakes: 0 } }))).toBe(2);
  });
  it('deeper tiers gate correctly', () => {
    expect(ACH_BY_ID.win100.done(sig({ gamesWon: 100 }))).toBe(true);
    expect(ACH_BY_ID.pairs2500.done(sig({ pairsMatched: 2499 }))).toBe(false);
    expect(ACH_BY_ID.rich5000.done(sig({ pearlsEarnedTotal: 5000 }))).toBe(true);
  });
  it('collection completion uses ownedByAxis against catalog totals', () => {
    expect(ACH_BY_ID.seaAll.done(sig({ ownedByAxis: { seaTheme: ACH_BY_ID.seaAll.target, cardBack: 0, uiPalette: 0 } }))).toBe(true);
    expect(ACH_BY_ID.seaAll.done(sig({ ownedByAxis: { seaTheme: ACH_BY_ID.seaAll.target - 1, cardBack: 0, uiPalette: 0 } }))).toBe(false);
  });
});

describe('journey (campaign) achievements', () => {
  it('level-clear tiers gate on campaignLevelsCleared', () => {
    expect(ACH_BY_ID.campFirst.done(sig({ campaignLevelsCleared: 0 }))).toBe(false);
    expect(ACH_BY_ID.campFirst.done(sig({ campaignLevelsCleared: 1 }))).toBe(true);
    expect(ACH_BY_ID.campLevels30.done(sig({ campaignLevelsCleared: 29 }))).toBe(false);
    expect(ACH_BY_ID.campLevels30.done(sig({ campaignLevelsCleared: 30 }))).toBe(true);
  });
  it('star tiers gate on campaignStars', () => {
    expect(ACH_BY_ID.campStars50.done(sig({ campaignStars: 50 }))).toBe(true);
    expect(ACH_BY_ID.campStars120.done(sig({ campaignStars: 119 }))).toBe(false);
    expect(ACH_BY_ID.campStars120.done(sig({ campaignStars: 120 }))).toBe(true);
  });
  it('chapter tiers gate on campaignChaptersComplete', () => {
    expect(ACH_BY_ID.campChapter.done(sig({ campaignChaptersComplete: 1 }))).toBe(true);
    expect(ACH_BY_ID.campAllChapters.done(sig({ campaignChaptersComplete: 4 }))).toBe(false);
    expect(ACH_BY_ID.campAllChapters.done(sig({ campaignChaptersComplete: 5 }))).toBe(true);
  });
});
