import { describe, it, expect, beforeEach } from 'vitest';
import { progressStore, INITIAL_PROGRESS, recordCampaignResult, levelFromXp } from '../progress';

beforeEach(() => progressStore.set(structuredClone(INITIAL_PROGRESS)));

describe('recordCampaignResult', () => {
  it('first 3-star clear grants firstClear + per-star pearls and records stars', () => {
    const r = recordCampaignResult('lagoon-1', { won: true, seconds: 1, moves: 1, mistakes: 0 });
    expect(r.stars).toBe(3);
    expect(r.pearls).toBeGreaterThan(0);
    expect(progressStore.get().campaign.stars['lagoon-1']).toBe(3);
    expect(progressStore.get().campaign.cleared).toContain('lagoon-1');
  });
  it('a level-up from campaign XP raises the life cap (+1) and grants the life', () => {
    const p = progressStore.get();
    progressStore.set({ stats: { ...p.stats, xp: 99 } });   // one 8-XP clear crosses the level-2 threshold (100)
    recordCampaignResult('lagoon-1', { won: true, seconds: 1, moves: 1, mistakes: 0 });
    expect(levelFromXp(progressStore.get().stats.xp).level).toBeGreaterThanOrEqual(2);
    expect(progressStore.get().energy.max).toBe(6);
    expect(progressStore.get().energy.current).toBe(6);
  });
  it('a replay only pays the star delta and never lowers recorded stars', () => {
    recordCampaignResult('lagoon-1', { won: true, seconds: 999, moves: 999, mistakes: 9 }); // 1 star
    const before = progressStore.get().pearls;
    const r2 = recordCampaignResult('lagoon-1', { won: true, seconds: 1, moves: 1, mistakes: 0 }); // 3 stars
    expect(progressStore.get().campaign.stars['lagoon-1']).toBe(3);
    expect(r2.pearls).toBe(2 * 5); // 2 extra stars × perStarPearls, no firstClear again
    // a worse replay pays nothing and keeps 3
    const r3 = recordCampaignResult('lagoon-1', { won: true, seconds: 999, moves: 999, mistakes: 9 });
    expect(r3.pearls).toBe(0);
    expect(progressStore.get().campaign.stars['lagoon-1']).toBe(3);
    expect(progressStore.get().pearls).toBeGreaterThanOrEqual(before);
  });
  it('a loss records nothing and grants nothing', () => {
    const r = recordCampaignResult('lagoon-1', { won: false, seconds: 5, moves: 5, mistakes: 0 });
    expect(r.stars).toBe(0);
    expect(r.pearls).toBe(0);
    expect(progressStore.get().campaign.cleared).not.toContain('lagoon-1');
  });
  it('completing a chapter grants a +100 bonus once and does NOT unlock the biome skin', () => {
    const win = { won: true, seconds: 1, moves: 1, mistakes: 0 };
    // Record all 12 reef levels directly (recordCampaignResult does not enforce unlock gates).
    for (let i = 1; i <= 11; i++) {
      const r = recordCampaignResult(`reef-${i}`, win);
      expect(r.chapterCompleted).toBe(false);
      expect(r.skinUnlocked).toBeNull();
    }
    const r12 = recordCampaignResult('reef-12', win);
    expect(r12.chapterCompleted).toBe(true);
    expect(r12.skinUnlocked).toBeNull();              // sea skins stay purchase-only (donate)
    expect(r12.pearls).toBeGreaterThanOrEqual(100);   // includes the +100 chapter bonus
    expect(progressStore.get().unlocked).not.toContain('sea.reef');
    // Re-clearing the final level after completion: no second bonus (firstClear guard).
    const before = progressStore.get().pearls;
    const again = recordCampaignResult('reef-12', win);
    expect(again.chapterCompleted).toBe(false);
    expect(again.pearls).toBe(0);
    expect(progressStore.get().pearls).toBe(before);
  });
});
