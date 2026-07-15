import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computePearls, levelFromXp, xpForLevel } from '../progress';
import {
  progressStore, awardPearls, recordGameStart, recordGameWin, resetProgress,
  buyItem, equipItem, grantItem, isUnlocked,
  claimDaily, doubleDaily, isDailyAvailable,
  claimQuest, rerollQuest, claimAchievement, ensureTodayQuests, achSignals,
  INITIAL_PROGRESS, resolveProgress, winContext, recordGameLoss,
} from '../progress';
import { pickDailyQuests, QUEST_BY_ID } from '../quests';
import { todayStr } from '../daily';
import { CATALOG } from '../catalog';
import { ACHIEVEMENTS } from '../achievements';
import { BUNDLES } from '../iap';
import { LOCALES, type Lang } from '../../game/i18n';

describe('computePearls', () => {
  // Default context: a non-first, non-record win (winIndex 2 → no first-win ×2, no anti-farm).
  const ctx = (winIndex = 2, isRecord = false) => ({ winIndex, isRecord });
  it('awards base by difficulty with no bonuses', () => {
    expect(computePearls('easy',   999, 99, 6,  ctx())).toBe(10);
    expect(computePearls('medium', 999, 99, 10, ctx())).toBe(20);
    expect(computePearls('hard',   999, 99, 12, ctx())).toBe(35);
    expect(computePearls('expert', 999, 99, 14, ctx())).toBe(50);
  });
  it('adds a perfect-run bonus (+50%) when moves === totalPairs', () => {
    expect(computePearls('medium', 999, 10, 10, ctx())).toBe(30);
  });
  it('adds a fast bonus (+25%) at par and a blazing bonus (+50%) under par×0.6', () => {
    expect(computePearls('medium', 60, 99, 10, ctx())).toBe(25); // fast (60<=60), not blazing (60>36)
    expect(computePearls('medium', 36, 99, 10, ctx())).toBe(30); // blazing (36<=36) → +0.5
  });
  it('stacks perfect + speed and rounds', () => {
    expect(computePearls('easy', 30, 6, 6, ctx())).toBe(18);      // 10 × 1.75
    expect(computePearls('expert', 140, 14, 14, ctx())).toBe(88); // 50 × 1.75
  });
  it('doubles the first win of the day', () => {
    expect(computePearls('medium', 999, 99, 10, ctx(1))).toBe(40); // 20 × 1 × 2
  });
  it('adds a personal-record bonus (+50%)', () => {
    expect(computePearls('medium', 999, 99, 10, ctx(2, true))).toBe(30); // 20 × 1.5
  });
  it('applies anti-farm diminishing returns by win-of-day', () => {
    expect(computePearls('medium', 999, 99, 10, ctx(4))).toBe(10); // ×0.5
    expect(computePearls('medium', 999, 99, 10, ctx(7))).toBe(5);  // ×0.25
  });
});

describe('levelFromXp', () => {
  it('is level 1 at 0 xp', () => { expect(levelFromXp(0)).toEqual({ level: 1, into: 0, span: 100 }); });
  it('tracks progress within a level', () => { expect(levelFromXp(40)).toEqual({ level: 1, into: 40, span: 100 }); });
  it('reaches level 2 at 100 xp (span grows to 150)', () => { expect(levelFromXp(100)).toEqual({ level: 2, into: 0, span: 150 }); });
  it('reaches level 3 at 250 xp (100 + 150)', () => { expect(levelFromXp(250)).toEqual({ level: 3, into: 0, span: 200 }); });
});

