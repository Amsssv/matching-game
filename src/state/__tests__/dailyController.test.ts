import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the SDK so persist()'s cloud save and the ad helper are inert in tests.
vi.mock('../../ysdk', () => ({ getYSDK: () => null }));

import { maybeAutoOpenDaily } from '../dailyController';
import { progressStore, resetProgress } from '../progress';
import type { StreakState } from '../progress';
import { uiStore, resetUi, setModal } from '../store';
import { todayStr } from '../daily';

const today = todayStr();

const setStreak = (patch: Partial<StreakState>) =>
  progressStore.set({
    streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null, autoShownDate: null, ...patch },
  });

beforeEach(() => { localStorage.clear(); resetProgress(); resetUi(); });

describe('maybeAutoOpenDaily', () => {
  it('opens the daily modal and stamps autoShownDate when a reward is claimable', () => {
    maybeAutoOpenDaily();
    expect(uiStore.get().modal.daily).toBeTruthy();
    expect(progressStore.get().streak.autoShownDate).toBe(today);
  });

  it('no-ops when already auto-shown today', () => {
    setStreak({ autoShownDate: today });   // reward still claimable, but already shown
    maybeAutoOpenDaily();
    expect(uiStore.get().modal.daily).toBeNull();
  });

  it('no-ops when the reward was already claimed today', () => {
    setStreak({ current: 1, lastClaimDate: today });   // claimed today → not available
    maybeAutoOpenDaily();
    expect(uiStore.get().modal.daily).toBeNull();
    expect(progressStore.get().streak.autoShownDate).toBeNull();   // not stamped
  });

  it('no-ops (and does not stamp) when another modal is already open', () => {
    setModal({ help: true });
    maybeAutoOpenDaily();
    expect(uiStore.get().modal.daily).toBeNull();
    expect(progressStore.get().streak.autoShownDate).toBeNull();
  });
});
