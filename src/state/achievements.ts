import type { Difficulty } from '../game/layout';
import type { GameMode } from '../game/modes';
import { CATALOG, type CustomAxis } from './catalog';

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
  winsByMode: Record<GameMode, number>;
  ownedByAxis: Record<CustomAxis, number>;
  // Journey (campaign) progress.
  campaignStars: number;             // total stars earned across all chapters (max 180)
  campaignLevelsCleared: number;     // number of campaign levels cleared (max 60)
  campaignChaptersComplete: number;  // fully-cleared chapters (max 5)
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

const MODES: GameMode[] = ['classic', 'timeAttack', 'survival', 'noMistakes'];
const modesWon = (s: AchSignals): number => MODES.filter((m) => s.winsByMode[m] >= 1).length;
const ownTotal = (axis: CustomAxis): number =>
  CATALOG.filter((i) => i.axis === axis && i.price > 0).length;
const SEA_TOTAL = ownTotal('seaTheme');
const BACKS_TOTAL = ownTotal('cardBack');
const PALETTES_TOTAL = ownTotal('uiPalette');

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstWin',        nameKey: 'aFirstWin',        reward: 10,  target: 1,    progress: (s) => s.gamesWon,                done: (s) => s.gamesWon >= 1 },
  { id: 'win10',           nameKey: 'aWin10',           reward: 25,  target: 10,   progress: (s) => s.gamesWon,                done: (s) => s.gamesWon >= 10 },
  { id: 'win50',           nameKey: 'aWin50',           reward: 75, target: 50,   progress: (s) => s.gamesWon,                done: (s) => s.gamesWon >= 50 },
  { id: 'pairs100',        nameKey: 'aPairs100',        reward: 25,  target: 100,  progress: (s) => s.pairsMatched,            done: (s) => s.pairsMatched >= 100 },
  { id: 'pairs500',        nameKey: 'aPairs500',        reward: 75, target: 500,  progress: (s) => s.pairsMatched,            done: (s) => s.pairsMatched >= 500 },
  { id: 'expertWin',       nameKey: 'aExpertWin',       reward: 30,  target: 1,    progress: (s) => s.winsByDifficulty.expert, done: (s) => s.winsByDifficulty.expert >= 1 },
  { id: 'allDifficulties', nameKey: 'aAllDifficulties', reward: 40,  target: 4,    progress: allDiffsWon,                      done: (s) => s.winsByDifficulty.easy >= 1 && s.winsByDifficulty.medium >= 1 && s.winsByDifficulty.hard >= 1 && s.winsByDifficulty.expert >= 1 },
  { id: 'streak7',         nameKey: 'aStreak7',         reward: 50, target: 7,    progress: (s) => s.streakBest,              done: (s) => s.streakBest >= 7 },
  { id: 'collector',       nameKey: 'aCollector',       reward: 40,  target: 5,    progress: (s) => s.unlockedCount,           done: (s) => s.unlockedCount >= 5 },
  { id: 'rich',            nameKey: 'aRich',            reward: 50, target: 1000, progress: (s) => s.pearlsEarnedTotal,       done: (s) => s.pearlsEarnedTotal >= 1000 },
  { id: 'perfectionist',   nameKey: 'aPerfectionist',   reward: 40,  target: 10,   progress: (s) => s.perfectWins,             done: (s) => s.perfectWins >= 10 },
  { id: 'speedrunner',     nameKey: 'aSpeedrunner',     reward: 40,  target: 10,   progress: (s) => s.fastWins,                done: (s) => s.fastWins >= 10 },
  // B6.1 — more variety: deeper tiers + two new axes (games played, player level).
  { id: 'win25',           nameKey: 'aWin25',           reward: 50, target: 25,   progress: (s) => s.gamesWon,                done: (s) => s.gamesWon >= 25 },
  { id: 'play25',          nameKey: 'aPlay25',          reward: 30,  target: 25,   progress: (s) => s.gamesPlayed,             done: (s) => s.gamesPlayed >= 25 },
  { id: 'play100',         nameKey: 'aPlay100',         reward: 100, target: 100,  progress: (s) => s.gamesPlayed,             done: (s) => s.gamesPlayed >= 100 },
  { id: 'pairs1000',       nameKey: 'aPairs1000',       reward: 125, target: 1000, progress: (s) => s.pairsMatched,            done: (s) => s.pairsMatched >= 1000 },
  { id: 'hardMaster',      nameKey: 'aHardMaster',      reward: 60, target: 10,   progress: (s) => s.winsByDifficulty.hard,   done: (s) => s.winsByDifficulty.hard >= 10 },
  { id: 'expertMaster',    nameKey: 'aExpertMaster',    reward: 75, target: 10,   progress: (s) => s.winsByDifficulty.expert, done: (s) => s.winsByDifficulty.expert >= 10 },
  { id: 'streak30',        nameKey: 'aStreak30',        reward: 150, target: 30,   progress: (s) => s.streakBest,              done: (s) => s.streakBest >= 30 },
  { id: 'collector15',     nameKey: 'aCollector15',     reward: 100, target: 15,   progress: (s) => s.unlockedCount,           done: (s) => s.unlockedCount >= 15 },
  { id: 'level5',          nameKey: 'aLevel5',          reward: 50, target: 5,    progress: (s) => s.level,                   done: (s) => s.level >= 5 },
  { id: 'level10',         nameKey: 'aLevel10',         reward: 125, target: 10,   progress: (s) => s.level,                   done: (s) => s.level >= 10 },
  // Modes (winsByMode)
  { id: 'taWin',       nameKey: 'aTaWin',       reward: 20,  target: 1,  progress: (s) => s.winsByMode.timeAttack, done: (s) => s.winsByMode.timeAttack >= 1 },
  { id: 'taWin10',     nameKey: 'aTaWin10',     reward: 60, target: 10, progress: (s) => s.winsByMode.timeAttack, done: (s) => s.winsByMode.timeAttack >= 10 },
  { id: 'survWin',     nameKey: 'aSurvWin',     reward: 20,  target: 1,  progress: (s) => s.winsByMode.survival,   done: (s) => s.winsByMode.survival >= 1 },
  { id: 'survWin10',   nameKey: 'aSurvWin10',   reward: 60, target: 10, progress: (s) => s.winsByMode.survival,   done: (s) => s.winsByMode.survival >= 10 },
  { id: 'nmWin',       nameKey: 'aNmWin',       reward: 20,  target: 1,  progress: (s) => s.winsByMode.noMistakes, done: (s) => s.winsByMode.noMistakes >= 1 },
  { id: 'nmWin10',     nameKey: 'aNmWin10',     reward: 60, target: 10, progress: (s) => s.winsByMode.noMistakes, done: (s) => s.winsByMode.noMistakes >= 10 },
  { id: 'allModes',    nameKey: 'aAllModes',    reward: 75, target: 4,  progress: modesWon,                       done: (s) => modesWon(s) >= 4 },
  // Deeper tiers (existing axes)
  { id: 'win100',      nameKey: 'aWin100',      reward: 200, target: 100,  progress: (s) => s.gamesWon,           done: (s) => s.gamesWon >= 100 },
  { id: 'play250',     nameKey: 'aPlay250',     reward: 200, target: 250,  progress: (s) => s.gamesPlayed,        done: (s) => s.gamesPlayed >= 250 },
  { id: 'pairs2500',   nameKey: 'aPairs2500',   reward: 250, target: 2500, progress: (s) => s.pairsMatched,       done: (s) => s.pairsMatched >= 2500 },
  { id: 'perfect25',   nameKey: 'aPerfect25',   reward: 75, target: 25,   progress: (s) => s.perfectWins,        done: (s) => s.perfectWins >= 25 },
  { id: 'fast25',      nameKey: 'aFast25',      reward: 75, target: 25,   progress: (s) => s.fastWins,           done: (s) => s.fastWins >= 25 },
  { id: 'streak14',    nameKey: 'aStreak14',    reward: 100, target: 14,   progress: (s) => s.streakBest,         done: (s) => s.streakBest >= 14 },
  { id: 'rich5000',    nameKey: 'aRich5000',    reward: 200, target: 5000, progress: (s) => s.pearlsEarnedTotal,  done: (s) => s.pearlsEarnedTotal >= 5000 },
  // Journey / campaign (5 chapters × 12 levels = 60 levels, max 180 stars)
  { id: 'campFirst',       nameKey: 'aCampFirst',       reward: 20,  target: 1,   progress: (s) => s.campaignLevelsCleared,    done: (s) => s.campaignLevelsCleared >= 1 },
  { id: 'campChapter',     nameKey: 'aCampChapter',     reward: 50, target: 1,   progress: (s) => s.campaignChaptersComplete, done: (s) => s.campaignChaptersComplete >= 1 },
  { id: 'campLevels30',    nameKey: 'aCampLevels30',    reward: 100, target: 30,  progress: (s) => s.campaignLevelsCleared,    done: (s) => s.campaignLevelsCleared >= 30 },
  { id: 'campStars50',     nameKey: 'aCampStars50',     reward: 100, target: 50,  progress: (s) => s.campaignStars,            done: (s) => s.campaignStars >= 50 },
  { id: 'campStars120',    nameKey: 'aCampStars120',    reward: 200, target: 120, progress: (s) => s.campaignStars,            done: (s) => s.campaignStars >= 120 },
  { id: 'campAllChapters', nameKey: 'aCampAllChapters', reward: 300, target: 5,   progress: (s) => s.campaignChaptersComplete, done: (s) => s.campaignChaptersComplete >= 5 },
  // Collection completion (targets from CATALOG)
  { id: 'seaAll',      nameKey: 'aSeaAll',      reward: 150, target: SEA_TOTAL,      progress: (s) => s.ownedByAxis.seaTheme,  done: (s) => s.ownedByAxis.seaTheme >= SEA_TOTAL },
  { id: 'backsAll',    nameKey: 'aBacksAll',    reward: 150, target: BACKS_TOTAL,    progress: (s) => s.ownedByAxis.cardBack,  done: (s) => s.ownedByAxis.cardBack >= BACKS_TOTAL },
  { id: 'palettesAll', nameKey: 'aPalettesAll', reward: 175, target: PALETTES_TOTAL, progress: (s) => s.ownedByAxis.uiPalette, done: (s) => s.ownedByAxis.uiPalette >= PALETTES_TOTAL },
];
export const ACH_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
