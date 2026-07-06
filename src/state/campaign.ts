import type { Difficulty } from '../game/layout';
import type { GameMode } from '../game/modes';
import type { CampaignProgress } from './progress';

export type BiomeId = 'lagoon' | 'reef' | 'arctic' | 'volcano' | 'abyss';

export interface LevelGoals {
  maxMoves?: number;
  maxSeconds?: number;
  noMistakes?: boolean;
}
export interface LevelRewards { firstClearPearls: number; perStarPearls: number; xp: number }
export interface CampaignLevel {
  id: string;
  index: number;              // 1-based within chapter
  difficulty: Difficulty;
  mode: GameMode;
  goals: LevelGoals;
  rewards: LevelRewards;
}
export interface CampaignChapter {
  biome: BiomeId;
  skinId: string;             // catalog sea-skin id granted on chapter completion
  starsToUnlock: number;      // stars needed in the PREVIOUS chapter
  levels: CampaignLevel[];
  worldPosition: { x: number; y: number };        // % on world-map.png
  nodePositions: { x: number; y: number }[];      // % on the island art, len === levels.length
}

export interface LevelResult { won: boolean; seconds: number; moves: number; mistakes: number }

export const LEVELS_PER_CHAPTER = 12;

/** Difficulty ramps across the 12 levels of a chapter. */
const RAMP: Difficulty[] = [
  'easy', 'easy', 'easy', 'medium', 'medium', 'medium',
  'hard', 'hard', 'hard', 'expert', 'expert', 'expert',
];
/** Move/time budgets by difficulty for the ⭐2/⭐3 objectives (generous v1 defaults). */
const MOVE_BUDGET: Record<Difficulty, number> = { easy: 16, medium: 28, hard: 34, expert: 40 };
const TIME_BUDGET: Record<Difficulty, number> = { easy: 45, medium: 75, hard: 95, expert: 120 };

function buildLevels(biome: BiomeId): CampaignLevel[] {
  return RAMP.map((difficulty, i) => {
    const index = i + 1;
    return {
      id: `${biome}-${index}`,
      index,
      difficulty,
      mode: 'classic' as GameMode,
      goals: { maxMoves: MOVE_BUDGET[difficulty], maxSeconds: TIME_BUDGET[difficulty] },
      rewards: { firstClearPearls: 20 + i * 2, perStarPearls: 5, xp: 8 + i },
    };
  });
}

// Node positions are % coordinates laid out along each island (placeholder even spread;
// re-measure against the final art in Task 14). 12 nodes in a serpentine.
const NODES: { x: number; y: number }[] = Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => {
  const row = Math.floor(i / 4);
  const col = i % 4;
  const x = 20 + (row % 2 === 0 ? col : 3 - col) * 20;
  const y = 25 + row * 22;
  return { x, y };
});

// Difficulty/story order: лагуна → лава → риф → арктика → бездна.
// worldPosition = % coords of each island on world-map.png (reef top-left, volcano
// top-right, abyss centre, arctic bottom-left, lagoon bottom-right).
export const CHAPTERS: CampaignChapter[] = [
  { biome: 'lagoon',  skinId: 'sea.lagoon', starsToUnlock: 0,  levels: buildLevels('lagoon'),  worldPosition: { x: 77, y: 75 }, nodePositions: NODES },
  { biome: 'volcano', skinId: 'sea.lava',    starsToUnlock: 18, levels: buildLevels('volcano'), worldPosition: { x: 78, y: 18 }, nodePositions: NODES },
  { biome: 'reef',    skinId: 'sea.reef',    starsToUnlock: 21, levels: buildLevels('reef'),    worldPosition: { x: 22, y: 18 }, nodePositions: NODES },
  { biome: 'arctic',  skinId: 'sea.arctic',  starsToUnlock: 24, levels: buildLevels('arctic'),  worldPosition: { x: 23, y: 73 }, nodePositions: NODES },
  { biome: 'abyss',   skinId: 'sea.abyss',   starsToUnlock: 27, levels: buildLevels('abyss'),   worldPosition: { x: 50, y: 47 }, nodePositions: NODES },
];

/** Map a finished game to 0–3 stars: 1 for the win + 1 per met objective, capped at 3. */
export function computeStars(r: LevelResult, goals: LevelGoals): 0 | 1 | 2 | 3 {
  if (!r.won) return 0;
  let stars = 1;
  if (goals.maxMoves !== undefined && r.moves <= goals.maxMoves) stars++;
  if (goals.maxSeconds !== undefined && r.seconds <= goals.maxSeconds) stars++;
  if (goals.noMistakes && r.mistakes === 0) stars++;
  return Math.min(3, stars) as 0 | 1 | 2 | 3;
}

export function levelById(id: string): { chapter: CampaignChapter; level: CampaignLevel } | null {
  for (const chapter of CHAPTERS) {
    const level = chapter.levels.find((l) => l.id === id);
    if (level) return { chapter, level };
  }
  return null;
}

export function chapterStars(biome: BiomeId, cp: CampaignProgress): number {
  const ch = CHAPTERS.find((c) => c.biome === biome);
  if (!ch) return 0;
  return ch.levels.reduce((sum, l) => sum + (cp.stars[l.id] ?? 0), 0);
}

export function totalStars(cp: CampaignProgress): number {
  return CHAPTERS.reduce((sum, c) => sum + chapterStars(c.biome, cp), 0);
}

export function isChapterUnlocked(biome: BiomeId, cp: CampaignProgress): boolean {
  const idx = CHAPTERS.findIndex((c) => c.biome === biome);
  if (idx <= 0) return true; // chapter 1 always open
  const prev = CHAPTERS[idx - 1];
  return chapterStars(prev.biome, cp) >= CHAPTERS[idx].starsToUnlock;
}

export function isLevelUnlocked(id: string, cp: CampaignProgress): boolean {
  const found = levelById(id);
  if (!found) return false;
  const { chapter, level } = found;
  if (!isChapterUnlocked(chapter.biome, cp)) return false;
  if (level.index === 1) return true; // first level of an unlocked chapter
  const prev = chapter.levels[level.index - 2];
  return cp.cleared.includes(prev.id);
}

export function isChapterComplete(biome: BiomeId, cp: CampaignProgress): boolean {
  const ch = CHAPTERS.find((c) => c.biome === biome);
  if (!ch) return false;
  return ch.levels.every((l) => cp.cleared.includes(l.id));
}
