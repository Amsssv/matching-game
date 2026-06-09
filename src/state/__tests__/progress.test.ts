import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computePearls } from '../progress';
import {
  progressStore, awardPearls, recordGameStart, recordGameWin, resetProgress,
  buyItem, equipItem, isUnlocked,
  claimDaily, doubleDaily, isDailyAvailable,
  claimQuest, rerollQuest, claimAchievement, ensureTodayQuests, achSignals,
} from '../progress';
import { pickDailyQuests, QUEST_BY_ID } from '../quests';

describe('computePearls', () => {
  it('awards base by difficulty with no bonuses', () => {
    expect(computePearls('easy',   999, 99, 6)).toBe(10);
    expect(computePearls('medium', 999, 99, 10)).toBe(20);
    expect(computePearls('hard',   999, 99, 12)).toBe(35);
    expect(computePearls('expert', 999, 99, 14)).toBe(50);
  });
  it('adds a perfect-run bonus (+50%) when moves === totalPairs', () => {
    expect(computePearls('medium', 999, 10, 10)).toBe(30);
  });
  it('adds a speed bonus (+25%) when seconds <= par', () => {
    expect(computePearls('medium', 60, 99, 10)).toBe(25);
  });
  it('stacks perfect + speed and rounds', () => {
    expect(computePearls('easy', 30, 6, 6)).toBe(18);
    expect(computePearls('expert', 140, 14, 14)).toBe(88);
  });
});

describe('progress mutators', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); });

  it('starts at zero pearls and zero stats', () => {
    expect(progressStore.get().pearls).toBe(0);
    expect(progressStore.get().stats.gamesWon).toBe(0);
  });
  it('awardPearls adds to the balance and persists', () => {
    awardPearls(30);
    expect(progressStore.get().pearls).toBe(30);
    expect(JSON.parse(localStorage.getItem('sea-pairs-progress')!).pearls).toBe(30);
  });
  it('recordGameStart increments gamesPlayed', () => {
    recordGameStart(); recordGameStart();
    expect(progressStore.get().stats.gamesPlayed).toBe(2);
  });
  it('recordGameWin updates win stats and keeps best time', () => {
    recordGameWin({ difficulty: 'hard', seconds: 90, pairs: 12, moves: 99 });
    recordGameWin({ difficulty: 'hard', seconds: 70, pairs: 12, moves: 99 });
    const s = progressStore.get().stats;
    expect(s.gamesWon).toBe(2);
    expect(s.winsByDifficulty.hard).toBe(2);
    expect(s.pairsMatched).toBe(24);
    expect(s.bestSeconds.hard).toBe(70);
  });
});

describe('resolveProgress', () => {
  beforeEach(() => { vi.resetModules(); localStorage.clear(); });

  it('returns defaults when nothing stored and no SDK', async () => {
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const { resolveProgress } = await import('../progress');
    const p = await resolveProgress();
    expect(p.pearls).toBe(0); expect(p.version).toBe(4);
  });
  it('loads from localStorage', async () => {
    localStorage.setItem('sea-pairs-progress', JSON.stringify({ version: 1, pearls: 42, stats: {} }));
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const { resolveProgress } = await import('../progress');
    expect((await resolveProgress()).pearls).toBe(42);
  });
  it('merges missing keys onto defaults', async () => {
    localStorage.setItem('sea-pairs-progress', JSON.stringify({ version: 1, pearls: 5 }));
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const { resolveProgress } = await import('../progress');
    const p = await resolveProgress();
    expect(p.pearls).toBe(5);
    expect(p.stats.gamesWon).toBe(0);
    expect(p.stats.bestSeconds.easy).toBe(null);
  });
  it('returns defaults on corrupt JSON', async () => {
    localStorage.setItem('sea-pairs-progress', '{not json');
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const { resolveProgress } = await import('../progress');
    expect((await resolveProgress()).pearls).toBe(0);
  });
  it('prefers cloud data for authorized players', async () => {
    vi.doMock('../../ysdk', () => ({
      getYSDK: () => ({
        getPlayer: async () => ({ isAuthorized: () => true, getData: async () => ({ progress: { version: 1, pearls: 77, stats: {} } }) }),
      }),
    }));
    const { resolveProgress } = await import('../progress');
    expect((await resolveProgress()).pearls).toBe(77);
  });
});

