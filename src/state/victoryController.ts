import { setModal, uiStore } from './store';
import { awardPearls } from './progress';
import { bus } from './eventBus';
import { getYSDK } from '../ysdk';
import { readSoundEnabled } from '../game/settings';

/**
 * Opt-in rewarded video → double the win's pearls. Mirrors
 * dailyController.watchDoubleAd (SDK guard, done-flag, 15s fallback, audio mute).
 * Crediting the same amount again makes the total 2× pearlsEarned.
 */
export function doubleVictoryReward(): void {
  const v = uiStore.get().modal.victory;
  if (!v || v.doubled || v.pearlsEarned <= 0) return;
  const sdk = getYSDK();
  if (!sdk?.adv?.showRewardedVideo) return;   // no ad available → no-op (button only shows when it is)

  let done = false;
  const unmute = () => bus.emit('cmd:set-muted', !readSoundEnabled());
  const fallback = window.setTimeout(() => { if (!done) { done = true; unmute(); } }, 15_000);
  try {
    sdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => {
          if (done) return;
          done = true; window.clearTimeout(fallback);
          const cur = uiStore.get().modal.victory;
          if (cur && !cur.doubled) {
            awardPearls(cur.pearlsEarned);
            setModal({ victory: { ...cur, doubled: true } });
          }
          unmute();
        },
        onClose: () => { window.clearTimeout(fallback); if (!done) { done = true; unmute(); } },
        onError: () => { window.clearTimeout(fallback); if (!done) { done = true; unmute(); } },
      },
    });
    bus.emit('cmd:set-muted', true);
  } catch { window.clearTimeout(fallback); unmute(); }
}
