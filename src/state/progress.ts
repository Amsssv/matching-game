import type { Difficulty } from '../game/layout';
import { createStore } from './createStore';
import { getYSDK } from '../ysdk';
import { DEFAULT_EQUIPPED, ITEM_BY_ID, AXES, type CustomAxis } from './catalog';
import { computeClaim, rewardForDay, todayStr } from './daily';
import { QUEST_BY_ID, pickDailyQuests, rerollQuestId, type QuestEvent } from './quests';
import { ACH_BY_ID, type AchSignals } from './achievements';

const PEARL_BASE: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 35, expert: 50 };
const SPEED_PAR:  Record<Difficulty, number> = { easy: 30, medium: 60, hard: 90, expert: 140 };

export interface WinContext {
  isRecord: boolean;   // beat the previous best time for this difficulty
  winIndex: number;    // 1-based index of this win today (1 = first win of the day)
}

const SPEED_BLAZING = 0.6;   // ≤ par × this = "blazing" (the higher speed tier)

/**
 * Pearls for a win: base(difficulty) × skill × first-win × anti-farm, rounded.
 *  - skill = 1 + perfect(+0.5, moves===totalPairs) + speed(blazing ≤par×0.6 → +0.5, else fast ≤par → +0.25) + record(+0.5)
 *  - first win of the day → ×2
 *  - anti-farm diminishing returns by win-of-day: wins 1-3 ×1, 4-6 ×0.5, 7+ ×0.25
 */
export function computePearls(difficulty: Difficulty, seconds: number, moves: number, totalPairs: number, ctx: WinContext): number {
  const base = PEARL_BASE[difficulty];
  const par = SPEED_PAR[difficulty];
  let skill = 1;
  if (moves === totalPairs) skill += 0.5;
  if (seconds <= par * SPEED_BLAZING) skill += 0.5;
  else if (seconds <= par)            skill += 0.25;
  if (ctx.isRecord) skill += 0.5;
  const firstWin = ctx.winIndex === 1 ? 2 : 1;
  const farm = ctx.winIndex <= 3 ? 1 : ctx.winIndex <= 6 ? 0.5 : 0.25;
  return Math.round(base * skill * firstWin * farm);
}

// ── Player level / XP (B8) ──
const XP_PER_WIN: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 18, expert: 25 };
const LEVEL_UP_REWARD = 50;   // pearls granted per level gained

/** Level (1-based) + progress within it from cumulative XP. Level L→L+1 costs 100 + 50·(L-1). */
export function levelFromXp(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  let span = 100;
  while (remaining >= span) { remaining -= span; level += 1; span = 100 + 50 * (level - 1); }
  return { level, into: remaining, span };
}

const STORAGE_KEY = 'sea-pairs-progress';

export interface ProgressStats {
  gamesPlayed: number;
  gamesWon: number;
  pairsMatched: number;
  bestSeconds: Record<Difficulty, number | null>;
  winsByDifficulty: Record<Difficulty, number>;
  perfectWins: number;
  fastWins: number;
  pearlsEarnedTotal: number;
  lastWinDate: string | null;   // local date of the last win (first-win-of-day ×2)
  winsToday: number;            // wins on lastWinDate (anti-farm diminishing returns)
  xp: number;                   // cumulative XP (player level, B8)
}
export interface StreakState { current: number; lastClaimDate: string | null; best: number; doubledDate: string | null; }
export interface QuestSlot { id: string; progress: number; claimed: boolean; }
export interface QuestsState { date: string | null; active: QuestSlot[]; rerolls: number; }
export interface AchievementsState { claimed: string[]; }
export interface ProgressState {
  version: 4;
  pearls: number;
  stats: ProgressStats;
  unlocked: string[];
  equipped: Record<CustomAxis, string>;
  streak: StreakState;
  quests: QuestsState;
  achievements: AchievementsState;
  processedPurchases: string[];   // consumable purchase tokens already credited (IAP idempotency)
}

export const INITIAL_PROGRESS: ProgressState = {
  version: 4,
  pearls: 0,
  stats: {
    gamesPlayed: 0, gamesWon: 0, pairsMatched: 0,
    bestSeconds:      { easy: null, medium: null, hard: null, expert: null },
    winsByDifficulty: { easy: 0,    medium: 0,    hard: 0,    expert: 0 },
    perfectWins: 0, fastWins: 0, pearlsEarnedTotal: 0,
    lastWinDate: null, winsToday: 0, xp: 0,
  },
  unlocked: [],
  equipped: { ...DEFAULT_EQUIPPED },
  streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null },
  quests: { date: null, active: [], rerolls: 0 },
  achievements: { claimed: [] },
  processedPurchases: [],
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

