import type { Difficulty } from '../game/layout';
import { PEARL_MULT, XP_MULT, type GameMode } from '../game/modes';
import { createStore } from './createStore';
import { getYSDK } from '../ysdk';
import { DEFAULT_EQUIPPED, ITEM_BY_ID, AXES, type CustomAxis } from './catalog';
import { computeClaim, rewardForDay, todayStr } from './daily';
import { QUEST_BY_ID, pickDailyQuests, rerollQuestId, type QuestEvent } from './quests';
import { ACH_BY_ID, type AchSignals } from './achievements';
import { computeStars, levelById, isChapterComplete, type LevelResult } from './campaign';

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
export function computePearls(difficulty: Difficulty, seconds: number, moves: number, totalPairs: number, ctx: WinContext, mode: GameMode = 'classic'): number {
  const base = PEARL_BASE[difficulty];
  const par = SPEED_PAR[difficulty];
  let skill = 1;
  // Anti-double-pay: bonuses a mode FORCES are folded into its multiplier instead.
  if (mode !== 'noMistakes' && moves === totalPairs) skill += 0.5;                 // perfect is forced in noMistakes
  if (mode !== 'timeAttack' && mode !== 'noMistakes') {                            // speed is forced in both
    if (seconds <= par * SPEED_BLAZING) skill += 0.5;
    else if (seconds <= par)            skill += 0.25;
  }
  if (ctx.isRecord) skill += 0.5;
  const firstWin = ctx.winIndex === 1 ? 2 : 1;
  const farm = ctx.winIndex <= 3 ? 1 : ctx.winIndex <= 6 ? 0.5 : 0.25;
  return Math.round(base * PEARL_MULT[mode][difficulty] * skill * firstWin * farm);
}

// ── Player level / XP (B8) ──
const XP_PER_WIN: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 18, expert: 25 };
export const LEVEL_UP_REWARD = 50;   // pearls granted per level gained

/** Level (1-based) + progress within it from cumulative XP. Level L→L+1 costs 100 + 50·(L-1). */
export function levelFromXp(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  let span = 100;
  while (remaining >= span) { remaining -= span; level += 1; span = 100 + 50 * (level - 1); }
  return { level, into: remaining, span };
}

/** Cumulative XP needed to REACH `level` (level 1 = 0). Used for the "unlock progress"
 * bar on a locked mode card: fraction = xp / xpForLevel(unlockLevel). */
export function xpForLevel(level: number): number {
  let total = 0;
  for (let L = 1; L < Math.max(1, Math.floor(level)); L++) total += 100 + 50 * (L - 1);
  return total;
}

const STORAGE_KEY = 'sea-pairs-progress';

export type NewMode = Exclude<GameMode, 'classic'>;
export type ModeBests = Record<NewMode, Record<Difficulty, number | null>>;
const NEW_MODES: readonly NewMode[] = ['timeAttack', 'survival', 'noMistakes'];

export interface ProgressStats {
  gamesPlayed: number;
  gamesWon: number;
  pairsMatched: number;
  bestSeconds: Record<Difficulty, number | null>;
  winsByDifficulty: Record<Difficulty, number>;
  winsByMode: Record<GameMode, number>;   // wins per game mode (achievements)
  perfectWins: number;
  fastWins: number;
  pearlsEarnedTotal: number;
  lastWinDate: string | null;   // local date of the last win (first-win-of-day ×2)
  winsToday: number;            // wins on lastWinDate (anti-farm diminishing returns)
  xp: number;                   // cumulative XP (player level, B8)
  seenLevel: number;            // last level the player has acknowledged (level-up modal)
  modeBests: ModeBests;          // best seconds per (new mode, difficulty); classic keeps bestSeconds
  lastLossDate: string | null;   // local date of the last consolation-paid loss
  lossesToday: number;           // losses on lastLossDate (anti-farm for consolation)
}
export interface StreakState { current: number; lastClaimDate: string | null; best: number; doubledDate: string | null; }
export interface QuestSlot { id: string; progress: number; claimed: boolean; }
export interface QuestsState { date: string | null; active: QuestSlot[]; rerolls: number; }
export interface AchievementsState { claimed: string[]; }
export interface CampaignProgress { stars: Record<string, 0 | 1 | 2 | 3>; cleared: string[] }
export interface EnergyState { current: number; max: number; lastRegenTs: number }
export interface ProgressState {
  version: 5;
  pearls: number;
  stats: ProgressStats;
  unlocked: string[];
  equipped: Record<CustomAxis, string>;
  streak: StreakState;
  quests: QuestsState;
  achievements: AchievementsState;
  processedPurchases: string[];   // consumable purchase tokens already credited (IAP idempotency)
  campaign: CampaignProgress;
  energy: EnergyState;
}

