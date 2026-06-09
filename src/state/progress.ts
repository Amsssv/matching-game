import type { Difficulty } from '../game/layout';
import { createStore } from './createStore';
import { getYSDK } from '../ysdk';
import { DEFAULT_EQUIPPED, ITEM_BY_ID, AXES, type CustomAxis } from './catalog';
import { computeClaim, rewardForDay } from './daily';

const PEARL_BASE: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 35, expert: 50 };
const SPEED_PAR:  Record<Difficulty, number> = { easy: 30, medium: 60, hard: 90, expert: 140 };

/**
 * Pearls awarded for a win: base by difficulty, +50% for a perfect run
 * (no wasted moves — `moves === totalPairs`, since a "move" is one pair-attempt),
 * +25% for finishing within the difficulty's par time. Rounded.
 */
export function computePearls(difficulty: Difficulty, seconds: number, moves: number, totalPairs: number): number {
  const base = PEARL_BASE[difficulty];
  let bonus = 0;
  if (moves === totalPairs)             bonus += base * 0.5;
  if (seconds <= SPEED_PAR[difficulty]) bonus += base * 0.25;
  return Math.round(base + bonus);
}

const STORAGE_KEY = 'sea-pairs-progress';

export interface ProgressStats {
  gamesPlayed: number;
  gamesWon: number;
  pairsMatched: number;
  bestSeconds: Record<Difficulty, number | null>;
  winsByDifficulty: Record<Difficulty, number>;
}
export interface StreakState { current: number; lastClaimDate: string | null; best: number; doubledDate: string | null; }
export interface ProgressState {
  version: 3;
  pearls: number;
  stats: ProgressStats;
  unlocked: string[];
  equipped: Record<CustomAxis, string>;
  streak: StreakState;
}

export const INITIAL_PROGRESS: ProgressState = {
  version: 3,
  pearls: 0,
  stats: {
    gamesPlayed: 0, gamesWon: 0, pairsMatched: 0,
    bestSeconds:      { easy: null, medium: null, hard: null, expert: null },
    winsByDifficulty: { easy: 0,    medium: 0,    hard: 0,    expert: 0 },
  },
  unlocked: [],
  equipped: { ...DEFAULT_EQUIPPED },
  streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null },
};

export const progressStore = createStore<ProgressState>(INITIAL_PROGRESS);

const num = (v: unknown): number => (typeof v === 'number' && v >= 0 ? v : 0);

function validEquipped(e: unknown): Partial<Record<CustomAxis, string>> {
  if (!e || typeof e !== 'object') return {};
  const out: Partial<Record<CustomAxis, string>> = {};
  for (const axis of AXES) {
    const v = (e as Record<string, unknown>)[axis];
    if (typeof v === 'string' && ITEM_BY_ID[v]?.axis === axis) out[axis] = v;
  }
  return out;
}

function validStreak(s: unknown): StreakState {
  const o = (s && typeof s === 'object') ? s as Record<string, unknown> : {};
  const current = typeof o.current === 'number' && o.current >= 0 ? Math.floor(o.current) : 0;
  const best = typeof o.best === 'number' && o.best >= 0 ? Math.floor(o.best) : 0;
  const lastClaimDate = typeof o.lastClaimDate === 'string' ? o.lastClaimDate : null;
  const doubledDate = typeof o.doubledDate === 'string' ? o.doubledDate : null;
  return { current, lastClaimDate, best: Math.max(best, current), doubledDate };
}

function mergeProgress(raw: unknown): ProgressState {
  const d = INITIAL_PROGRESS;
  if (!raw || typeof raw !== 'object') {
    return {
      version: 3,
      pearls: 0,
      stats: { ...d.stats, bestSeconds: { ...d.stats.bestSeconds }, winsByDifficulty: { ...d.stats.winsByDifficulty } },
      unlocked: [],
      equipped: { ...DEFAULT_EQUIPPED },
      streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null },
    };
  }
  const r = raw as { pearls?: unknown; stats?: Partial<ProgressStats>; unlocked?: unknown; equipped?: unknown; streak?: unknown };
  const s = r.stats ?? {};
  return {
    version: 3,
    pearls: num(r.pearls),
    stats: {
      gamesPlayed:  num(s.gamesPlayed),
      gamesWon:     num(s.gamesWon),
      pairsMatched: num(s.pairsMatched),
      bestSeconds:      { ...d.stats.bestSeconds,      ...(s.bestSeconds ?? {}) },
      winsByDifficulty: { ...d.stats.winsByDifficulty, ...(s.winsByDifficulty ?? {}) },
    },
    unlocked: Array.isArray(r.unlocked)
      ? (r.unlocked.filter((x): x is string => typeof x === 'string'))
      : [],
    equipped: { ...DEFAULT_EQUIPPED, ...validEquipped(r.equipped) },
    streak: validStreak(r.streak),
  };
}

