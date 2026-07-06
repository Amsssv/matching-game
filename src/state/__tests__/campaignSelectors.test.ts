import { describe, it, expect } from 'vitest';
import { isLevelUnlocked, isChapterUnlocked, chapterStars, totalStars, isChapterComplete } from '../campaign';
import type { CampaignProgress } from '../progress';

const empty: CampaignProgress = { stars: {}, cleared: [] };

describe('campaign selectors', () => {
  it('first level of chapter 1 is unlocked from scratch; second is not', () => {
    expect(isLevelUnlocked('lagoon-1', empty)).toBe(true);
    expect(isLevelUnlocked('lagoon-2', empty)).toBe(false);
  });
  it('clearing a level unlocks the next in the same chapter', () => {
    const cp: CampaignProgress = { stars: { 'lagoon-1': 1 }, cleared: ['lagoon-1'] };
    expect(isLevelUnlocked('lagoon-2', cp)).toBe(true);
  });
  it('chapter 2 stays locked until chapter 1 has enough stars', () => {
    expect(isChapterUnlocked('reef', empty)).toBe(false);
    const stars: Record<string, 3> = {};
    for (let i = 1; i <= 6; i++) stars[`lagoon-${i}`] = 3; // 18 stars
    const cp: CampaignProgress = { stars, cleared: Object.keys(stars) };
    expect(chapterStars('lagoon', cp)).toBe(18);
    expect(isChapterUnlocked('reef', cp)).toBe(true);
    expect(isLevelUnlocked('reef-1', cp)).toBe(true); // first level of an unlocked chapter
  });
  it('totalStars sums across chapters; isChapterComplete needs all levels cleared', () => {
    const cp: CampaignProgress = { stars: { 'lagoon-1': 2, 'reef-1': 1 }, cleared: ['lagoon-1', 'reef-1'] };
    expect(totalStars(cp)).toBe(3);
    expect(isChapterComplete('lagoon', cp)).toBe(false);
  });
});