export const INITIAL_PROGRESS: ProgressState = {
  version: 5,
  pearls: 0,
  stats: {
    gamesPlayed: 0, gamesWon: 0, pairsMatched: 0,
    bestSeconds:      { easy: null, medium: null, hard: null, expert: null },
    winsByDifficulty: { easy: 0,    medium: 0,    hard: 0,    expert: 0 },
    winsByMode: { classic: 0, timeAttack: 0, survival: 0, noMistakes: 0 },
    perfectWins: 0, fastWins: 0, pearlsEarnedTotal: 0,
    lastWinDate: null, winsToday: 0, xp: 0, seenLevel: 1,
    modeBests: {
      timeAttack: { easy: null, medium: null, hard: null, expert: null },
      survival:   { easy: null, medium: null, hard: null, expert: null },
      noMistakes: { easy: null, medium: null, hard: null, expert: null },
    },
    lastLossDate: null, lossesToday: 0,
  },
  unlocked: [],
  equipped: { ...DEFAULT_EQUIPPED },
  streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null },
  quests: { date: null, active: [], rerolls: 0 },
  achievements: { claimed: [] },
  processedPurchases: [],
  campaign: { stars: {}, cleared: [] },
  energy: { current: 5, max: 5, lastRegenTs: 0 },
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

const bestVal = (v: unknown): number | null => (typeof v === 'number' && v >= 0 ? v : null);
function bestRec(r: unknown): Record<Difficulty, number | null> {
  const o = (r && typeof r === 'object') ? r as Record<string, unknown> : {};
  return { easy: bestVal(o.easy), medium: bestVal(o.medium), hard: bestVal(o.hard), expert: bestVal(o.expert) };
}
/** Two-level sanitize: a one-level spread over a partial blob would leave `undefined`
 * where the type promises `number | null`, and would alias nested INITIAL objects. */
function validModeBests(m: unknown): ModeBests {
  const o = (m && typeof m === 'object') ? m as Record<string, unknown> : {};
  const out = {} as ModeBests;
  for (const mode of NEW_MODES) out[mode] = bestRec(o[mode]);
  return out;
}

