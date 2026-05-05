import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ysdkModule from '../../ysdk';

vi.mock('../../ysdk', () => ({ getYSDK: vi.fn() }));

// Import after mock so the module picks up the mock
const { fetchLeaderboard } = await import('../leaderboard');

const makeSDK = (overrides: object) => overrides as unknown as YandexGamesSDK;

describe('fetchLeaderboard', () => {
  beforeEach(() => {
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(null);
  });

  it('returns null when SDK is unavailable', async () => {
    expect(await fetchLeaderboard('medium')).toBeNull();
  });

  it('returns null when leaderboards API is missing', async () => {
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(
      makeSDK({ leaderboards: undefined })
    );
    expect(await fetchLeaderboard('medium')).toBeNull();
  });

  it('returns top entries and marks player row for authorized user', async () => {
    const entries: YandexLeaderboardEntry[] = [
      { rank: 1, score: 10, player: { publicName: 'Alpha', getAvatarSrc: () => '' }, formattedScore: '10' },
      { rank: 2, score: 15, player: { publicName: 'Beta',  getAvatarSrc: () => '' }, formattedScore: '15' },
    ];
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({
      getPlayer: async () => ({ isAuthorized: () => true, getName: () => 'Me' }),
      leaderboards: {
        getEntries: async () => ({ entries }),
        getPlayerEntry: async () => ({ rank: 2, score: 15, player: { publicName: 'Beta', getAvatarSrc: () => '' }, formattedScore: '15' }),
      },
    }));

    const result = await fetchLeaderboard('medium');
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(2);
    expect(result!.rows[1].isPlayer).toBe(true);
    expect(result!.playerRank).toBe(2);
  });

  it('appends player row when player is outside top entries', async () => {
    const entries: YandexLeaderboardEntry[] = [
      { rank: 1, score: 10, player: { publicName: 'Alpha', getAvatarSrc: () => '' }, formattedScore: '10' },
    ];
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({
      getPlayer: async () => ({ isAuthorized: () => true, getName: () => 'Me' }),
      leaderboards: {
                 getEntries: async () => ({ entries }),
        getPlayerEntry: async () => ({ rank: 7, score: 42, player: { publicName: 'Me', getAvatarSrc: () => '' }, formattedScore: '42' }),
      },
    }));

    const result = await fetchLeaderboard('medium');
    expect(result!.rows).toHaveLength(2);
    expect(result!.rows[1].rank).toBe(7);
    expect(result!.rows[1].isPlayer).toBe(true);
  });

  it('returns only top entries for guest (no player row)', async () => {
    const entries: YandexLeaderboardEntry[] = [
      { rank: 1, score: 10, player: { publicName: 'Alpha', getAvatarSrc: () => '' }, formattedScore: '10' },
    ];
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({
      getPlayer: async () => ({ isAuthorized: () => false, getName: () => '' }),
      leaderboards: {
        getEntries: async () => ({ entries }),
        getPlayerEntry: async () => { throw new Error('guest'); },
      },
    }));

    const result = await fetchLeaderboard('medium');
    expect(result!.rows).toHaveLength(1);
    expect(result!.playerRank).toBeUndefined();
    expect(result!.rows[0].isPlayer).toBe(false);
  });

  it('returns null when leaderboard network fetch fails', async () => {
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({
      getPlayer: async () => ({ isAuthorized: () => true, getName: () => 'Me' }),
      leaderboards: {
        getEntries: async () => { throw new Error('network'); },
        getPlayerEntry: async () => { throw new Error(); },
      },
    }));

    expect(await fetchLeaderboard('medium')).toBeNull();
  });
});