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
  gamesPlayed: number;
  level: number;
}

export interface AchievementDef {
  id: string;
  nameKey: string;
  reward: number;
  target: number;                       // X/Y display + progress bar
  progress: (s: AchSignals) => number;  // current value toward target (clamped at display time)
  done: (s: AchSignals) => boolean;
}

const allDiffsWon = (s: AchSignals): number =>
  (s.winsByDifficulty.easy >= 1 ? 1 : 0) + (s.winsByDifficulty.medium >= 1 ? 1 : 0)
  + (s.winsByDifficulty.hard >= 1 ? 1 : 0) + (s.winsByDifficulty.expert >= 1 ? 1 : 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstWin',        nameKey: 'aFirstWin',        reward: 20,  target: 1,    progress: (s) => s.gamesWon,                done: (s) => s.gamesWon >= 1 },
  { id: 'win10',           nameKey: 'aWin10',           reward: 50,  target: 10,   progress: (s) => s.gamesWon,                done: (s) => s.gamesWon >= 10 },
  { id: 'win50',           nameKey: 'aWin50',           reward: 150, target: 50,   progress: (s) => s.gamesWon,                done: (s) => s.gamesWon >= 50 },
  { id: 'pairs100',        nameKey: 'aPairs100',        reward: 50,  target: 100,  progress: (s) => s.pairsMatched,            done: (s) => s.pairsMatched >= 100 },
  { id: 'pairs500',        nameKey: 'aPairs500',        reward: 150, target: 500,  progress: (s) => s.pairsMatched,            done: (s) => s.pairsMatched >= 500 },
  { id: 'expertWin',       nameKey: 'aExpertWin',       reward: 60,  target: 1,    progress: (s) => s.winsByDifficulty.expert, done: (s) => s.winsByDifficulty.expert >= 1 },
  { id: 'allDifficulties', nameKey: 'aAllDifficulties', reward: 80,  target: 4,    progress: allDiffsWon,                      done: (s) => s.winsByDifficulty.easy >= 1 && s.winsByDifficulty.medium >= 1 && s.winsByDifficulty.hard >= 1 && s.winsByDifficulty.expert >= 1 },
  { id: 'streak7',         nameKey: 'aStreak7',         reward: 100, target: 7,    progress: (s) => s.streakBest,              done: (s) => s.streakBest >= 7 },
  { id: 'collector',       nameKey: 'aCollector',       reward: 80,  target: 5,    progress: (s) => s.unlockedCount,           done: (s) => s.unlockedCount >= 5 },
  { id: 'rich',            nameKey: 'aRich',            reward: 100, target: 1000, progress: (s) => s.pearlsEarnedTotal,       done: (s) => s.pearlsEarnedTotal >= 1000 },
  { id: 'perfectionist',   nameKey: 'aPerfectionist',   reward: 80,  target: 10,   progress: (s) => s.perfectWins,             done: (s) => s.perfectWins >= 10 },
  { id: 'speedrunner',     nameKey: 'aSpeedrunner',     reward: 80,  target: 10,   progress: (s) => s.fastWins,                done: (s) => s.fastWins >= 10 },
  // B6.1 — more variety: deeper tiers + two new axes (games played, player level).
  { id: 'win25',           nameKey: 'aWin25',           reward: 100, target: 25,   progress: (s) => s.gamesWon,                done: (s) => s.gamesWon >= 25 },
  { id: 'play25',          nameKey: 'aPlay25',          reward: 60,  target: 25,   progress: (s) => s.gamesPlayed,             done: (s) => s.gamesPlayed >= 25 },
  { id: 'play100',         nameKey: 'aPlay100',         reward: 200, target: 100,  progress: (s) => s.gamesPlayed,             done: (s) => s.gamesPlayed >= 100 },
  { id: 'pairs1000',       nameKey: 'aPairs1000',       reward: 250, target: 1000, progress: (s) => s.pairsMatched,            done: (s) => s.pairsMatched >= 1000 },
  { id: 'hardMaster',      nameKey: 'aHardMaster',      reward: 120, target: 10,   progress: (s) => s.winsByDifficulty.hard,   done: (s) => s.winsByDifficulty.hard >= 10 },
  { id: 'expertMaster',    nameKey: 'aExpertMaster',    reward: 150, target: 10,   progress: (s) => s.winsByDifficulty.expert, done: (s) => s.winsByDifficulty.expert >= 10 },
  { id: 'streak30',        nameKey: 'aStreak30',        reward: 300, target: 30,   progress: (s) => s.streakBest,              done: (s) => s.streakBest >= 30 },
  { id: 'collector15',     nameKey: 'aCollector15',     reward: 200, target: 15,   progress: (s) => s.unlockedCount,           done: (s) => s.unlockedCount >= 15 },
  { id: 'level5',          nameKey: 'aLevel5',          reward: 100, target: 5,    progress: (s) => s.level,                   done: (s) => s.level >= 5 },
  { id: 'level10',         nameKey: 'aLevel10',         reward: 250, target: 10,   progress: (s) => s.level,                   done: (s) => s.level >= 10 },
];
export const ACH_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
