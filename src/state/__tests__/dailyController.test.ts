import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mutable SDK stub: null by default (persist()'s cloud save + ad helper stay inert),
// swapped to a fake rewarded-ad SDK in the watchDoubleAd tests below.
type AdCallbacks = { onRewarded?: () => void; onClose?: () => void; onError?: () => void };
const hoisted = vi.hoisted(() => ({
  sdk: null as null | { adv: { showRewardedVideo: (o: { callbacks: AdCallbacks }) => void } },
}));
vi.mock('../../ysdk', () => ({ getYSDK: () => hoisted.sdk }));

import { maybeAutoOpenDaily, watchDoubleAd } from '../dailyController';
import { progressStore, resetProgress } from '../progress';
import type { StreakState } from '../progress';
import { uiStore, resetUi, setModal } from '../store';
import { bus } from '../eventBus';
import { saveSoundEnabled } from '../../game/settings';
import { todayStr } from '../daily';

const today = todayStr();

const setStreak = (patch: Partial<StreakState>) =>
  progressStore.set({
    streak: { current: 0, lastClaimDate: null, best: 0, doubledDate: null, autoShownDate: null, ...patch },
  });

beforeEach(() => { localStorage.clear(); resetProgress(); resetUi(); hoisted.sdk = null; });

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

describe('watchDoubleAd audio restore', () => {
  // Fake rewarded-ad SDK that captures the callbacks so the test drives them.
  const armAd = () => {
    let cbs: AdCallbacks | null = null;
    hoisted.sdk = { adv: { showRewardedVideo: (o) => { cbs = o.callbacks; } } };
    return () => cbs!;
  };
  const armDailyClaimed = () =>
    setModal({ daily: { day: 1, reward: 100, claimed: true, doubled: false } });

  it('restores audio to the user setting — stays MUTED when sound is OFF after the ad closes', () => {
    saveSoundEnabled(false);                                   // user has sound OFF
    const getCbs = armAd();
    armDailyClaimed();
    const seen: boolean[] = [];
    const off = bus.on('cmd:set-muted', (v) => seen.push(v));
    watchDoubleAd();                                           // emits mute=true, shows ad
    getCbs().onClose?.();                                      // ad closes → restore
    off();
    expect(seen.at(-1)).toBe(true);   // must restore to muted (sound OFF), NOT force-unmute
  });

  it('restores audio to UNMUTED when sound is ON after the reward', () => {
    saveSoundEnabled(true);
    const getCbs = armAd();
    armDailyClaimed();
    const seen: boolean[] = [];
    const off = bus.on('cmd:set-muted', (v) => seen.push(v));
    watchDoubleAd();
    getCbs().onRewarded?.();
    off();
    expect(seen.at(-1)).toBe(false);
  });
});
