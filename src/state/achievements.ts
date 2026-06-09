import type { Difficulty } from '../game/layout';

/** The derived signals an achievement condition can read. */
export interface AchSignals {
  gamesWon: number;
  pairsMatched: number;
  winsByDifficulty: Record<Difficulty, number>;
  perfectWins: number;
  fastWins: number;
  pearlsEarnedTotal: number;
  streakBest: number;
  unlockedCount: number;
}

export interface AchievementDef { id: string; nameKey: string; reward: number; done: (s: AchSignals) => boolean; }

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstWin',        nameKey: 'aFirstWin',        reward: 20,  done: (s) => s.gamesWon >= 1 },
  { id: 'win10',           nameKey: 'aWin10',           reward: 50,  done: (s) => s.gamesWon >= 10 },
  { id: 'win50',           nameKey: 'aWin50',           reward: 150, done: (s) => s.gamesWon >= 50 },
  { id: 'pairs100',        nameKey: 'aPairs100',        reward: 50,  done: (s) => s.pairsMatched >= 100 },
  { id: 'pairs500',        nameKey: 'aPairs500',        reward: 150, done: (s) => s.pairsMatched >= 500 },
  { id: 'expertWin',       nameKey: 'aExpertWin',       reward: 60,  done: (s) => s.winsByDifficulty.expert >= 1 },
  { id: 'allDifficulties', nameKey: 'aAllDifficulties', reward: 80,  done: (s) => s.winsByDifficulty.easy >= 1 && s.winsByDifficulty.medium >= 1 && s.winsByDifficulty.hard >= 1 && s.winsByDifficulty.expert >= 1 },
  { id: 'streak7',         nameKey: 'aStreak7',         reward: 100, done: (s) => s.streakBest >= 7 },
  { id: 'collector',       nameKey: 'aCollector',       reward: 80,  done: (s) => s.unlockedCount >= 5 },
  { id: 'rich',            nameKey: 'aRich',            reward: 100, done: (s) => s.pearlsEarnedTotal >= 1000 },
  { id: 'perfectionist',   nameKey: 'aPerfectionist',   reward: 80,  done: (s) => s.perfectWins >= 10 },
  { id: 'speedrunner',     nameKey: 'aSpeedrunner',     reward: 80,  done: (s) => s.fastWins >= 10 },
];
export const ACH_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
