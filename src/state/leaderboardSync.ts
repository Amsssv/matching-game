import { progressStore } from './progress';
import { totalStars } from './campaign';
import { submitBestScore, LB_JOURNEY_STARS } from '../game/leaderboard';

/**
 * Push the player's monotonic aggregate metrics to their Yandex leaderboards:
 *   totalScore   → cumulative player XP
 *   journeyStars → total stars collected across the campaign
 *
 * Safe to call as often as we like — submissions are guarded (only overwrite when
 * strictly better), fire-and-forget, and no-op without an authorized SDK. Called
 * after each win, after a campaign level result, and once at boot to seed existing
 * progress. See LEADERBOARDS.md §2.
 */
export function syncProgressLeaderboards(): void {
  const p = progressStore.get();
  // TEMP (2026-07-23): the `totalScore` board isn't connected in the Yandex console yet,
  // and its setScore competed with the per-mode `time` board for Yandex's 1-request/second
  // setScore limit — which dropped time-record updates after a restart. Disabled until the
  // board is created; re-enable then (re-add LB_TOTAL_SCORE to the import above):
  //   submitBestScore(LB_TOTAL_SCORE, p.stats.xp);
  submitBestScore(LB_JOURNEY_STARS, totalStars(p.campaign));
}