describe('xpForLevel', () => {
  it('cumulative XP thresholds match the level costs', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(250);
    expect(xpForLevel(5)).toBe(700);
  });
  it('is the exact boundary of levelFromXp (reaching the threshold = that level)', () => {
    for (const L of [2, 3, 4, 5, 6]) expect(levelFromXp(xpForLevel(L)).level).toBe(L);
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
  it('recordGameWin accrues XP and grants a level-up reward', () => {
    // expert win = 25 XP; level 1→2 needs 100 XP → the 4th expert win levels up (+50 🦪).
    for (let i = 0; i < 3; i++) recordGameWin({ difficulty: 'expert', seconds: 200, pairs: 14, moves: 99 });
    expect(progressStore.get().stats.xp).toBe(75);
    expect(levelFromXp(progressStore.get().stats.xp).level).toBe(1);
    const before = progressStore.get().pearls;
    const res = recordGameWin({ difficulty: 'expert', seconds: 200, pairs: 14, moves: 99 }); // 100 XP → level 2
    expect(res).toEqual({ xpGained: 25, leveledUp: true, newLevel: 2 });
    expect(progressStore.get().stats.xp).toBe(100);
    expect(levelFromXp(progressStore.get().stats.xp).level).toBe(2);
    expect(progressStore.get().pearls).toBe(before + 50);
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
    expect(p.pearls).toBe(0); expect(p.version).toBe(5);
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
    awardPearls(5000);
    expect(buyItem('sea.reef')).toBe(true);            // costs 4000
    expect(progressStore.get().pearls).toBe(1000);
    expect(isUnlocked('sea.reef')).toBe(true);
    expect(buyItem('sea.reef')).toBe(false);           // already owned
  });
  it('equipItem only equips unlocked items of the right axis', () => {
    awardPearls(5000); buyItem('sea.reef');
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
    expect(saved.version).toBe(5);
  });
  it('mergeProgress upgrades a v1 blob to current defaults', async () => {
    localStorage.setItem('sea-pairs-progress', JSON.stringify({ version: 1, pearls: 50, stats: {} }));
    vi.resetModules();
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const m = await import('../progress');
    const p = await m.resolveProgress();
    expect(p.version).toBe(5);
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
  it('B6: new cosmetics buy + equip across every axis', () => {
    awardPearls(10000);
    expect(buyItem('sea.reef')).toBe(true); equipItem('seaTheme', 'sea.reef');
    expect(progressStore.get().equipped.seaTheme).toBe('sea.reef');
    expect(buyItem('back.silver')).toBe(true); equipItem('cardBack', 'back.silver');
    expect(progressStore.get().equipped.cardBack).toBe('back.silver');
    expect(buyItem('ui.crimson')).toBe(true); equipItem('uiPalette', 'ui.crimson');
    expect(progressStore.get().equipped.uiPalette).toBe('ui.crimson');
  });
  it('grantItem unlocks without charging pearls, idempotent, and persists', () => {
    awardPearls(50);                              // far less than ui.sand's 1500 price
    expect(grantItem('ui.sand')).toBe(true);
    expect(progressStore.get().pearls).toBe(50);  // not charged
    expect(isUnlocked('ui.sand')).toBe(true);
    expect(grantItem('ui.sand')).toBe(false);     // already owned → no-op
    const saved = JSON.parse(localStorage.getItem('sea-pairs-progress')!);
    expect(saved.unlocked).toContain('ui.sand');
  });
  it('every catalog item has a localized name in all 6 locales', () => {
    const langs = Object.keys(LOCALES) as Lang[];
    for (const item of CATALOG)
      for (const lang of langs)
        expect(LOCALES[lang].shopItems[item.nameKey], `${item.id} @ ${lang}`).toBeTruthy();
  });
  it('every priced uiPalette item defines the full 7-token map', () => {
    const KEYS = ['navy', 'navy-soft', 'blue', 'blue-mid', 'gold', 'gold-border', 'text-muted'];
    for (const item of CATALOG.filter((i) => i.axis === 'uiPalette' && i.price > 0))
      for (const k of KEYS)
        expect(item.palette?.[k], `${item.id}/${k}`).toBeTruthy();
  });
  it('every achievement has a localized name in all 6 locales', () => {
    const langs = Object.keys(LOCALES) as Lang[];
    for (const a of ACHIEVEMENTS)
      for (const lang of langs)
        expect(LOCALES[lang].achievements[a.nameKey], `${a.id} @ ${lang}`).toBeTruthy();
  });
  it('every bundle has a localized name in all 6 locales', () => {
    const langs = Object.keys(LOCALES) as Lang[];
    for (const b of BUNDLES)
      for (const lang of langs)
        expect(LOCALES[lang].shopItems[b.nameKey], `${b.id} @ ${lang}`).toBeTruthy();
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
    expect(p.version).toBe(5);
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
    // Seed with the REAL today: rerollQuest() internally calls ensureTodayQuests(todayStr()),
    // so a hardcoded date would be re-picked there and diverge from `before` (date-fragile).
    ensureTodayQuests(todayStr());
    const before = progressStore.get().quests.active.map((s) => s.id);
    const newId = rerollQuest(0);
    expect(before).not.toContain(newId);
    expect(progressStore.get().quests.active[0].id).toBe(newId);
    expect(progressStore.get().quests.rerolls).toBe(1);
  });
});

describe('modeBests + loss counters persistence', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); });

  it('INITIAL_PROGRESS has null bests for every new mode/difficulty and zero loss counters', () => {
    const s = INITIAL_PROGRESS.stats;
    for (const m of ['timeAttack', 'survival', 'noMistakes'] as const) {
      expect(s.modeBests[m]).toEqual({ easy: null, medium: null, hard: null, expert: null });
    }
    expect(s.lastLossDate).toBeNull();
    expect(s.lossesToday).toBe(0);
  });

  it('merge fills missing difficulties of a partial blob with null (not undefined)', async () => {
    localStorage.setItem('sea-pairs-progress', JSON.stringify({
      version: 4,
      stats: { modeBests: { timeAttack: { easy: 42 } } },
    }));
    const p = await resolveProgress();
    expect(p.stats.modeBests.timeAttack).toEqual({ easy: 42, medium: null, hard: null, expert: null });
    expect(p.stats.modeBests.survival).toEqual({ easy: null, medium: null, hard: null, expert: null });
    // Strict null, not undefined — `=== null` checks depend on it:
    expect(p.stats.modeBests.timeAttack.medium).toBeNull();
  });

  it('merge sanitizes garbage best values to null and never aliases INITIAL_PROGRESS', async () => {
    localStorage.setItem('sea-pairs-progress', JSON.stringify({
      version: 4,
      stats: { modeBests: { survival: { easy: -5, medium: 'zzz' } }, lossesToday: 3, lastLossDate: '2026-07-01' },
    }));
    const p = await resolveProgress();
    expect(p.stats.modeBests.survival).toEqual({ easy: null, medium: null, hard: null, expert: null });
    expect(p.stats.lossesToday).toBe(3);
    expect(p.stats.lastLossDate).toBe('2026-07-01');
    // No aliasing: mutating the loaded state must not leak into INITIAL_PROGRESS.
    p.stats.modeBests.timeAttack.easy = 999;
    expect(INITIAL_PROGRESS.stats.modeBests.timeAttack.easy).toBeNull();
  });
});

