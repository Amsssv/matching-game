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
// Yandex caps setScore at 1 request/second and REJECTS (does not queue) anything faster
// — https://yandex.com/dev/games/doc/en/sdk/sdk-leaderboard. A single win fires several
// setScores (the per-mode `time` board plus the monotonic totalScore/journeyStars
// aggregates), so without serialization all but the first are rejected and that board
// silently keeps the old record — the "beating my time doesn't overwrite" bug. Funnel
// every setScore through one queue that spaces writes ≥1s apart. Never throws.
const MIN_SET_SCORE_GAP_MS = 1000;
type ScoreBoard = { setScore(name: string, score: number): Promise<void> };
let setScoreChain: Promise<void> = Promise.resolve();
let lastSetScoreAt = 0;

function queuedSetScore(lb: ScoreBoard, boardId: string, score: number): Promise<void> {
  const run = setScoreChain.then(async () => {
    const gap = MIN_SET_SCORE_GAP_MS - (Date.now() - lastSetScoreAt);
    if (gap > 0) await new Promise<void>(r => setTimeout(r, gap));
    lastSetScoreAt = Date.now();
    try { await lb.setScore(boardId, score); } catch { /* rate limit / guest / network — ignore */ }
  });
  setScoreChain = run;   // the next write chains after this one (and its ≥1s gap)
  return run;
}

/** Test-only: reset the setScore throttle so each test starts un-spaced. */
export function resetSetScoreThrottleForTest(): void {
  setScoreChain = Promise.resolve();
  lastSetScoreAt = 0;
}

export function submitBestScore(boardId: string, score: number): void {
  if (!Number.isFinite(score) || score <= 0) return;
  const lb = getYSDK()?.leaderboards;
  if (!lb) return;
  lb.getPlayerEntry(boardId).then(
    entry => { if (score > entry.score) return queuedSetScore(lb, boardId, score); },
    () => queuedSetScore(lb, boardId, score),   // no entry yet / read error → submit
  ).catch(() => {});
}

/**
 * Submit a completion time (in MILLISECONDS) to a `time` board, overwriting only
 * when strictly FASTER than the player's current entry. Yandex `setScore` overwrites
 * UNCONDITIONALLY — it is not "keep best", and `invert_sort_order` only affects display
 * ranking, never the write — so this client-side guard is what actually preserves the
 * fastest time. No entry yet / read error → submit. Never throws; returns a promise that
 * settles once the write attempt is done, so callers can chain a leaderboard refresh.
 *
 * Use this for the 16 `time` boards. Do NOT invert the value (no `9999 - seconds`): the
 * boards are `time` + ascending and take raw ms — inversion would mis-format the time.
 */
export function submitBestTime(boardId: string, ms: number): Promise<void> {
  const lb = getYSDK()?.leaderboards;
  if (!lb || !Number.isFinite(ms) || ms <= 0) return Promise.resolve();
  return lb.getPlayerEntry(boardId).then(
    entry => { if (ms < entry.score) return queuedSetScore(lb, boardId, ms); },
    () => queuedSetScore(lb, boardId, ms),   // no entry yet / read error → submit
  ).catch(() => {});
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