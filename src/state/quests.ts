import type { Difficulty } from '../game/layout';

export type QuestEvent =
  | { type: 'start' }
  | { type: 'win'; difficulty: Difficulty; pairs: number; perfect: boolean; fast: boolean };

export interface QuestDef { id: string; nameKey: string; target: number; reward: number; measure: (e: QuestEvent) => number; }

export const QUEST_POOL: QuestDef[] = [
  { id: 'winGames',      nameKey: 'qWinGames',      target: 3,  reward: 25, measure: (e) => (e.type === 'win' ? 1 : 0) },
  { id: 'matchPairs',    nameKey: 'qMatchPairs',    target: 20, reward: 20, measure: (e) => (e.type === 'win' ? e.pairs : 0) },
  { id: 'playGames',     nameKey: 'qPlayGames',     target: 5,  reward: 15, measure: (e) => (e.type === 'start' ? 1 : 0) },
  { id: 'winHard',       nameKey: 'qWinHard',       target: 1,  reward: 30, measure: (e) => (e.type === 'win' && (e.difficulty === 'hard' || e.difficulty === 'expert') ? 1 : 0) },
  { id: 'perfectWin',    nameKey: 'qPerfectWin',    target: 1,  reward: 30, measure: (e) => (e.type === 'win' && e.perfect ? 1 : 0) },
  { id: 'fastWin',       nameKey: 'qFastWin',       target: 1,  reward: 25, measure: (e) => (e.type === 'win' && e.fast ? 1 : 0) },
  { id: 'winMedium',     nameKey: 'qWinMedium',     target: 2,  reward: 20, measure: (e) => (e.type === 'win' && e.difficulty === 'medium' ? 1 : 0) },
  { id: 'matchPairsBig', nameKey: 'qMatchPairsBig', target: 40, reward: 35, measure: (e) => (e.type === 'win' ? e.pairs : 0) },
];
export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUEST_POOL.map((q) => [q.id, q]));

// Deterministic 32-bit string hash (FNV-1a-ish) — stable across reloads, no Math.random.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** 3 distinct quest ids for a date, deterministic (same for everyone, stable on reload). */
export function pickDailyQuests(date: string): string[] {
  const avail = QUEST_POOL.map((q) => q.id);
  let seed = hashStr(date) || 1;
  const picked: string[] = [];
  for (let k = 0; k < 3 && avail.length; k++) {
    seed = Math.imul(seed, 48271) >>> 0;
    picked.push(avail.splice(seed % avail.length, 1)[0]);
  }
  return picked;
}

/** A pool quest not currently active — for reroll; deterministic by (date, rerolls). null if none left. */
export function rerollQuestId(date: string, activeIds: string[], rerolls: number): string | null {
  const avail = QUEST_POOL.map((q) => q.id).filter((id) => !activeIds.includes(id));
  if (!avail.length) return null;
  const seed = (hashStr(date) ^ Math.imul(rerolls + 1, 2654435761)) >>> 0;
  return avail[seed % avail.length];
}