describe('shop economy (progress v2)', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); });

  it('defaults (price 0) are always unlocked; equipped starts at defaults', () => {
    expect(isUnlocked('sea.lagoon')).toBe(true);
    expect(progressStore.get().equipped.seaTheme).toBe('sea.lagoon');
    expect(isUnlocked('sea.reef')).toBe(false);
  });
  it('buyItem deducts pearls and unlocks; fails when too poor or already owned', () => {
    expect(buyItem('sea.reef')).toBe(false);          // 0 pearls
    awardPearls(200);
    expect(buyItem('sea.reef')).toBe(true);            // costs 80
    expect(progressStore.get().pearls).toBe(120);
    expect(isUnlocked('sea.reef')).toBe(true);
    expect(buyItem('sea.reef')).toBe(false);           // already owned
  });
  it('equipItem only equips unlocked items of the right axis', () => {
    awardPearls(200); buyItem('sea.reef');
    equipItem('seaTheme', 'sea.reef');
    expect(progressStore.get().equipped.seaTheme).toBe('sea.reef');
    equipItem('seaTheme', 'sea.abyss');                // not unlocked → ignored
    expect(progressStore.get().equipped.seaTheme).toBe('sea.reef');
  });
  it('persists unlocked + equipped to localStorage', () => {
    awardPearls(200); buyItem('back.gold'); equipItem('cardBack', 'back.gold');
    const saved = JSON.parse(localStorage.getItem('sea-pairs-progress')!);
    expect(saved.unlocked).toContain('back.gold');
    expect(saved.equipped.cardBack).toBe('back.gold');
    expect(saved.version).toBe(4);
  });
  it('mergeProgress upgrades a v1 blob to current defaults', async () => {
    localStorage.setItem('sea-pairs-progress', JSON.stringify({ version: 1, pearls: 50, stats: {} }));
    vi.resetModules();
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const m = await import('../progress');
    const p = await m.resolveProgress();
    expect(p.version).toBe(4);
    expect(p.pearls).toBe(50);
    expect(p.unlocked).toEqual([]);
    expect(p.equipped.seaTheme).toBe('sea.lagoon');
  });
  it('mergeProgress drops an unknown equipped id and falls back to default', async () => {
    localStorage.setItem('sea-pairs-progress', JSON.stringify({
      version: 2, pearls: 0, stats: {}, unlocked: [],
      equipped: { seaTheme: 'sea.DOES_NOT_EXIST', cardBack: 'back.gold', uiPalette: 'ui.ocean' },
    }));
    vi.resetModules();
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const m = await import('../progress');
    const p = await m.resolveProgress();
    expect(p.equipped.seaTheme).toBe('sea.lagoon');   // bogus id → default
    expect(p.equipped.cardBack).toBe('back.gold');    // real cardBack item → retained (existence+axis only, no ownership check)
    expect(p.equipped.uiPalette).toBe('ui.ocean');    // valid default → unchanged
  });
});

