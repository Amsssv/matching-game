import { getYSDK } from '../ysdk';
import type { Difficulty } from './layout';

// Stored in Yandex as (SCORE_BASE - moves) so fewer moves = higher rank.
// Convert back to moves for display: moves = SCORE_BASE - yandexScore.
export const SCORE_BASE = 9999;

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
  const lb  = sdk?.leaderboards;
  if (!sdk || !lb) return null;

  try {
    const player  = await sdk.getPlayer({ scopes: false });
    const isGuest = player.getMode() === 'lite';

    const [topResult, playerResult] = await Promise.allSettled([
      lb.getLeaderboardEntries(difficulty, { quantityTop: 5, includeUser: !isGuest }),
      isGuest ? Promise.reject('guest') : lb.getLeaderboardPlayerEntry(difficulty),
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