describe('mode-aware win economy', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); });

  const ctx = { isRecord: false, winIndex: 2 }; // no record bonus, no first-win ×2, farm ×1

  it('timeAttack: multiplier applies, speed bonus suppressed, perfect kept', () => {
    // easy base 10; blazing time (5s ≤ 30×0.6) would add +0.5 in classic
    expect(computePearls('easy', 5, 6, 6, ctx, 'classic')).toBe(Math.round(10 * (1 + 0.5 + 0.5)));      // perfect + blazing
    expect(computePearls('easy', 5, 6, 6, ctx, 'timeAttack')).toBe(Math.round(10 * 1.5 * (1 + 0.5)));   // perfect only
  });

  it('noMistakes: perfect AND speed suppressed, per-cell multiplier applies', () => {
    expect(computePearls('easy', 5, 6, 6, ctx, 'noMistakes')).toBe(Math.round(10 * 1.25 * 1));
    expect(computePearls('expert', 30, 14, 14, ctx, 'noMistakes')).toBe(Math.round(50 * 2 * 1));
  });

  it('record bonus still applies in every mode', () => {
    const rec = { isRecord: true, winIndex: 2 };
    expect(computePearls('easy', 5, 6, 6, rec, 'noMistakes')).toBe(Math.round(10 * 1.25 * 1.5));
  });

  it('winContext reads prevBest from modeBests for new modes and recordGameWin writes it there', () => {
    recordGameWin({ difficulty: 'easy', seconds: 40, pairs: 6, moves: 9, mode: 'timeAttack' });
    const s = progressStore.get().stats;
    expect(s.modeBests.timeAttack.easy).toBe(40);
    expect(s.bestSeconds.easy).toBeNull();               // classic records untouched
    expect(s.winsByDifficulty.easy).toBe(1);             // shared counters count all modes
    const ctx2 = winContext('easy', 35, 'timeAttack');
    expect(ctx2.isRecord).toBe(true);
    expect(ctx2.prevBest).toBe(40);
    const ctx3 = winContext('easy', 35, 'classic');      // classic context unaffected
    expect(ctx3.prevBest).toBeNull();
  });

  it('forced signals are suppressed in stats: timeAttack win is not "fast", noMistakes win is not "perfect"', () => {
    recordGameWin({ difficulty: 'easy', seconds: 5, pairs: 6, moves: 6, mode: 'timeAttack' });
    expect(progressStore.get().stats.fastWins).toBe(0);
    expect(progressStore.get().stats.perfectWins).toBe(1); // perfect kept for timeAttack
    recordGameWin({ difficulty: 'easy', seconds: 5, pairs: 6, moves: 6, mode: 'noMistakes' });
    expect(progressStore.get().stats.fastWins).toBe(0);
    expect(progressStore.get().stats.perfectWins).toBe(1); // unchanged — suppressed for noMistakes
  });

  it('XP is multiplied per cell', () => {
    const win = recordGameWin({ difficulty: 'expert', seconds: 60, pairs: 14, moves: 20, mode: 'timeAttack' });
    expect(win.xpGained).toBe(Math.round(25 * 1.5)); // 38
  });
});

