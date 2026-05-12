import { getYSDK } from '../ysdk';
import type { Difficulty } from './layout';

// Stored in Yandex as (SCORE_BASE - moves) so fewer moves = higher rank.
// Convert back to moves for display: moves = SCORE_BASE - yandexScore.
export const SCORE_BASE = 9999;

export const LB_ID: Record<Difficulty, string> = {
  easy:   'matching_easy',
  medium: 'matching_medium',
  hard:   'matching_hard',
  expert: 'matching_expert',
};

const MOCK_LEADERBOARD: Record<Difficulty, LeaderboardData> = {
  easy:   { rows: [
    { rank: 1, name: 'Морской Волк',   score: 6,  isPlayer: false },
    { rank: 2, name: 'Ты',             score: 8,  isPlayer: true  },
    { rank: 3, name: 'КальмарМастер',  score: 10, isPlayer: false },
    { rank: 4, name: 'АкулаСпорта',    score: 14, isPlayer: false },
    { rank: 5, name: 'РыбаПилот',      score: 17, isPlayer: false },
  ], playerRank: 2 },
  medium: { rows: [
    { rank: 1, name: 'Морской Волк',   score: 12, isPlayer: false },
    { rank: 2, name: 'КальмарМастер',  score: 15, isPlayer: false },
    { rank: 3, name: 'АкулаСпорта',    score: 18, isPlayer: false },
    { rank: 4, name: 'Ты',             score: 22, isPlayer: true  },
    { rank: 5, name: 'РыбаПилот',      score: 28, isPlayer: false },
  ], playerRank: 4 },
  hard:   { rows: [
    { rank: 1, name: 'Морской Волк',   score: 14, isPlayer: false },
    { rank: 2, name: 'КальмарМастер',  score: 20, isPlayer: false },
    { rank: 3, name: 'АкулаСпорта',    score: 25, isPlayer: false },
    { rank: 4, name: 'РыбаПилот',      score: 31, isPlayer: false },
    { rank: 7, name: 'Ты',             score: 44, isPlayer: true  },
  ], playerRank: 7 },
  expert: { rows: [
    { rank: 1, name: 'Морской Волк',   score: 16, isPlayer: false },
    { rank: 2, name: 'КальмарМастер',  score: 24, isPlayer: false },
    { rank: 3, name: 'АкулаСпорта',    score: 30, isPlayer: false },
    { rank: 4, name: 'РыбаПилот',      score: 38, isPlayer: false },
    { rank: 5, name: 'Ты',             score: 42, isPlayer: true  },
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