function saveLocal(state: ProgressState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
}
function saveCloud(state: ProgressState): void {
  const sdk = getYSDK();
  if (!sdk) return;
  (async () => {
    try {
      const player = await sdk.getPlayer({ scopes: false });
      if (player.isAuthorized()) await player.setData({ progress: state }, true);
    } catch { /* best-effort */ }
  })();
}

let _cachedProgress: ProgressState | null = null;

function applyLoaded(state: ProgressState): ProgressState {
  progressStore.set(state);
  return state;
}

export async function resolveProgress(): Promise<ProgressState> {
  if (_cachedProgress) return _cachedProgress;
  const sdk = getYSDK();
  if (sdk) {
    try {
      const player = await sdk.getPlayer({ scopes: false });
      if (player.isAuthorized()) {
        const data = await player.getData(['progress']);
        if (data.progress) return (_cachedProgress = applyLoaded(mergeProgress(data.progress)));
      }
    } catch { /* fall through */ }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return (_cachedProgress = applyLoaded(mergeProgress(JSON.parse(raw))));
  } catch { /* blocked or corrupt */ }
  return (_cachedProgress = applyLoaded(mergeProgress(null)));
}

export function awardPearls(amount: number): void {
  progressStore.set({ pearls: progressStore.get().pearls + amount });
  saveLocal(progressStore.get());
  saveCloud(progressStore.get());
}

/** Claim today's streak reward. Returns {day, reward} or null if already claimed today. */
export function claimDaily(today: string): { day: number; reward: number } | null {
  const cur = progressStore.get();
  const info = computeClaim(cur.streak, today);
  if (!info.available) return null;
  progressStore.set({
    pearls: cur.pearls + info.reward,
    streak: { current: info.day, lastClaimDate: today, best: Math.max(cur.streak.best, info.day), doubledDate: null },
  });
  saveLocal(progressStore.get());
  saveCloud(progressStore.get());
  return { day: info.day, reward: info.reward };
}

/** Add the same reward again (rewarded-video ×2). Self-guarding + idempotent: no-op (returns 0) if no claim today or already doubled. Returns the bonus added. */
export function doubleDaily(today: string): number {
  const cur = progressStore.get();
  if (cur.streak.lastClaimDate !== today || cur.streak.doubledDate === today) return 0;  // no claim today, or already doubled
  const bonus = rewardForDay(cur.streak.current);
  progressStore.set({ pearls: cur.pearls + bonus, streak: { ...cur.streak, doubledDate: today } });
  saveLocal(progressStore.get());
  saveCloud(progressStore.get());
  return bonus;
}

export function isDailyAvailable(today: string): boolean {
  return computeClaim(progressStore.get().streak, today).available;
}

export function isUnlocked(id: string): boolean {
  const item = ITEM_BY_ID[id];
  if (!item) return false;
  return item.price === 0 || progressStore.get().unlocked.includes(id);
}

export function buyItem(id: string): boolean {
  const item = ITEM_BY_ID[id];
  if (!item || isUnlocked(id)) return false;
  const cur = progressStore.get();
  if (cur.pearls < item.price) return false;
  progressStore.set({ pearls: cur.pearls - item.price, unlocked: [...cur.unlocked, id] });
  saveLocal(progressStore.get());
  saveCloud(progressStore.get());
  return true;
}

/** Equip an unlocked item on its axis. Returns false (no-op) if the id is unknown, the wrong axis, or not unlocked. */
export function equipItem(axis: CustomAxis, id: string): boolean {
  const item = ITEM_BY_ID[id];
  if (!item || item.axis !== axis || !isUnlocked(id)) return false;
  progressStore.set({ equipped: { ...progressStore.get().equipped, [axis]: id } });
  saveLocal(progressStore.get());
  saveCloud(progressStore.get());
  return true;
}

export function recordGameStart(): void {
  const s = progressStore.get().stats;
  progressStore.set({ stats: { ...s, gamesPlayed: s.gamesPlayed + 1 } });
  saveLocal(progressStore.get());
}

export function recordGameWin(r: { difficulty: Difficulty; seconds: number; pairs: number }): void {
  const s = progressStore.get().stats;
  const prevBest = s.bestSeconds[r.difficulty];
  progressStore.set({
    stats: {
      ...s,
      gamesWon: s.gamesWon + 1,
      pairsMatched: s.pairsMatched + r.pairs,
      bestSeconds:      { ...s.bestSeconds,      [r.difficulty]: prevBest === null ? r.seconds : Math.min(prevBest, r.seconds) },
      winsByDifficulty: { ...s.winsByDifficulty, [r.difficulty]: s.winsByDifficulty[r.difficulty] + 1 },
    },
  });
  saveLocal(progressStore.get());
  saveCloud(progressStore.get());
}

export function resetProgress(): void {
  _cachedProgress = null;
  progressStore.set(mergeProgress(null));
}