describe('recordGameLoss (consolation)', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); });

  it('pays zero at zero progress (instant-dump farming is worthless)', () => {
    const r = recordGameLoss({ mode: 'timeAttack', difficulty: 'expert', pairsFound: 0, totalPairs: 14 });
    expect(r.pearls).toBe(0);
    expect(r.xp).toBe(0);
  });

  it('pays linearly with progress and applies the mode/cell multiplier', () => {
    const r = recordGameLoss({ mode: 'noMistakes', difficulty: 'expert', pairsFound: 13, totalPairs: 14 });
    const expected = Math.round(50 * 2 * 0.2 * (13 / 14)); // base×mult×RATE×progress = 19
    expect(r.pearls).toBe(expected);
    expect(progressStore.get().pearls).toBe(expected);
  });

  it('max consolation stays below the same cell farmed-win floor (invariant, all cells)', () => {
    // Exercises the REAL production functions (not duplicated constants) so a change to
    // CONSOLATION_RATE, the progress curve, or the farm tiers in progress.ts fails this test.
    const totalPairsByDifficulty = { easy: 6, medium: 10, hard: 12, expert: 14 } as const;
    for (const mode of ['timeAttack', 'noMistakes'] as const) {
      for (const d of ['easy', 'medium', 'hard', 'expert'] as const) {
        const totalPairs = totalPairsByDifficulty[d];

        // MAX consolation: max pre-win progress (totalPairs - 1), first loss of the day (lossFarm ×1).
        resetProgress();
        const maxConsolation = recordGameLoss({ mode, difficulty: d, pairsFound: totalPairs - 1, totalPairs }).pearls;

        // Farmed-win FLOOR: no perfect (moves off by one), no speed bonus (huge seconds),
        // not the first win of the day and deep into anti-farm (winIndex 7 → farm ×0.25).
        const farmedWinFloor = computePearls(d, 99999, totalPairs + 1, totalPairs, { isRecord: false, winIndex: 7 }, mode);

        expect(maxConsolation, `${mode}/${d}`).toBeLessThan(farmedWinFloor);
      }
    }
  });

  it('applies the loss anti-farm tiers and tracks lossesToday', () => {
    const full = { mode: 'timeAttack', difficulty: 'expert', pairsFound: 13, totalPairs: 14 } as const;
    const first = recordGameLoss(full).pearls;   // lossIndex 1 → ×1
    recordGameLoss(full); recordGameLoss(full);  // 2, 3
    const fourth = recordGameLoss(full).pearls;  // lossIndex 4 → ×0.5
    expect(fourth).toBe(Math.round(first * 0.5));
    expect(progressStore.get().stats.lossesToday).toBe(4);
    expect(progressStore.get().stats.lastLossDate).not.toBeNull();
  });

  it('level-up from consolation XP mints the level reward', () => {
    progressStore.set({ stats: { ...progressStore.get().stats, xp: 99 } });
    const before = progressStore.get().pearls;
    const r = recordGameLoss({ mode: 'noMistakes', difficulty: 'expert', pairsFound: 13, totalPairs: 14 }); // xp ≈ 6 → crosses 100
    expect(r.leveledUp).toBe(true);
    expect(r.newLevel).toBe(2);
    expect(progressStore.get().pearls).toBe(before + r.pearls + 50);
  });
});

describe('winsByMode', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); });

  it('recordGameWin increments the played mode, default classic', () => {
    recordGameWin({ difficulty: 'easy', seconds: 40, pairs: 6, moves: 9 }); // no mode → classic
    recordGameWin({ difficulty: 'easy', seconds: 40, pairs: 6, moves: 9, mode: 'survival' });
    recordGameWin({ difficulty: 'easy', seconds: 40, pairs: 6, moves: 9, mode: 'survival' });
    const w = progressStore.get().stats.winsByMode;
    expect(w.classic).toBe(1);
    expect(w.survival).toBe(2);
    expect(w.timeAttack).toBe(0);
    expect(w.noMistakes).toBe(0);
  });
});
