import { describe, it, expect } from 'vitest';
import { regenEnergy, spendEnergy, refillEnergy, msToNextEnergy, grantLevelUpEnergy, REGEN_MS, MAX_ENERGY } from '../energy';

const full = { current: 5, max: 5, lastRegenTs: 0 };

describe('energy', () => {
  it('regen adds nothing when full and anchors lastRegenTs to now', () => {
    const r = regenEnergy(full, 10_000);
    expect(r.current).toBe(5);
    expect(r.lastRegenTs).toBe(10_000);
  });
  it('regen adds one per REGEN_MS and keeps the remainder', () => {
    const e = { current: 2, max: 5, lastRegenTs: 1_000 };
    const now = 1_000 + REGEN_MS * 2 + 5_000;
    const r = regenEnergy(e, now);
    expect(r.current).toBe(4);
    expect(r.lastRegenTs).toBe(1_000 + REGEN_MS * 2); // remainder preserved
  });
  it('regen caps at max and anchors ts to now', () => {
    const e = { current: 1, max: 5, lastRegenTs: 0 };
    const r = regenEnergy(e, REGEN_MS * 100);
    expect(r.current).toBe(5);
    expect(r.lastRegenTs).toBe(REGEN_MS * 100);
  });
  it('spend regenerates first then subtracts one, floored at 0', () => {
    expect(spendEnergy(full, 0).current).toBe(4);
    expect(spendEnergy({ current: 0, max: 5, lastRegenTs: 0 }, 1000).current).toBe(0);
  });
  it('refill full when no amount, or +amount capped', () => {
    expect(refillEnergy({ current: 0, max: 5, lastRegenTs: 0 }, 0).current).toBe(5);
    expect(refillEnergy({ current: 3, max: 5, lastRegenTs: 0 }, 0, 1).current).toBe(4);
    expect(refillEnergy({ current: 5, max: 5, lastRegenTs: 0 }, 0, 1).current).toBe(5);
  });
  it('msToNextEnergy is 0 when full, else counts down within a window', () => {
    expect(msToNextEnergy(full, 0)).toBe(0);
    expect(msToNextEnergy({ current: 1, max: 5, lastRegenTs: 0 }, 5_000)).toBe(REGEN_MS - 5_000);
  });

  it('grantLevelUpEnergy raises the cap and grants the same lives to current', () => {
    const r = grantLevelUpEnergy({ current: 3, max: 5, lastRegenTs: 0 }, 1, 0);
    expect(r.max).toBe(6);
    expect(r.current).toBe(4);
  });
  it('grantLevelUpEnergy applies multiple levels at once', () => {
    const r = grantLevelUpEnergy({ current: 5, max: 5, lastRegenTs: 0 }, 2, 0);
    expect(r.max).toBe(7);
    expect(r.current).toBe(7);
  });
  it('grantLevelUpEnergy never exceeds MAX_ENERGY (cap 10)', () => {
    const r = grantLevelUpEnergy({ current: 9, max: 9, lastRegenTs: 0 }, 5, 0);
    expect(r.max).toBe(MAX_ENERGY);
    expect(r.current).toBe(MAX_ENERGY);
    // Already at the cap → only the regen happens, no extra life.
    const capped = grantLevelUpEnergy({ current: 8, max: 10, lastRegenTs: 0 }, 3, 0);
    expect(capped.max).toBe(10);
    expect(capped.current).toBe(8);
  });
});