function validQuests(q: unknown): QuestsState {
  const o = (q && typeof q === 'object') ? q as Record<string, unknown> : {};
  const date = typeof o.date === 'string' ? o.date : null;
  const rerolls = typeof o.rerolls === 'number' && o.rerolls >= 0 ? Math.floor(o.rerolls) : 0;
  const active = Array.isArray(o.active)
    ? o.active.filter((x): x is QuestSlot => !!x && typeof x === 'object'
        && typeof (x as QuestSlot).id === 'string' && QUEST_BY_ID[(x as QuestSlot).id] !== undefined)
        .map((x) => ({ id: (x as QuestSlot).id, progress: num((x as QuestSlot).progress), claimed: (x as QuestSlot).claimed === true }))
    : [];
  return { date, active, rerolls };
}

function mergeProgress(raw: unknown): ProgressState {
  const d = INITIAL_PROGRESS;
  if (!raw || typeof raw !== 'object') {
    return {
      version: 4,
      pearls: 0,
      stats: { ...d.stats, bestSeconds: { ...d.stats.bestSeconds }, winsByDifficulty: { ...d.stats.winsByDifficulty } },
      unlocked: [],
      equipped: { ...DEFAULT_EQUIPPED },
      streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null },
      quests: { date: null, active: [], rerolls: 0 },
      achievements: { claimed: [] },
      processedPurchases: [],
    };
  }
  const r = raw as { pearls?: unknown; stats?: Partial<ProgressStats>; unlocked?: unknown; equipped?: unknown; streak?: unknown; quests?: unknown; achievements?: unknown; processedPurchases?: unknown };
  const s = r.stats ?? {};
  return {
    version: 4,
    pearls: num(r.pearls),
    stats: {
      gamesPlayed:  num(s.gamesPlayed),
      gamesWon:     num(s.gamesWon),
      pairsMatched: num(s.pairsMatched),
      bestSeconds:      { ...d.stats.bestSeconds,      ...(s.bestSeconds ?? {}) },
      winsByDifficulty: { ...d.stats.winsByDifficulty, ...(s.winsByDifficulty ?? {}) },
      perfectWins:       num(s.perfectWins),
      fastWins:          num(s.fastWins),
      pearlsEarnedTotal: num(s.pearlsEarnedTotal),
      lastWinDate: typeof s.lastWinDate === 'string' ? s.lastWinDate : null,
      winsToday:   num(s.winsToday),
      xp:          num(s.xp),
    },
    unlocked: Array.isArray(r.unlocked)
      ? (r.unlocked.filter((x): x is string => typeof x === 'string'))
      : [],
    equipped: { ...DEFAULT_EQUIPPED, ...validEquipped(r.equipped) },
    streak: validStreak(r.streak),
    quests: validQuests(r.quests),
    achievements: {
      claimed: Array.isArray((r.achievements as { claimed?: unknown })?.claimed)
        ? (r.achievements as { claimed: unknown[] }).claimed.filter((x): x is string => typeof x === 'string')
        : [],
    },
    processedPurchases: Array.isArray(r.processedPurchases)
      ? r.processedPurchases.filter((x): x is string => typeof x === 'string')
      : [],
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

/** Credit pearls + lifetime `pearlsEarnedTotal`, WITHOUT saving. Callers persist() once. */
function addPearls(amount: number): void {
  const c = progressStore.get();
  progressStore.set({ pearls: c.pearls + amount, stats: { ...c.stats, pearlsEarnedTotal: c.stats.pearlsEarnedTotal + amount } });
}
function persist(): void { saveLocal(progressStore.get()); saveCloud(progressStore.get()); }

// ── IAP idempotency ledger (B7) ──
// A consumable purchase (pearl pack / bundle) must be credited exactly once even if
// consumePurchase fails and reconcilePurchases later re-sees the unconsumed purchase. We persist
// credited tokens (cloud-synced), skip re-crediting them, and drop a token once consumed.
/** Whether this consumable purchase token has already been credited. */
export function isPurchaseProcessed(token: string): boolean {
  return progressStore.get().processedPurchases.includes(token);
}
/** Record a credited token (persisted local + cloud). */
export function markPurchaseProcessed(token: string): void {
  const c = progressStore.get();
  if (c.processedPurchases.includes(token)) return;
  progressStore.set({ processedPurchases: [...c.processedPurchases, token] });
  persist();
}
/** Drop a token after its purchase is consumed (it won't reappear) to keep the ledger small. */
export function clearPurchaseProcessed(token: string): void {
  const c = progressStore.get();
  if (!c.processedPurchases.includes(token)) return;
  progressStore.set({ processedPurchases: c.processedPurchases.filter((t) => t !== token) });
  persist();
}

/** Regenerate today's 3 quests if the stored day rolled over. Local-only save (the
 * board is deterministic per date, so cloud doesn't need a write here). */
export function ensureTodayQuests(today: string): void {
  const q = progressStore.get().quests;
  if (q.date === today) return;
  progressStore.set({ quests: { date: today, active: pickDailyQuests(today).map((id) => ({ id, progress: 0, claimed: false })), rerolls: 0 } });
  saveLocal(progressStore.get());
}

/** Build the achievement signal bag from progress slices. Single source of truth shared by
 * achSignals() (imperative) and the reactive TasksButton/TasksModal components. */
export function buildAchSignals(stats: ProgressStats, streakBest: number, unlockedCount: number): AchSignals {
  return {
    gamesWon: stats.gamesWon, pairsMatched: stats.pairsMatched, winsByDifficulty: stats.winsByDifficulty,
    perfectWins: stats.perfectWins, fastWins: stats.fastWins, pearlsEarnedTotal: stats.pearlsEarnedTotal,
    streakBest, unlockedCount,
    gamesPlayed: stats.gamesPlayed, level: levelFromXp(stats.xp).level,
  };
}

export function achSignals(): AchSignals {
  const p = progressStore.get();
  return buildAchSignals(p.stats, p.streak.best, p.unlocked.length);
}

export function awardPearls(amount: number): void { addPearls(amount); persist(); }

/** Claim today's streak reward. Returns {day, reward} or null if already claimed today. */
export function claimDaily(today: string): { day: number; reward: number } | null {
  const cur = progressStore.get();
  const info = computeClaim(cur.streak, today);
  if (!info.available) return null;
  addPearls(info.reward);
  progressStore.set({
    streak: { current: info.day, lastClaimDate: today, best: Math.max(cur.streak.best, info.day), doubledDate: null },
  });
  persist();
  return { day: info.day, reward: info.reward };
}

/** Add the same reward again (rewarded-video ×2). Self-guarding + idempotent: no-op (returns 0) if no claim today or already doubled. Returns the bonus added. */
export function doubleDaily(today: string): number {
  const cur = progressStore.get();
  if (cur.streak.lastClaimDate !== today || cur.streak.doubledDate === today) return 0;  // no claim today, or already doubled
  const bonus = rewardForDay(cur.streak.current);
  addPearls(bonus);
  progressStore.set({ streak: { ...progressStore.get().streak, doubledDate: today } });
  persist();
  return bonus;
}

export function isDailyAvailable(today: string): boolean {
  return computeClaim(progressStore.get().streak, today).available;
}

export function isUnlocked(id: string): boolean {
  const item = ITEM_BY_ID[id];
  if (!item) return false;
  return (!item.exclusive && item.price === 0) || progressStore.get().unlocked.includes(id);
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

/** Unlock an item WITHOUT charging pearls (money purchase / restore). Idempotent; returns false if unknown or already owned. */
export function grantItem(id: string): boolean {
  const item = ITEM_BY_ID[id];
  if (!item || isUnlocked(id)) return false;
  progressStore.set({ unlocked: [...progressStore.get().unlocked, id] });
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

/** Accumulate progress on today's active quests for a game event. Regenerates the
 * daily board first. Local-only save (frequent; cloud is coalesced to wins/claims). */
export function recordQuestEvent(event: QuestEvent): void {
  const today = todayStr();
  ensureTodayQuests(today);
  const q = progressStore.get().quests;
  const active = q.active.map((slot) => {
    if (slot.claimed) return slot;
    const def = QUEST_BY_ID[slot.id];
    const inc = def ? def.measure(event) : 0;
    return inc ? { ...slot, progress: Math.min(def.target, slot.progress + inc) } : slot;
  });
  progressStore.set({ quests: { ...q, active } });
  saveLocal(progressStore.get());
}

export function recordGameStart(): void {
  const s = progressStore.get().stats;
  progressStore.set({ stats: { ...s, gamesPlayed: s.gamesPlayed + 1 } });
  recordQuestEvent({ type: 'start' });   // saves local (game-start stays local-only, cloud coalesced)
}

/** Win context from the CURRENT state — call BEFORE recordGameWin updates it. */
export function winContext(difficulty: Difficulty, seconds: number): { isRecord: boolean; prevBest: number | null; winIndex: number; firstWinOfDay: boolean } {
  const s = progressStore.get().stats;
  const prevBest = s.bestSeconds[difficulty];
  const winsBefore = s.lastWinDate === todayStr() ? s.winsToday : 0;
  const winIndex = winsBefore + 1;
  return { isRecord: prevBest === null || seconds < prevBest, prevBest, winIndex, firstWinOfDay: winIndex === 1 };
}

export function recordGameWin(r: { difficulty: Difficulty; seconds: number; pairs: number; moves: number }): { xpGained: number; leveledUp: boolean; newLevel: number } {
  const s = progressStore.get().stats;
  const prevBest = s.bestSeconds[r.difficulty];
  const perfect = r.moves === r.pairs;
  const fast = r.seconds <= SPEED_PAR[r.difficulty];
  const today = todayStr();
  const sameDay = s.lastWinDate === today;
  const xpGained = XP_PER_WIN[r.difficulty];
  const newXp = s.xp + xpGained;
  const newLevel = levelFromXp(newXp).level;
  const levelsGained = newLevel - levelFromXp(s.xp).level;
  progressStore.set({
    stats: {
      ...s,
      gamesWon: s.gamesWon + 1,
      pairsMatched: s.pairsMatched + r.pairs,
      bestSeconds:      { ...s.bestSeconds,      [r.difficulty]: prevBest === null ? r.seconds : Math.min(prevBest, r.seconds) },
      winsByDifficulty: { ...s.winsByDifficulty, [r.difficulty]: s.winsByDifficulty[r.difficulty] + 1 },
      perfectWins: s.perfectWins + (perfect ? 1 : 0),
      fastWins:    s.fastWins + (fast ? 1 : 0),
      lastWinDate: today,
      winsToday:   sameDay ? s.winsToday + 1 : 1,
      xp: newXp,
    },
  });
  // Level-up bonus — XP is independent of pearls, so crediting pearls can't feed back into level.
  if (levelsGained > 0) addPearls(LEVEL_UP_REWARD * levelsGained);
  recordQuestEvent({ type: 'win', difficulty: r.difficulty, pairs: r.pairs, perfect, fast });   // sets quests + saveLocal
  saveCloud(progressStore.get());   // a win is significant → one cloud write, after quest progress is applied
  return { xpGained, leveledUp: levelsGained > 0, newLevel };
}

export function claimQuest(id: string): number | null {
  const q = progressStore.get().quests;
  const slot = q.active.find((s) => s.id === id);
  const def = QUEST_BY_ID[id];
  if (!slot || !def || slot.claimed || slot.progress < def.target) return null;
  addPearls(def.reward);
  progressStore.set({ quests: { ...progressStore.get().quests, active: progressStore.get().quests.active.map((s) => (s.id === id ? { ...s, claimed: true } : s)) } });
  persist();
  return def.reward;
}

/** Replace the quest at index with an unused one (progress 0). Returns the new id, or null if no quest there / pool exhausted. (Controller gates this behind a rewarded ad.) */
export function rerollQuest(index: number): string | null {
  const today = todayStr();
  ensureTodayQuests(today);
  const q = progressStore.get().quests;
  const slot = q.active[index];
  if (!slot) return null;
  const newId = rerollQuestId(today, q.active.map((s) => s.id), q.rerolls);
  if (!newId) return null;
  const active = q.active.map((s, i) => (i === index ? { id: newId, progress: 0, claimed: false } : s));
  progressStore.set({ quests: { ...q, active, rerolls: q.rerolls + 1 } });
  persist();
  return newId;
}

export function claimAchievement(id: string): number | null {
  const def = ACH_BY_ID[id];
  const p = progressStore.get();
  if (!def || p.achievements.claimed.includes(id) || !def.done(achSignals())) return null;
  addPearls(def.reward);
  progressStore.set({ achievements: { claimed: [...progressStore.get().achievements.claimed, id] } });
  persist();
  return def.reward;
}

export function resetProgress(): void {
  _cachedProgress = null;
  progressStore.set(mergeProgress(null));
}
