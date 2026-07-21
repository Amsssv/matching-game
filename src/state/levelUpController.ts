import { setModal, uiStore } from './store';
import { progressStore, levelFromXp, markLevelSeen, LEVEL_UP_REWARD } from './progress';

/**
 * If the player's XP-derived level is ahead of the last acknowledged level, open
 * the level-up celebration — as soon as the level is reached, in any context.
 *
 * Deferred while a result screen is up (victory / defeat / level-result) so it lands
 * right after that closes, never stacked over it. The gate reads `uiStore.get()`
 * LIVE (not React props): store setters update state synchronously, so this sees a
 * just-opened result modal even inside the same tick — avoiding the two-store
 * microtask race that previously let the level-up pop UNDER the journey modals.
 * Reward is display-only (pearls already granted): LEVEL_UP_REWARD per level gained.
 */
export function maybeShowLevelUp(): void {
  const m = uiStore.get().modal;
  if (m.victory || m.defeat || m.levelResult) return;   // let the result screen show first
  const s = progressStore.get().stats;
  const cur = levelFromXp(s.xp).level;
  if (cur > s.seenLevel) {
    setModal({ levelUp: { level: cur, reward: LEVEL_UP_REWARD * (cur - s.seenLevel) } });
  }
}

/** Close the modal and mark the current level acknowledged (won't reappear). */
export function closeLevelUp(): void {
  setModal({ levelUp: null });
  markLevelSeen();
}