describe('daily streak (progress v3)', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); });
  it('first claim awards day-1 reward and sets streak', () => {
    expect(claimDaily('2026-06-09')).toEqual({ day: 1, reward: 10 });
    expect(progressStore.get().pearls).toBe(10);
    expect(progressStore.get().streak).toEqual({ current: 1, lastClaimDate: '2026-06-09', best: 1, doubledDate: null });
  });
  it('second claim same day is a no-op (null)', () => {
    claimDaily('2026-06-09');
    expect(claimDaily('2026-06-09')).toBeNull();
    expect(progressStore.get().pearls).toBe(10);
  });
  it('consecutive day continues the streak', () => {
    claimDaily('2026-06-09');
    expect(claimDaily('2026-06-10')).toEqual({ day: 2, reward: 15 });
    expect(progressStore.get().pearls).toBe(25);
    expect(progressStore.get().streak.current).toBe(2);
  });
  it('gap resets to day 1 but keeps best', () => {
    claimDaily('2026-06-09'); claimDaily('2026-06-10');
    expect(claimDaily('2026-06-13')).toEqual({ day: 1, reward: 10 });
    expect(progressStore.get().streak).toEqual({ current: 1, lastClaimDate: '2026-06-13', best: 2, doubledDate: null });
  });
  it('doubleDaily adds the reward again, only once, only after a claim', () => {
    expect(doubleDaily('2026-06-09')).toBe(0);     // no claim yet → no-op
    claimDaily('2026-06-09');                       // +10
    expect(doubleDaily('2026-06-09')).toBe(10);     // +10
    expect(doubleDaily('2026-06-09')).toBe(0);      // already doubled → no-op
    expect(progressStore.get().pearls).toBe(20);
  });
  it('isDailyAvailable reflects claim state', () => {
    expect(isDailyAvailable('2026-06-09')).toBe(true);
    claimDaily('2026-06-09');
    expect(isDailyAvailable('2026-06-09')).toBe(false);
  });
  it('v2 save (no streak) upgrades to v3 with default streak', async () => {
    localStorage.setItem('sea-pairs-progress', JSON.stringify({ version: 2, pearls: 5, stats: {}, unlocked: [], equipped: {} }));
    vi.resetModules();
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const m = await import('../progress');
    const p = await m.resolveProgress();
    expect(p.version).toBe(4);
    expect(p.streak).toEqual({ current: 0, lastClaimDate: null, best: 0, doubledDate: null });
    expect(p.pearls).toBe(5);
  });
});

describe('quests + achievements (progress v4)', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); });
  it('ensureTodayQuests sets 3 deterministic quests for the day', () => {
    ensureTodayQuests('2026-06-09');
    const q = progressStore.get().quests;
    expect(q.date).toBe('2026-06-09');
    expect(q.active.map((s) => s.id)).toEqual(pickDailyQuests('2026-06-09'));
    expect(q.active.every((s) => s.progress === 0 && !s.claimed)).toBe(true);
  });
  it('claimAchievement firstWin after a win, then null on repeat', () => {
    recordGameWin({ difficulty: 'easy', seconds: 10, pairs: 6, moves: 6 });
    expect(achSignals().gamesWon).toBe(1);
    expect(claimAchievement('firstWin')).toBe(20);
    expect(progressStore.get().pearls).toBe(20);
    expect(progressStore.get().stats.pearlsEarnedTotal).toBeGreaterThanOrEqual(20);
    expect(claimAchievement('firstWin')).toBeNull();
  });
  it('perfect + fast win increments counters', () => {
    recordGameWin({ difficulty: 'easy', seconds: 5, pairs: 6, moves: 6 });   // perfect (6===6) + fast (5<=30)
    expect(progressStore.get().stats.perfectWins).toBe(1);
    expect(progressStore.get().stats.fastWins).toBe(1);
  });
  it('claimQuest only when target met', () => {
    ensureTodayQuests('2026-06-09');
    const id = progressStore.get().quests.active[0].id;
    const def = QUEST_BY_ID[id];
    expect(claimQuest(id)).toBeNull();   // progress 0
    progressStore.set({ quests: { ...progressStore.get().quests, active: progressStore.get().quests.active.map((s) => (s.id === id ? { ...s, progress: def.target } : s)) } });
    expect(claimQuest(id)).toBe(def.reward);
    expect(claimQuest(id)).toBeNull();   // already claimed
  });
  it('rerollQuest swaps in an unused quest', () => {
    ensureTodayQuests('2026-06-09');
    const before = progressStore.get().quests.active.map((s) => s.id);
    const newId = rerollQuest(0);
    expect(before).not.toContain(newId);
    expect(progressStore.get().quests.active[0].id).toBe(newId);
    expect(progressStore.get().quests.rerolls).toBe(1);
  });
});
