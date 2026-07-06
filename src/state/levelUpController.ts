import { setModal } from './store';
import { progressStore, levelFromXp, markLevelSeen, LEVEL_UP_REWARD } from './progress';

/**
 * If the player's XP-derived level is ahead of the last acknowledged level, open
 * the level-up celebration. Called when the main menu mounts (i.e. the player is
 * in the menu). Shows the highest new level once; reward = pearls already granted
 * for the levels gained (LEVEL_UP_REWARD per level) — display only, no re-grant.
 */
export function maybeShowLevelUp(): void {
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
