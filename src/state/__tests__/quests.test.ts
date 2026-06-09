import { describe, it, expect } from 'vitest';
import { pickDailyQuests, rerollQuestId, QUEST_BY_ID, QUEST_POOL } from '../quests';
describe('quests pure logic', () => {
  it('pickDailyQuests is deterministic + 3 distinct valid ids', () => {
    const a = pickDailyQuests('2026-06-09');
    expect(a).toEqual(pickDailyQuests('2026-06-09'));         // stable
    expect(new Set(a).size).toBe(3);                           // distinct
    a.forEach((id) => expect(QUEST_BY_ID[id]).toBeDefined());  // valid
  });
  it('different dates generally differ', () => {
    expect(pickDailyQuests('2026-06-09')).not.toEqual(pickDailyQuests('2026-07-15'));
  });
  it('measure: winGames counts wins, playGames counts starts, matchPairs adds pairs', () => {
    expect(QUEST_BY_ID.winGames.measure({ type: 'win', difficulty: 'easy', pairs: 6, perfect: false, fast: false })).toBe(1);
    expect(QUEST_BY_ID.winGames.measure({ type: 'start' })).toBe(0);
    expect(QUEST_BY_ID.playGames.measure({ type: 'start' })).toBe(1);
    expect(QUEST_BY_ID.matchPairs.measure({ type: 'win', difficulty: 'easy', pairs: 6, perfect: false, fast: false })).toBe(6);
    expect(QUEST_BY_ID.winHard.measure({ type: 'win', difficulty: 'expert', pairs: 14, perfect: false, fast: false })).toBe(1);
    expect(QUEST_BY_ID.perfectWin.measure({ type: 'win', difficulty: 'easy', pairs: 6, perfect: true, fast: false })).toBe(1);
  });
  it('rerollQuestId returns an unused pool id, deterministic', () => {
    const active = pickDailyQuests('2026-06-09');
    const r = rerollQuestId('2026-06-09', active, 0);
    expect(active).not.toContain(r);
    expect(QUEST_BY_ID[r!]).toBeDefined();
    expect(rerollQuestId('2026-06-09', active, 0)).toBe(r);    // stable
  });
  it('QUEST_POOL has 8 entries, all unique ids + positive reward/target', () => {
    expect(QUEST_POOL.length).toBe(8);
    expect(new Set(QUEST_POOL.map((q) => q.id)).size).toBe(QUEST_POOL.length);
    QUEST_POOL.forEach((q) => { expect(q.nameKey).toBeTruthy(); expect(q.reward).toBeGreaterThan(0); expect(q.target).toBeGreaterThan(0); });
  });
});
