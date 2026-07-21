import { describe, it, expect } from 'vitest';
import {
  MODE_ORDER, MODE_UNLOCK, MODE_EMOJI, PEARL_MULT, XP_MULT,
  TIME_ATTACK, PREVIEW_SEC, timeAttackRemaining,
} from '../modes';
import type { GameMode } from '../modes';

const DIFFS = ['easy', 'medium', 'hard', 'expert'] as const;

describe('modes config', () => {
  it('has 4 modes in a stable order', () => {
    expect(MODE_ORDER).toEqual(['classic', 'timeAttack', 'survival', 'noMistakes']);
  });

  it('unlock levels are 1/3/6/10', () => {
    expect(MODE_UNLOCK).toEqual({ classic: 1, timeAttack: 3, survival: 6, noMistakes: 10 });
  });

  it('every mode has an emoji and full multiplier rows', () => {
    for (const m of MODE_ORDER as readonly GameMode[]) {
      expect(MODE_EMOJI[m].length).toBeGreaterThan(0);
      for (const d of DIFFS) {
        expect(PEARL_MULT[m][d]).toBeGreaterThan(0);
        expect(XP_MULT[m][d]).toBeGreaterThan(0);
      }
    }
  });

  it('classic pays ×1 everywhere; noMistakes scales by difficulty', () => {
    for (const d of DIFFS) expect(PEARL_MULT.classic[d]).toBe(1);
    expect(PEARL_MULT.noMistakes).toEqual({ easy: 1.25, medium: 1.5, hard: 1.75, expert: 2 });
  });

  it('timeAttack table matches the spec (start scales, bonus scales)', () => {
    expect(TIME_ATTACK).toEqual({
      easy:   { startSec: 10, bonusSec: 3 },
      medium: { startSec: 15, bonusSec: 4 },
      hard:   { startSec: 20, bonusSec: 5 },
      expert: { startSec: 30, bonusSec: 6 },
    });
  });

  it('preview seconds cap at 10 (user decision)', () => {
    expect(PREVIEW_SEC).toEqual({ easy: 5, medium: 7, hard: 9, expert: 10 });
    for (const d of DIFFS) expect(PREVIEW_SEC[d]).toBeLessThanOrEqual(10);
  });
});

describe('timeAttackRemaining', () => {
  const cfg = { startSec: 10, bonusSec: 3 };

  it('starts with the full budget', () => {
    expect(timeAttackRemaining(0, 0, cfg)).toBe(10);
  });

  it('credits bonus per matched pair', () => {
    expect(timeAttackRemaining(5, 2, cfg)).toBe(10 + 6 - 5); // 11
  });

  it('never goes negative (formatTime(-2) renders garbage)', () => {
    expect(timeAttackRemaining(60, 0, cfg)).toBe(0);
    expect(timeAttackRemaining(10, 0, cfg)).toBe(0);
  });
});
