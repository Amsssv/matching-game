import { describe, it, expect, beforeEach, vi } from 'vitest';
import { progressStore, INITIAL_PROGRESS, energyRefillCost } from '../progress';
import { bus } from '../eventBus';
import { uiStore } from '../store';
import { startLevel, finishLevel, refillEnergyWithPearls, currentRefillCost, ENERGY_REFILL_COST } from '../campaignController';

beforeEach(() => { localStorage.clear(); progressStore.set(structuredClone(INITIAL_PROGRESS)); uiStore.reset(); });

describe('campaignController', () => {
  it('startLevel spends energy and emits play-campaign-level', () => {
    const spy = vi.fn();
    bus.on('cmd:play-campaign-level', spy);
    startLevel('lagoon-1', 0);
    expect(progressStore.get().energy.current).toBe(4);
    expect(spy).toHaveBeenCalledWith({ levelId: 'lagoon-1' });
    bus.off('cmd:play-campaign-level', spy);
  });
  it('startLevel is blocked at 0 energy (no emit, no negative)', () => {
    progressStore.set({ energy: { current: 0, max: 5, lastRegenTs: 1 } });
    const spy = vi.fn();
    bus.on('cmd:play-campaign-level', spy);
    startLevel('lagoon-1', 1);
    expect(spy).not.toHaveBeenCalled();
    expect(progressStore.get().energy.current).toBe(0);
    bus.off('cmd:play-campaign-level', spy);
  });
  it('finishLevel on a loss decrements nothing extra but opens result with 0 stars', () => {
    finishLevel('lagoon-1', { won: false, seconds: 5, moves: 5, mistakes: 0 });
    expect(uiStore.get().modal.levelResult?.stars).toBe(0);
  });
  it('refillEnergyWithPearls deducts cost and fills, no-op when broke', () => {
    progressStore.set({ pearls: 100, energy: { current: 1, max: 5, lastRegenTs: 0 } });
    expect(refillEnergyWithPearls(0)).toBe(true);
    expect(progressStore.get().pearls).toBe(100 - ENERGY_REFILL_COST);
    expect(progressStore.get().energy.current).toBe(5);
    progressStore.set({ pearls: 0, energy: { current: 1, max: 5, lastRegenTs: 0 } });
    expect(refillEnergyWithPearls(0)).toBe(false);
    expect(progressStore.get().energy.current).toBe(1);
  });

  it('energyRefillCost doubles with today count and resets on a new day', () => {
    expect(energyRefillCost({ date: null, count: 0 }, '2026-07-20')).toBe(60);
    expect(energyRefillCost({ date: '2026-07-20', count: 1 }, '2026-07-20')).toBe(120);
    expect(energyRefillCost({ date: '2026-07-20', count: 3 }, '2026-07-20')).toBe(480);
    expect(energyRefillCost({ date: '2026-07-19', count: 5 }, '2026-07-20')).toBe(60);   // new day → base
  });

  it('refillEnergyWithPearls charges the doubling price, tracks count, and persists', () => {
    progressStore.set({ pearls: 1000, energy: { current: 0, max: 5, lastRegenTs: 0 } });
    expect(currentRefillCost()).toBe(60);
    expect(refillEnergyWithPearls(0)).toBe(true);
    expect(progressStore.get().pearls).toBe(940);
    expect(progressStore.get().energyRefills.count).toBe(1);
    // Persisted (fixes the old refill's lost-on-reload spend).
    expect(JSON.parse(localStorage.getItem('sea-pairs-progress')!).pearls).toBe(940);
    // Second buy the same day costs double.
    expect(currentRefillCost()).toBe(120);
    progressStore.set({ energy: { current: 0, max: 5, lastRegenTs: 0 } });
    expect(refillEnergyWithPearls(0)).toBe(true);
    expect(progressStore.get().pearls).toBe(820);
    expect(progressStore.get().energyRefills.count).toBe(2);
  });
});
