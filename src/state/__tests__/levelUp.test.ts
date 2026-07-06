import { describe, it, expect, beforeEach } from 'vitest';
import { progressStore, INITIAL_PROGRESS, levelFromXp, xpForLevel } from '../progress';
import { maybeShowLevelUp, closeLevelUp } from '../levelUpController';
import { uiStore } from '../store';

// XP that lands the player exactly at the start of `level`.
const xpAt = (level: number) => xpForLevel(level);

function reset(seenLevel: number, xp: number) {
  localStorage.clear();
  progressStore.set({
    ...INITIAL_PROGRESS,
    stats: { ...INITIAL_PROGRESS.stats, xp, seenLevel },
  });
  uiStore.set({ modal: { ...uiStore.get().modal, levelUp: null } });
}

describe('level-up modal controller', () => {
  beforeEach(() => reset(1, 0));

  it('does not open when the current level equals the seen level', () => {
    reset(1, 0); // level 1, seen 1
    maybeShowLevelUp();
    expect(uiStore.get().modal.levelUp).toBeNull();
  });

  it('opens with the current level and the pearls granted for the gained levels', () => {
    const xp = xpAt(3);                 // player is now level 3
    reset(1, xp);                       // but only acknowledged level 1
    expect(levelFromXp(xp).level).toBe(3);
    maybeShowLevelUp();
    const m = uiStore.get().modal.levelUp;
    expect(m).not.toBeNull();
    expect(m!.level).toBe(3);
    expect(m!.reward).toBe(50 * (3 - 1)); // LEVEL_UP_REWARD × levels gained
  });

  it('closing marks the current level seen and prevents a re-show', () => {
    reset(1, xpAt(2));
    maybeShowLevelUp();
    expect(uiStore.get().modal.levelUp).not.toBeNull();
    closeLevelUp();
    expect(uiStore.get().modal.levelUp).toBeNull();
    expect(progressStore.get().stats.seenLevel).toBe(2);
    maybeShowLevelUp();                 // no new level since
    expect(uiStore.get().modal.levelUp).toBeNull();
  });
});
