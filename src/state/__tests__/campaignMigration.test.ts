import { describe, it, expect } from 'vitest';
import { mergeProgress, INITIAL_PROGRESS } from '../progress';

describe('progress v5 migration', () => {
  it('defaults campaign + energy for a v4 save that lacks them', () => {
    const v4 = { version: 4, pearls: 10, stats: { xp: 0 } };
    const m = mergeProgress(v4);
    expect(m.version).toBe(5);
    expect(m.campaign).toEqual({ stars: {}, cleared: [] });
    expect(m.energy).toEqual({ current: 5, max: 5, lastRegenTs: 0 });
    expect(m.pearls).toBe(10);
  });
  it('preserves existing campaign/energy and drops invalid star values', () => {
    const save = { version: 5, campaign: { stars: { 'lagoon-1': 3, bad: 9 }, cleared: ['lagoon-1'] },
      energy: { current: 2, max: 5, lastRegenTs: 123 } };
    const m = mergeProgress(save);
    expect(m.campaign.stars['lagoon-1']).toBe(3);
    expect(m.campaign.stars.bad).toBeUndefined();
    expect(m.campaign.cleared).toEqual(['lagoon-1']);
    expect(m.energy).toEqual({ current: 2, max: 5, lastRegenTs: 123 });
  });
  it('INITIAL_PROGRESS is version 5 with defaults', () => {
    expect(INITIAL_PROGRESS.version).toBe(5);
    expect(INITIAL_PROGRESS.energy.current).toBe(5);
  });
});