function validCampaign(c: unknown): CampaignProgress {
  const o = (c && typeof c === 'object') ? c as Record<string, unknown> : {};
  const rawStars = (o.stars && typeof o.stars === 'object') ? o.stars as Record<string, unknown> : {};
  const stars: Record<string, 0 | 1 | 2 | 3> = {};
  for (const [k, v] of Object.entries(rawStars)) {
    if (v === 0 || v === 1 || v === 2 || v === 3) stars[k] = v;
  }
  const cleared = Array.isArray(o.cleared) ? o.cleared.filter((x): x is string => typeof x === 'string') : [];
  return { stars, cleared };
}
function validEnergy(e: unknown): EnergyState {
  const o = (e && typeof e === 'object') ? e as Record<string, unknown> : {};
  const max = typeof o.max === 'number' && o.max > 0 ? Math.floor(o.max) : 5;
  const current = typeof o.current === 'number' && o.current >= 0 ? Math.min(Math.floor(o.current), max) : max;
  const lastRegenTs = typeof o.lastRegenTs === 'number' && o.lastRegenTs >= 0 ? o.lastRegenTs : 0;
  return { current, max, lastRegenTs };
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

export function mergeProgress(raw: unknown): ProgressState {
  const d = INITIAL_PROGRESS;
  if (!raw || typeof raw !== 'object') {
    return {
      version: 5,
      pearls: 0,
      stats: { ...d.stats, bestSeconds: { ...d.stats.bestSeconds }, winsByDifficulty: { ...d.stats.winsByDifficulty }, winsByMode: { ...d.stats.winsByMode }, modeBests: validModeBests(null) },
      unlocked: [],
      equipped: { ...DEFAULT_EQUIPPED },
      streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null },
      quests: { date: null, active: [], rerolls: 0 },
      achievements: { claimed: [] },
      processedPurchases: [],
      campaign: validCampaign(null),
      energy: validEnergy(null),
    };
  }
  const r = raw as { pearls?: unknown; stats?: Partial<ProgressStats>; unlocked?: unknown; equipped?: unknown; streak?: unknown; quests?: unknown; achievements?: unknown; processedPurchases?: unknown; campaign?: unknown; energy?: unknown };
  const s = r.stats ?? {};
  return {
    version: 5,
    pearls: num(r.pearls),
    stats: {
      gamesPlayed:  num(s.gamesPlayed),
      gamesWon:     num(s.gamesWon),
      pairsMatched: num(s.pairsMatched),
      bestSeconds:      { ...d.stats.bestSeconds,      ...(s.bestSeconds ?? {}) },
      winsByDifficulty: { ...d.stats.winsByDifficulty, ...(s.winsByDifficulty ?? {}) },
      winsByMode: { ...d.stats.winsByMode, ...(s.winsByMode ?? {}) },
      perfectWins:       num(s.perfectWins),
      fastWins:          num(s.fastWins),
      pearlsEarnedTotal: num(s.pearlsEarnedTotal),
      lastWinDate: typeof s.lastWinDate === 'string' ? s.lastWinDate : null,
      winsToday:   num(s.winsToday),
      xp:          num(s.xp),
      // Existing saves without seenLevel adopt their current level → no false popup.
      seenLevel:   typeof s.seenLevel === 'number' ? num(s.seenLevel) : levelFromXp(num(s.xp)).level,
      modeBests: validModeBests(s.modeBests),
      lastLossDate: typeof s.lastLossDate === 'string' ? s.lastLossDate : null,
      lossesToday: num(s.lossesToday),
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
    campaign: validCampaign(r.campaign),
    energy: validEnergy(r.energy),
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
export function buildAchSignals(stats: ProgressStats, streakBest: number, unlocked: string[]): AchSignals {
  const ownedByAxis: Record<CustomAxis, number> = { seaTheme: 0, cardBack: 0, uiPalette: 0 };
  for (const id of unlocked) {
    const item = ITEM_BY_ID[id];
    if (item) ownedByAxis[item.axis] += 1;
  }
  return {
    gamesWon: stats.gamesWon, pairsMatched: stats.pairsMatched, winsByDifficulty: stats.winsByDifficulty,
    perfectWins: stats.perfectWins, fastWins: stats.fastWins, pearlsEarnedTotal: stats.pearlsEarnedTotal,
    streakBest, unlockedCount: unlocked.length,
    gamesPlayed: stats.gamesPlayed, level: levelFromXp(stats.xp).level,
    winsByMode: stats.winsByMode, ownedByAxis,
  };
}

export function achSignals(): AchSignals {
  const p = progressStore.get();
  return buildAchSignals(p.stats, p.streak.best, p.unlocked);
}

export function awardPearls(amount: number): void { addPearls(amount); persist(); }

/** Mark the player's current level as acknowledged (called when the level-up modal closes). */
export function markLevelSeen(): void {
  const s = progressStore.get().stats;
  progressStore.set({ stats: { ...s, seenLevel: levelFromXp(s.xp).level } });
  persist();
}

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

/** Score a finished campaign level, record stars/clears, grant pearls/XP, and unlock the
 * chapter's biome skin once every level in the chapter is cleared. Replays only pay the
 * STAR DELTA (never re-pay firstClearPearls/xp) and never lower a previously-recorded star count. */
export function recordCampaignResult(id: string, result: LevelResult): {
  stars: number; pearls: number; xp: number; chapterCompleted: boolean; skinUnlocked: string | null;
} {
  const found = levelById(id);
  if (!found) return { stars: 0, pearls: 0, xp: 0, chapterCompleted: false, skinUnlocked: null };
  const { chapter, level } = found;
  const stars = computeStars(result, level.goals);
  if (stars === 0) return { stars: 0, pearls: 0, xp: 0, chapterCompleted: false, skinUnlocked: null };

  const c = progressStore.get();
  const prevStars = c.campaign.stars[id] ?? 0;
  const firstClear = !c.campaign.cleared.includes(id);
  const starDelta = Math.max(0, stars - prevStars);

  let pearls = starDelta * level.rewards.perStarPearls;
  let xp = 0;
  if (firstClear) { pearls += level.rewards.firstClearPearls; xp += level.rewards.xp; }

  const newStars = Math.max(prevStars, stars);
  const cleared = firstClear ? [...c.campaign.cleared, id] : c.campaign.cleared;
  progressStore.set({
    campaign: { stars: { ...c.campaign.stars, [id]: newStars as 0 | 1 | 2 | 3 }, cleared },
    pearls: c.pearls + pearls,
    stats: { ...c.stats, xp: c.stats.xp + xp, pearlsEarnedTotal: c.stats.pearlsEarnedTotal + pearls },
  });

  // Chapter completion → bonus pearls only. The biome skin is NOT granted here:
  // sea skins stay purchase-only (donate) so they can be equipped in every mode.
  let chapterCompleted = false;
  let bonusPearls = 0;
  // `firstClear` guard: the bonus fires once, on the clear that actually completes
  // the chapter — re-playing the last level afterwards can't farm it.
  if (firstClear && isChapterComplete(chapter.biome, progressStore.get().campaign)) {
    chapterCompleted = true;
    bonusPearls = 100;
    const cc = progressStore.get();
    progressStore.set({ pearls: cc.pearls + bonusPearls, stats: { ...cc.stats, pearlsEarnedTotal: cc.stats.pearlsEarnedTotal + bonusPearls } });
  }
  saveLocal(progressStore.get());
  saveCloud(progressStore.get());
  // Returned pearls must equal what was actually credited (result modal shows this).
  return { stars, pearls: pearls + bonusPearls, xp, chapterCompleted, skinUnlocked: null };
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

/** Win context from the CURRENT state — call BEFORE recordGameWin updates it.
 * isRecord/prevBest are scoped to (mode, difficulty): classic reads bestSeconds,
 * new modes read modeBests. */
export function winContext(difficulty: Difficulty, seconds: number, mode: GameMode = 'classic'): { isRecord: boolean; prevBest: number | null; winIndex: number; firstWinOfDay: boolean } {
  const s = progressStore.get().stats;
  const prevBest = mode === 'classic' ? s.bestSeconds[difficulty] : s.modeBests[mode][difficulty];
  const winsBefore = s.lastWinDate === todayStr() ? s.winsToday : 0;
  const winIndex = winsBefore + 1;
  return { isRecord: prevBest === null || seconds < prevBest, prevBest, winIndex, firstWinOfDay: winIndex === 1 };
}

export function recordGameWin(r: { difficulty: Difficulty; seconds: number; pairs: number; moves: number; mode?: GameMode }): { xpGained: number; leveledUp: boolean; newLevel: number } {
  const mode = r.mode ?? 'classic';
  const s = progressStore.get().stats;
  const prevBest = mode === 'classic' ? s.bestSeconds[r.difficulty] : s.modeBests[mode][r.difficulty];
  const newBest = prevBest === null ? r.seconds : Math.min(prevBest, r.seconds);
  // Forced-signal suppression mirrors computePearls (spec §7): quests/achievements
  // must not be trivialized by structurally-guaranteed fast/perfect wins.
  const perfect = mode === 'noMistakes' ? false : r.moves === r.pairs;
  const fast = (mode === 'timeAttack' || mode === 'noMistakes') ? false : r.seconds <= SPEED_PAR[r.difficulty];
  const today = todayStr();
  const sameDay = s.lastWinDate === today;
  const xpGained = Math.round(XP_PER_WIN[r.difficulty] * XP_MULT[mode][r.difficulty]);
  const newXp = s.xp + xpGained;
  const newLevel = levelFromXp(newXp).level;
  const levelsGained = newLevel - levelFromXp(s.xp).level;
  progressStore.set({
    stats: {
      ...s,
      gamesWon: s.gamesWon + 1,
      pairsMatched: s.pairsMatched + r.pairs,
      bestSeconds: mode === 'classic' ? { ...s.bestSeconds, [r.difficulty]: newBest } : s.bestSeconds,
      modeBests: mode === 'classic' ? s.modeBests
        : { ...s.modeBests, [mode]: { ...s.modeBests[mode], [r.difficulty]: newBest } },
      winsByDifficulty: { ...s.winsByDifficulty, [r.difficulty]: s.winsByDifficulty[r.difficulty] + 1 },
      winsByMode: { ...s.winsByMode, [mode]: s.winsByMode[mode] + 1 },
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

const CONSOLATION_RATE = 0.2;

/** Consolation for a lost game (timeAttack timeout / noMistakes mistake).
 * Linear in progress (instant dumps at progress 0 still pay 0, but a genuine
 * attempt that ended early isn't demoralised with a rounded-to-zero prize) with
 * its own daily anti-farm (lossesToday mirrors winsToday) so losing can never
 * out-earn winning. No quests, no records, no leaderboards, no first-win ×2. */
export function recordGameLoss(r: { mode: GameMode; difficulty: Difficulty; pairsFound: number; totalPairs: number }): { pearls: number; xp: number; leveledUp: boolean; newLevel: number } {
  const s = progressStore.get().stats;
  const today = todayStr();
  const lossIndex = (s.lastLossDate === today ? s.lossesToday : 0) + 1;
  const lossFarm = lossIndex <= 3 ? 1 : lossIndex <= 6 ? 0.5 : 0.25;
  const progress = r.totalPairs > 0 ? r.pairsFound / r.totalPairs : 0;
  const scale = CONSOLATION_RATE * progress * lossFarm;
  const pearls = Math.round(PEARL_BASE[r.difficulty] * PEARL_MULT[r.mode][r.difficulty] * scale);
  const xp = Math.round(XP_PER_WIN[r.difficulty] * XP_MULT[r.mode][r.difficulty] * scale);
  const newXp = s.xp + xp;
  const newLevel = levelFromXp(newXp).level;
  const levelsGained = newLevel - levelFromXp(s.xp).level;
  progressStore.set({ stats: { ...s, lastLossDate: today, lossesToday: lossIndex, xp: newXp } });
  if (pearls > 0) addPearls(pearls);
  if (levelsGained > 0) addPearls(LEVEL_UP_REWARD * levelsGained);
  persist();
  return { pearls, xp, leveledUp: levelsGained > 0, newLevel };
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
