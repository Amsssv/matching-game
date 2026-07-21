import { setModal } from './store';
import { progressStore, recordCampaignResult, buyEnergyRefill, energyRefillCost, ENERGY_REFILL_BASE_COST } from './progress';
import { spendEnergy, regenEnergy } from './energy';
import { todayStr } from './daily';
import { bus } from './eventBus';
import { syncProgressLeaderboards } from './leaderboardSync';
import type { BiomeId, LevelResult } from './campaign';

/** Base (first-of-day) refill price. The live price doubles per purchase — see currentRefillCost(). */
export const ENERGY_REFILL_COST = ENERGY_REFILL_BASE_COST;

/** Live refill price for the current day (base × 2^purchases-today). */
export function currentRefillCost(): number {
  return energyRefillCost(progressStore.get().energyRefills, todayStr());
}

/** Enter the journey (CampaignScene). Fresh energy + map view, then transition. */
export function openCampaign(): void {
  syncEnergy(Date.now());
  setModal({ island: null, levelStart: null, levelResult: null });   // start on the world map
  bus.emit('cmd:open-campaign');
}
/** Leave the journey back to the main menu. */
export const exitCampaign = () => bus.emit('cmd:exit-campaign');
export const openIsland = (biome: BiomeId) => setModal({ island: biome });
export const closeIsland = () => setModal({ island: null });
export const openLevelStart = (levelId: string) => setModal({ levelStart: levelId });
export const closeLevelStart = () => setModal({ levelStart: null });
export const closeLevelResult = () => setModal({ levelResult: null });

/** Sync stored energy to real time (call when the map opens so the meter is fresh). */
export function syncEnergy(nowTs: number): void {
  const e = progressStore.get().energy;
  progressStore.set({ energy: regenEnergy(e, nowTs) });
}

/** Spend one life and launch the level; no-op (returns false) when out of energy. */
export function startLevel(levelId: string, nowTs: number): boolean {
  const e = regenEnergy(progressStore.get().energy, nowTs);
  if (e.current <= 0) { progressStore.set({ energy: e }); return false; }
  progressStore.set({ energy: spendEnergy(e, nowTs) });
  // Close the start sheet; keep `island` so we return to the island view after the level.
  setModal({ levelStart: null, levelResult: null });
  bus.emit('cmd:play-campaign-level', { levelId });
  return true;
}

/** Record the result (rewards + unlocks) and open the result modal. */
export function finishLevel(levelId: string, result: LevelResult): void {
  const r = recordCampaignResult(levelId, result);
  syncProgressLeaderboards();   // stars + XP changed → push journeyStars / totalScore boards
  setModal({ levelResult: { levelId, won: result.won, ...r } });
}

/** Full refill for pearls at the current (doubling) day price; false when unaffordable. */
export function refillEnergyWithPearls(nowTs: number): boolean {
  return buyEnergyRefill(nowTs);
}
