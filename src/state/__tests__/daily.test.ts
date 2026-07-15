import { describe, it, expect } from 'vitest';
import { rewardForDay, todayStr, dayBefore, computeClaim } from '../daily';
import type { StreakState } from '../progress';

const streak = (current: number, lastClaimDate: string | null, best = current): StreakState => ({ current, lastClaimDate, best, doubledDate: null });

describe('daily logic', () => {
  it('rewardForDay cycles every 14 days', () => {
    expect(rewardForDay(1)).toBe(10);
    expect(rewardForDay(7)).toBe(60);
    expect(rewardForDay(8)).toBe(20);
    expect(rewardForDay(14)).toBe(90);
    expect(rewardForDay(15)).toBe(10);
  });
  it('dayBefore handles month/year boundaries', () => {
    expect(dayBefore('2026-06-09')).toBe('2026-06-08');
    expect(dayBefore('2026-03-01')).toBe('2026-02-28');
    expect(dayBefore('2026-01-01')).toBe('2025-12-31');
  });
  it('todayStr formats local date zero-padded', () => {
    expect(todayStr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('first ever claim → day 1 available', () => {
    expect(computeClaim(streak(0, null), '2026-06-09')).toEqual({ available: true, day: 1, reward: 10 });
  });
  it('already claimed today → not available', () => {
    expect(computeClaim(streak(3, '2026-06-09'), '2026-06-09').available).toBe(false);
  });
  it('claimed yesterday → continues (day+1)', () => {
    expect(computeClaim(streak(3, '2026-06-08'), '2026-06-09')).toEqual({ available: true, day: 4, reward: 25 });
  });
  it('missed a day (gap) → resets to day 1', () => {
    expect(computeClaim(streak(5, '2026-06-06'), '2026-06-09')).toEqual({ available: true, day: 1, reward: 10 });
  });
});
