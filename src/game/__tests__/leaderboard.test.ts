import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ysdkModule from '../../ysdk';

vi.mock('../../ysdk', () => ({ getYSDK: vi.fn() }));

// Import after mock so the module picks up the mock
const { fetchLeaderboard, LB_ID, submitBestScore, LB_TOTAL_SCORE, LB_JOURNEY_STARS } = await import('../leaderboard');

// Pins the Yandex board names per (mode, difficulty). These map to boards created
// by hand in the Yandex console; a typo here silently orphans a real board and the
// score submit no-ops. All 16 follow the `<mode><Difficulty>` pattern.
describe('LB_ID board names', () => {
  it('maps every mode × difficulty to the exact console board id', () => {
    expect(LB_ID).toEqual({
      classic:    { easy: 'classicEasy',    medium: 'classicMedium',    hard: 'classicHard',    expert: 'classicExpert' },
      timeAttack: { easy: 'timeAttackEasy', medium: 'timeAttackMedium', hard: 'timeAttackHard', expert: 'timeAttackExpert' },
      survival:   { easy: 'survivalEasy',   medium: 'survivalMedium',   hard: 'survivalHard',   expert: 'survivalExpert' },
      noMistakes: { easy: 'noMistakesEasy', medium: 'noMistakesMedium', hard: 'noMistakesHard', expert: 'noMistakesExpert' },
    });
  });
});

const makeSDK = (overrides: object) => overrides as unknown as YandexGamesSDK;

describe('fetchLeaderboard', () => {
  beforeEach(() => {
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(null);
  });

  it('returns null when SDK is unavailable', async () => {
    expect(await fetchLeaderboard('classic', 'medium')).toBeNull();
  });

  it('returns null when leaderboards API is missing', async () => {
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(
      makeSDK({ leaderboards: undefined })
    );
    expect(await fetchLeaderboard('classic', 'medium')).toBeNull();
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

    const result = await fetchLeaderboard('classic', 'medium');
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

    const result = await fetchLeaderboard('classic', 'medium');
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

    const result = await fetchLeaderboard('classic', 'medium');
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

    expect(await fetchLeaderboard('classic', 'medium')).toBeNull();
  });

  it('converts millisecond board scores to whole seconds for display', async () => {
    const entries: YandexLeaderboardEntry[] = [
      { rank: 1, score: 28000, player: { publicName: 'Fast', getAvatarSrc: () => '' }, formattedScore: '0:28' },
      { rank: 2, score: 95500, player: { publicName: 'Slow', getAvatarSrc: () => '' }, formattedScore: '1:36' },
    ];
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({
      getPlayer: async () => ({ isAuthorized: () => false, getName: () => '' }),
      leaderboards: {
        getEntries: async () => ({ entries }),
        getPlayerEntry: async () => { throw new Error('guest'); },
      },
    }));
    const result = await fetchLeaderboard('classic', 'medium');
    expect(result!.rows[0].score).toBe(28);   // 28000 ms → 28 s
    expect(result!.rows[1].score).toBe(96);   // 95500 ms → 96 s (rounded)
  });
});

describe('submitBestScore', () => {
  // Fire-and-forget: flush the internal promise chain (a macrotask drains all microtasks).
  const flush = () => new Promise((r) => setTimeout(r, 0));

  beforeEach(() => {
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(null);
  });

  it('does nothing (no throw) without an SDK', () => {
    expect(() => submitBestScore(LB_TOTAL_SCORE, 100)).not.toThrow();
  });

  it('skips non-positive scores without touching the API', async () => {
    const setScore = vi.fn(async () => {});
    const getPlayerEntry = vi.fn(async () => ({ score: 0 }));
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({ leaderboards: { setScore, getPlayerEntry } }));
    submitBestScore(LB_JOURNEY_STARS, 0);
    await flush();
    expect(getPlayerEntry).not.toHaveBeenCalled();
    expect(setScore).not.toHaveBeenCalled();
  });

  it('submits when strictly better than the current entry', async () => {
    const setScore = vi.fn(async () => {});
    const getPlayerEntry = vi.fn(async () => ({ score: 10 }));
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({ leaderboards: { setScore, getPlayerEntry } }));
    submitBestScore(LB_TOTAL_SCORE, 20);
    await flush();
    expect(setScore).toHaveBeenCalledWith(LB_TOTAL_SCORE, 20);
  });

  it('does not overwrite when the new score is not better', async () => {
    const setScore = vi.fn(async () => {});
    const getPlayerEntry = vi.fn(async () => ({ score: 50 }));
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({ leaderboards: { setScore, getPlayerEntry } }));
    submitBestScore(LB_TOTAL_SCORE, 20);
    await flush();
    expect(setScore).not.toHaveBeenCalled();
  });

  it('submits anyway when the player has no entry yet', async () => {
    const setScore = vi.fn(async () => {});
    const getPlayerEntry = vi.fn(async () => { throw new Error('no entry'); });
    vi.mocked(ysdkModule.getYSDK).mockReturnValue(makeSDK({ leaderboards: { setScore, getPlayerEntry } }));
    submitBestScore(LB_JOURNEY_STARS, 7);
    await flush();
    expect(setScore).toHaveBeenCalledWith(LB_JOURNEY_STARS, 7);
  });
});