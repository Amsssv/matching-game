import { getYSDK } from '../ysdk';
import type { Difficulty } from './layout';

// Stored in Yandex as (SCORE_BASE - seconds) so less time = higher rank.
// Convert back to seconds for display: seconds = SCORE_BASE - yandexScore.
export const SCORE_BASE = 9999;

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const LB_ID: Record<Difficulty, string> = {
  easy:   'matchingEasy',
  medium: 'matchingMedium',
  hard:   'matchingHard',
  expert: 'matchingExpert',
};

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
  score: number;   // moves count (already converted from inverted Yandex score)
  isPlayer: boolean;
}

export interface LeaderboardData {
  rows: LeaderboardRow[];
  playerRank?: number;
}

export async function fetchLeaderboard(difficulty: Difficulty): Promise<LeaderboardData | null> {
  const sdk = getYSDK();
  if (!sdk) return (import.meta.env.DEV && import.meta.env.MODE !== 'test') ? MOCK_LEADERBOARD[difficulty] : null;
  const leaderboard = sdk.leaderboards;
  if (!leaderboard) return null;

  try {
    const player  = await sdk.getPlayer({ scopes: false });
    const isGuest = !player.isAuthorized();

    const [topResult, playerResult] = await Promise.allSettled([
      leaderboard.getEntries(LB_ID[difficulty], { quantityTop: 10, includeUser: !isGuest }),
      isGuest ? Promise.reject('guest') : leaderboard.getPlayerEntry(LB_ID[difficulty]),
    ]);

    if (topResult.status === 'rejected') return null;

    const rows: LeaderboardRow[] = topResult.value.entries.map(entry => ({
      rank:     entry.rank,
      name:     entry.player.publicName || '—',
      score:    Math.max(0, SCORE_BASE - entry.score),
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
          score:    Math.max(0, SCORE_BASE - playerEntry.score),
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