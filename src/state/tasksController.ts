import { setModal } from './store';
import { claimQuest as claimQuestStore, rerollQuest as rerollQuestStore, claimAchievement as claimAchStore, ensureTodayQuests } from './progress';
import { todayStr } from './daily';
import { bus } from './eventBus';
import { getYSDK } from '../ysdk';
import { readSoundEnabled } from '../game/settings';
import type { TasksTab } from './types';

export function openTasks(tab: TasksTab = 'quests') { ensureTodayQuests(todayStr()); setModal({ tasks: { tab } }); }
export function closeTasks() { setModal({ tasks: null }); }
export function switchTasksTab(tab: TasksTab) { setModal({ tasks: { tab } }); }
export function claimQuest(id: string): number | null { return claimQuestStore(id); }
export function claimAchievement(id: string): number | null { return claimAchStore(id); }

/** Reroll one quest behind a rewarded video. Mirrors dailyController.watchDoubleAd. */
export function rerollWithAd(index: number): void {
  const sdk = getYSDK();
  if (!sdk?.adv?.showRewardedVideo) { rerollQuestStore(index); return; }   // no SDK → reroll directly (guest/dev fallback)
  let done = false;
  const unmute = () => bus.emit('cmd:set-muted', !readSoundEnabled());
  const fallback = window.setTimeout(() => { if (!done) { done = true; unmute(); } }, 15_000);
  try {
    sdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => { if (done) return; done = true; window.clearTimeout(fallback); rerollQuestStore(index); unmute(); },
        onClose: () => { window.clearTimeout(fallback); if (!done) { done = true; unmute(); } },
        onError: () => { window.clearTimeout(fallback); if (!done) { done = true; unmute(); } },
      },
    });
    bus.emit('cmd:set-muted', true);
  } catch { window.clearTimeout(fallback); unmute(); }
}
