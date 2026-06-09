import type { Difficulty } from '../game/layout';
import { createStore } from './createStore';
import { getYSDK } from '../ysdk';

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
export interface ProgressState {
  version: 1;
  pearls: number;
  stats: ProgressStats;
}

export const INITIAL_PROGRESS: ProgressState = {
  version: 1,
  pearls: 0,
  stats: {
    gamesPlayed: 0, gamesWon: 0, pairsMatched: 0,
    bestSeconds:      { easy: null, medium: null, hard: null, expert: null },
    winsByDifficulty: { easy: 0,    medium: 0,    hard: 0,    expert: 0 },
  },
};

export const progressStore = createStore<ProgressState>(INITIAL_PROGRESS);

const num = (v: unknown): number => (typeof v === 'number' && v >= 0 ? v : 0);

function mergeProgress(raw: unknown): ProgressState {
  const d = INITIAL_PROGRESS;
  if (!raw || typeof raw !== 'object') {
    return { version: 1, pearls: 0, stats: { ...d.stats, bestSeconds: { ...d.stats.bestSeconds }, winsByDifficulty: { ...d.stats.winsByDifficulty } } };
  }
  const r = raw as { pearls?: unknown; stats?: Partial<ProgressStats> };
  const s = r.stats ?? {};
  return {
    version: 1,
    pearls: num(r.pearls),
    stats: {
      gamesPlayed:  num(s.gamesPlayed),
      gamesWon:     num(s.gamesWon),
      pairsMatched: num(s.pairsMatched),
      bestSeconds:      { ...d.stats.bestSeconds,      ...(s.bestSeconds ?? {}) },
      winsByDifficulty: { ...d.stats.winsByDifficulty, ...(s.winsByDifficulty ?? {}) },
    },
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
