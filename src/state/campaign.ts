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
  pairs: number;              // board size for THIS level (2..14) — the campaign difficulty axis
  difficulty: Difficulty;     // label derived from `pairs`; used for preview time / modes / win stats
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
  worldPosition: { x: number; y: number };        // island center, % of the desktop map (journey_bg)
  mobilePosition: { x: number; y: number };        // island center, % of the mobile map (journey_bg_mobile)
}

export interface LevelResult { won: boolean; seconds: number; moves: number; mistakes: number }

export const LEVELS_PER_CHAPTER = 12;

/**
 * (A) Pair-count curve — the campaign difficulty axis is the number of pairs N (2..14)
 * on each level's board. Escalation-with-breather: each area starts a touch easier than
 * the previous area's peak, then climbs higher; peak (14) only at the very end.
 */
const PAIR_CURVE: Record<BiomeId, readonly number[]> = {
  lagoon:  [2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6],
  volcano: [4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8],
  reef:    [6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 10, 10],
  arctic:  [8, 8, 9, 9, 9, 10, 10, 11, 11, 11, 12, 12],
  abyss:   [10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14],
};

/** (B) Star-goal tightness by location — later areas grant proportionally less time/moves.
 * Combined with the per-level term (−0.005·i) so the SAME board N is harder deeper in the journey. */
const LOC_BASE: Record<BiomeId, number> = {
  lagoon: 1.00, volcano: 0.93, reef: 0.86, arctic: 0.79, abyss: 0.72,
};

/** (C) The final area mixes game modes into a "boss" gauntlet; all other areas are classic. */
const ABYSS_MODES: GameMode[] = [
  'classic', 'timeAttack', 'classic', 'survival', 'timeAttack', 'noMistakes',
  'survival', 'timeAttack', 'noMistakes', 'survival', 'timeAttack', 'noMistakes',
];

/** Map a level's pair count to a difficulty label (for preview time, modes, win stats). */
export function difficultyForPairs(pairs: number): Difficulty {
  if (pairs <= 6) return 'easy';
  if (pairs <= 9) return 'medium';
  if (pairs <= 12) return 'hard';
  return 'expert';
}

function buildLevels(biome: BiomeId): CampaignLevel[] {
  const curve = PAIR_CURVE[biome];
  const modes = biome === 'abyss' ? ABYSS_MODES : null;
  return curve.map((pairs, i) => {
    const index = i + 1;
    // Goals scale with board size (N) and tighten by location + level index:
    //   base moves = 3N−2, base seconds = 7.5N;  t = LOC_BASE[biome] − 0.005·i.
    // ⭐2 stays achievable (moves ≥ N+2); ⭐3 floored at 4N.
    const t = LOC_BASE[biome] - 0.005 * i;
    const maxMoves = Math.max(pairs + 2, Math.round((3 * pairs - 2) * t));
    const maxSeconds = Math.max(Math.round(4 * pairs), Math.round(7.5 * pairs * t));
    return {
      id: `${biome}-${index}`,
      index,
      pairs,
      difficulty: difficultyForPairs(pairs),
      mode: (modes ? modes[i] : 'classic') as GameMode,
      goals: { maxMoves, maxSeconds },
      rewards: { firstClearPearls: 20 + i * 2, perStarPearls: 5, xp: 8 + i },
    };
  });
}

// Difficulty/story order: лагуна → лава → риф → арктика → бездна.
// Desktop layout (worldPosition): lagoon top-left, volcano top-right, abyss centre,
// arctic bottom-left, reef bottom-right. Mobile: stacked top→bottom in story order.
export const CHAPTERS: CampaignChapter[] = [
  { biome: 'lagoon',  seaSkin: 'sea.lagoon', starsToUnlock: 0,  levels: buildLevels('lagoon'),  worldPosition: { x: 23, y: 28 }, mobilePosition: { x: 50, y: 11 } },
  { biome: 'volcano', seaSkin: 'sea.lava',   starsToUnlock: 18, levels: buildLevels('volcano'), worldPosition: { x: 79, y: 24 }, mobilePosition: { x: 50, y: 30.5 } },
  { biome: 'reef',    seaSkin: 'sea.reef',   starsToUnlock: 21, levels: buildLevels('reef'),    worldPosition: { x: 78, y: 76 }, mobilePosition: { x: 50, y: 50 } },
  { biome: 'arctic',  seaSkin: 'sea.arctic', starsToUnlock: 24, levels: buildLevels('arctic'),  worldPosition: { x: 21, y: 73 }, mobilePosition: { x: 50, y: 68 } },
  { biome: 'abyss',   seaSkin: 'sea.abyss',  starsToUnlock: 27, levels: buildLevels('abyss'),   worldPosition: { x: 51, y: 52 }, mobilePosition: { x: 50, y: 88.5 } },
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
