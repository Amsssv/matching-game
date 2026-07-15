import { getYSDK } from '../ysdk';
import type { Difficulty } from './layout';
import type { GameMode } from './modes';

// The 16 mode×difficulty boards are Yandex `time` leaderboards: the score is the raw
// completion time in MILLISECONDS, sorted ascending (less time = higher rank). We submit
// whole-second precision (seconds × 1000) and format M:SS ourselves on read.

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Board names are Yandex-console resources (manual prereq: every id below must exist
// as a leaderboard in the console before release, with matching config — see
// LEADERBOARDS.md). All 16 follow the `<mode><Difficulty>` pattern.
export const LB_ID: Record<GameMode, Record<Difficulty, string>> = {
  classic: {
    easy: 'classicEasy', medium: 'classicMedium', hard: 'classicHard', expert: 'classicExpert',
  },
  timeAttack: {
    easy: 'timeAttackEasy', medium: 'timeAttackMedium', hard: 'timeAttackHard', expert: 'timeAttackExpert',
  },
  survival: {
    easy: 'survivalEasy', medium: 'survivalMedium', hard: 'survivalHard', expert: 'survivalExpert',
  },
  noMistakes: {
    easy: 'noMistakesEasy', medium: 'noMistakesMedium', hard: 'noMistakesHard', expert: 'noMistakesExpert',
  },
};

// Standalone aggregate boards (not mode × difficulty). The metric is a raw
// "higher is better" number submitted as-is (no inversion). Console config:
// numeric, 0 decimals, sort descending. See LEADERBOARDS.md §2.
export const LB_TOTAL_SCORE = 'totalScore';       // cumulative player XP
export const LB_JOURNEY_STARS = 'journeyStars';   // total campaign stars

/**
 * Submit a raw score to a standalone "higher is better" board, overwriting only
 * when strictly better than the player's current entry. The metrics here are
 * monotonic, so this also skips redundant writes. Fire-and-forget: never throws,
 * never blocks; guests / missing SDK / network errors are ignored.
 * Non-positive scores are skipped so we don't clutter boards with empty entries.
 */
export function submitBestScore(boardId: string, score: number): void {
  if (!Number.isFinite(score) || score <= 0) return;
  const lb = getYSDK()?.leaderboards;
  if (!lb) return;
  lb.getPlayerEntry(boardId)
    .then(entry => { if (score > entry.score) return lb.setScore(boardId, score); })
    .catch(() => lb.setScore(boardId, score))
    .then(() => {}, () => {});
}

const MOCK_LEADERBOARD: Record<Difficulty, LeaderboardData> = {
  easy:   { rows: [
    { rank: 1, name: 'Морской Волк',   score: 28,  isPlayer: false },
    { rank: 2, name: 'Ты',             score: 35,  isPlayer: true  },
    { rank: 3, name: 'КальмарМастер',  score: 47,  isPlayer: false },
    { rank: 4, name: 'АкулаСпорта',    score: 61,  isPlayer: false },
    { rank: 5, name: 'РыбаПилот',      score: 80,  isPlayer: false },
  ], playerRank: 2 },
  medium: { rows: [
    { rank: 1, name: 'Морской Волк',   score: 55,  isPlayer: false },
    { rank: 2, name: 'КальмарМастер',  score: 72,  isPlayer: false },
    { rank: 3, name: 'АкулаСпорта',    score: 89,  isPlayer: false },
    { rank: 4, name: 'Ты',             score: 114, isPlayer: true  },
    { rank: 5, name: 'РыбаПилот',      score: 138, isPlayer: false },
  ], playerRank: 4 },
  hard:   { rows: [
    { rank:   1, name: 'Морской Волк',   score:  98, isPlayer: false },
    { rank:   2, name: 'КальмарМастер',  score: 135, isPlayer: false },
    { rank:   3, name: 'АкулаСпорта',   score: 172, isPlayer: false },
    { rank:   4, name: 'РыбаПилот',     score: 214, isPlayer: false },
    { rank:   5, name: 'ОсьминогПро',   score: 251, isPlayer: false },
    { rank:   6, name: 'КитКапитан',    score: 289, isPlayer: false },
    { rank:   7, name: 'МедузаСпид',    score: 312, isPlayer: false },
    { rank:   8, name: 'КрабМастер',    score: 341, isPlayer: false },
    { rank:   9, name: 'ЕжИголка',      score: 378, isPlayer: false },
    { rank:  10, name: 'ЗвездаМоря',    score: 405, isPlayer: false },
    { rank: 101, name: 'Ты',            score: 892, isPlayer: true  },
  ], playerRank: 101 },
  expert: { rows: [
    { rank:  1, name: 'Морской Волк',   score: 142, isPlayer: false },
    { rank:  2, name: 'КальмарМастер',  score: 198, isPlayer: false },
    { rank:  3, name: 'АкулаСпорта',   score: 251, isPlayer: false },
    { rank:  4, name: 'РыбаПилот',     score: 319, isPlayer: false },
    { rank:  5, name: 'ОсьминогПро',   score: 374, isPlayer: false },
    { rank:  6, name: 'КитКапитан',    score: 412, isPlayer: false },
    { rank:  7, name: 'МедузаСпид',    score: 453, isPlayer: false },
    { rank:  8, name: 'КрабМастер',    score: 498, isPlayer: false },
    { rank:  9, name: 'ЕжИголка',      score: 541, isPlayer: false },
    { rank: 10, name: 'Ты',            score: 587, isPlayer: true  },
  ], playerRank: 10 },
};

export interface LeaderboardRow {
  rank: number;
  name: string;
  score: number;   // completion time in seconds (converted from the board's millisecond score)
  isPlayer: boolean;
}

export interface LeaderboardData {
  rows: LeaderboardRow[];
  playerRank?: number;
}

export async function fetchLeaderboard(mode: GameMode, difficulty: Difficulty): Promise<LeaderboardData | null> {
  const sdk = getYSDK();
  if (!sdk) return (import.meta.env.DEV && import.meta.env.MODE !== 'test') ? MOCK_LEADERBOARD[difficulty] : null;
  const leaderboard = sdk.leaderboards;
  if (!leaderboard) return null;

  try {
    const player  = await sdk.getPlayer({ scopes: false });
    const isGuest = !player.isAuthorized();

    const [topResult, playerResult] = await Promise.allSettled([
      leaderboard.getEntries(LB_ID[mode][difficulty], { quantityTop: 10, includeUser: !isGuest }),
      isGuest ? Promise.reject('guest') : leaderboard.getPlayerEntry(LB_ID[mode][difficulty]),
    ]);

    if (topResult.status === 'rejected') return null;

    const rows: LeaderboardRow[] = topResult.value.entries.map(entry => ({
      rank:     entry.rank,
      name:     entry.player.publicName || '—',
      score:    Math.round(entry.score / 1000),
      isPlayer: false,
    }));

    if (playerResult.status === 'fulfilled') {
      const playerEntry = playerResult.value;
      const inTop = rows.find(r => r.rank === playerEntry.rank);
      if (inTop) {
        inTop.isPlayer = true;
      } else {
        rows.push({
          rank:     playerEntry.rank,
          name:     player.getName(),
          score:    Math.round(playerEntry.score / 1000),
          isPlayer: true,
        });
      }
      return { rows, playerRank: playerEntry.rank };
    }

    return { rows };
  } catch {
    return null;
  }
}