import { getYSDK } from '../ysdk';
import type { Difficulty } from './layout';

// Stored in Yandex as (SCORE_BASE - seconds) so less time = higher rank.
// Convert back to seconds for display: seconds = SCORE_BASE - yandexScore.
export const SCORE_BASE = 9999;

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
    { rank: 1, name: 'Морской Волк',   score: 98,  isPlayer: false },
    { rank: 2, name: 'КальмарМастер',  score: 135, isPlayer: false },
    { rank: 3, name: 'АкулаСпорта',    score: 172, isPlayer: false },
    { rank: 4, name: 'РыбаПилот',      score: 214, isPlayer: false },
    { rank: 7, name: 'Ты',             score: 287, isPlayer: true  },
  ], playerRank: 7 },
  expert: { rows: [
    { rank: 1, name: 'Морской Волк',   score: 142, isPlayer: false },
    { rank: 2, name: 'КальмарМастер',  score: 198, isPlayer: false },
    { rank: 3, name: 'АкулаСпорта',    score: 251, isPlayer: false },
    { rank: 4, name: 'РыбаПилот',      score: 319, isPlayer: false },
    { rank: 5, name: 'Ты',             score: 374, isPlayer: true  },
  ], playerRank: 5 },
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
  const lb = sdk.leaderboards;
  if (!lb) return null;

  try {
    const player  = await sdk.getPlayer({ scopes: false });
    const isGuest = !player.isAuthorized();

    const [topResult, playerResult] = await Promise.allSettled([
      lb.getEntries(LB_ID[difficulty], { quantityTop: 5, includeUser: !isGuest }),
      isGuest ? Promise.reject('guest') : lb.getPlayerEntry(LB_ID[difficulty]),
    ]);

    if (topResult.status === 'rejected') return null;

    const rows: LeaderboardRow[] = topResult.value.entries.map(e => ({
      rank:     e.rank,
      name:     e.player.publicName || '—',
      score:    Math.max(0, SCORE_BASE - e.score),
      isPlayer: false,
    }));

    if (playerResult.status === 'fulfilled') {
      const pe    = playerResult.value;
      const inTop = rows.find(r => r.rank === pe.rank);
      if (inTop) {
        inTop.isPlayer = true;
      } else {
        rows.push({
          rank:     pe.rank,
          name:     player.getName(),
          score:    Math.max(0, SCORE_BASE - pe.score),
          isPlayer: true,
        });
      }
      return { rows, playerRank: pe.rank };
    }

    return { rows };
  } catch {
    return null;
  }
}