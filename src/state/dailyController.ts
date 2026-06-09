import { setModal, uiStore } from './store';
import { claimDaily as claimInStore, doubleDaily as doubleInStore, progressStore } from './progress';
import { computeClaim, todayStr } from './daily';
import { bus } from './eventBus';
import { getYSDK } from '../ysdk';

/** Force-open the daily modal, reflecting current state (claimable OR already-claimed-today). */
export function openDaily(): void {
  const today = todayStr();
  const st = progressStore.get().streak;
  const info = computeClaim(st, today);   // available=false when already claimed today (day=current, reward=rewardForDay(current))
  setModal({ daily: { day: info.day, reward: info.reward, claimed: !info.available, doubled: st.doubledDate === today } });
}

export function closeDaily(): void { setModal({ daily: null }); }

export function claim(): void {
  const d = uiStore.get().modal.daily;
  if (!d || d.claimed) return;
  const res = claimInStore(todayStr());
  if (res) setModal({ daily: { ...d, claimed: true, day: res.day, reward: res.reward } });
}

/** Opt-in rewarded video → ×2. Mirrors GameScene.showAdThenProceed (guard, done-flag, 15s fallback, audio mute via bus). */
export function watchDoubleAd(): void {
  const d = uiStore.get().modal.daily;
  if (!d || !d.claimed || d.doubled) return;
  const sdk = getYSDK();
  if (!sdk?.adv?.showRewardedVideo) return;   // no ad → no-op (button only shows when claimed)

  let done = false;
  const unmute = () => bus.emit('cmd:set-muted', false);
  const fallback = window.setTimeout(() => { if (!done) { done = true; unmute(); } }, 15_000);
  try {
    sdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => {
          if (done) return;
          done = true; window.clearTimeout(fallback);
          doubleInStore(todayStr());
          const cur = uiStore.get().modal.daily;
          if (cur) setModal({ daily: { ...cur, doubled: true } });
          unmute();
        },
        onClose: () => { window.clearTimeout(fallback); if (!done) { done = true; unmute(); } },
        onError: () => { window.clearTimeout(fallback); if (!done) { done = true; unmute(); } },
      },
    });
    bus.emit('cmd:set-muted', true);
  } catch { window.clearTimeout(fallback); unmute(); }
}
