import type { StreakState } from './progress';

export const DAILY_REWARDS = [10, 15, 20, 25, 30, 40, 60] as const;

/** Pearls for streak day N (1-based), cycling every 7 days. */
export function rewardForDay(day: number): number {
  const d = Math.max(1, Math.floor(day));
  return DAILY_REWARDS[(d - 1) % DAILY_REWARDS.length];
}

/** Local calendar date as 'YYYY-MM-DD'. */
export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The 'YYYY-MM-DD' one calendar day before the given date string. */
export function dayBefore(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return todayStr(dt);
}

export interface ClaimInfo { available: boolean; day: number; reward: number; }

/** Pure: given the stored streak and today's date string, what (if anything) can be claimed. */
export function computeClaim(streak: StreakState, today: string): ClaimInfo {
  if (streak.lastClaimDate === today) {
    const day = Math.max(1, streak.current);
    return { available: false, day, reward: rewardForDay(day) };
  }
  const day = streak.lastClaimDate === dayBefore(today) ? streak.current + 1 : 1;
  return { available: true, day, reward: rewardForDay(day) };
}
