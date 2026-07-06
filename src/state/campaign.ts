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
  seaSkin: string;            // biome sea-skin id — used as the journey background for this
                              // biome (NOT granted; sea skins stay purchase-only)
  starsToUnlock: number;      // stars needed in the PREVIOUS chapter to unlock this one
  levels: CampaignLevel[];
  worldPosition: { x: number; y: number };        // % of the island on world-map.webp
}

export interface LevelResult { won: boolean; seconds: number; moves: number; mistakes: number }

export const LEVELS_PER_CHAPTER = 12;

/**
 * (A) Per-area difficulty ramps — each area escalates over the previous one.
 * Lagoon is the gentlest (caps at `hard`, no `expert`); Abyss is the hardest
 * (starts at `medium`, mostly `expert`). Every ramp is LEVELS_PER_CHAPTER long.
 */
const AREA_RAMP: Record<BiomeId, Difficulty[]> = {
  lagoon:  ['easy', 'easy', 'easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard'],
  volcano: ['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard', 'expert'],
  reef:    ['easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard', 'expert', 'expert'],
  arctic:  ['easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard', 'hard', 'expert', 'expert', 'expert'],
  abyss:   ['medium', 'medium', 'hard', 'hard', 'hard', 'hard', 'hard', 'expert', 'expert', 'expert', 'expert', 'expert'],
};

/** (B) Per-area star-goal tightness — later areas grant proportionally less time/moves. */
const AREA_TIGHTNESS: Record<BiomeId, number> = {
  lagoon: 1, volcano: 0.94, reef: 0.90, arctic: 0.85, abyss: 0.80,
};

/** (C) The final area mixes game modes into a "boss" gauntlet; all other areas are classic. */
const ABYSS_MODES: GameMode[] = [
  'classic', 'timeAttack', 'classic', 'survival', 'timeAttack', 'noMistakes',
  'survival', 'timeAttack', 'noMistakes', 'survival', 'timeAttack', 'noMistakes',
];

/** Move/time budgets by difficulty — the board-size baseline for the ⭐2/⭐3 objectives. */
const MOVE_BUDGET: Record<Difficulty, number> = { easy: 16, medium: 28, hard: 34, expert: 40 };
const TIME_BUDGET: Record<Difficulty, number> = { easy: 45, medium: 75, hard: 95, expert: 120 };

function buildLevels(biome: BiomeId): CampaignLevel[] {
  const ramp = AREA_RAMP[biome];
  const tight = AREA_TIGHTNESS[biome];
  const modes = biome === 'abyss' ? ABYSS_MODES : null;
  return ramp.map((difficulty, i) => {
    const index = i + 1;
    // Per-level progression: each level is a touch tighter than the previous one
    // (−1 move, −2 s) on top of the difficulty baseline × area tightness — so the
    // goals ramp level-by-level, not in flat tier blocks (levels 1..12 all differ).
    const maxMoves = Math.max(6, Math.round(MOVE_BUDGET[difficulty] * tight) - i);
    const maxSeconds = Math.max(20, Math.round(TIME_BUDGET[difficulty] * tight) - i * 2);
    return {
      id: `${biome}-${index}`,
      index,
      difficulty,
      mode: (modes ? modes[i] : 'classic') as GameMode,
      goals: { maxMoves, maxSeconds },
      rewards: { firstClearPearls: 20 + i * 2, perStarPearls: 5, xp: 8 + i },
    };
  });
}

// Difficulty/story order: лагуна → лава → риф → арктика → бездна.
// worldPosition = % coords of each island on world-map.webp (reef top-left, volcano
// top-right, abyss centre, arctic bottom-left, lagoon bottom-right).
export const CHAPTERS: CampaignChapter[] = [
  { biome: 'lagoon',  seaSkin: 'sea.lagoon', starsToUnlock: 0,  levels: buildLevels('lagoon'),  worldPosition: { x: 77, y: 75 } },
  { biome: 'volcano', seaSkin: 'sea.lava',   starsToUnlock: 18, levels: buildLevels('volcano'), worldPosition: { x: 78, y: 18 } },
  { biome: 'reef',    seaSkin: 'sea.reef',   starsToUnlock: 21, levels: buildLevels('reef'),    worldPosition: { x: 22, y: 18 } },
  { biome: 'arctic',  seaSkin: 'sea.arctic', starsToUnlock: 24, levels: buildLevels('arctic'),  worldPosition: { x: 23, y: 73 } },
  { biome: 'abyss',   seaSkin: 'sea.abyss',  starsToUnlock: 27, levels: buildLevels('abyss'),   worldPosition: { x: 50, y: 47 } },
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
