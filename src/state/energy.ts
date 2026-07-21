import type { EnergyState } from './progress';

export const REGEN_MS = 25 * 60 * 1000; // 25 minutes per life
export const MAX_ENERGY = 10;           // hard ceiling on the life cap (grows via level-ups)

/** Recompute current energy from elapsed real time. Pure; call before reading/spending. */
export function regenEnergy(e: EnergyState, nowTs: number): EnergyState {
  if (e.current >= e.max) return { ...e, lastRegenTs: nowTs };
  const base = e.lastRegenTs ?? nowTs;
  const elapsed = Math.max(0, nowTs - base);
  const gained = Math.floor(elapsed / REGEN_MS);
  if (gained <= 0) return e;
  const current = Math.min(e.max, e.current + gained);
  // If now full, anchor to now; else preserve the sub-window remainder.
  const lastRegenTs = current >= e.max ? nowTs : base + gained * REGEN_MS;
  return { ...e, current, lastRegenTs };
}

/** Regenerate, then consume one life (floored at 0). */
export function spendEnergy(e: EnergyState, nowTs: number): EnergyState {
  const r = regenEnergy(e, nowTs);
  return { ...r, current: Math.max(0, r.current - 1) };
}

/** Regenerate, then add `amount` (default: fill to max), capped at max. */
export function refillEnergy(e: EnergyState, nowTs: number, amount?: number): EnergyState {
  const r = regenEnergy(e, nowTs);
  const current = amount === undefined ? r.max : Math.min(r.max, r.current + amount);
  return { ...r, current };
}

/**
 * Level-up reward: regenerate, raise the cap by `levels` (never above MAX_ENERGY),
 * and grant the same number of lives to `current` — so the new life is felt now,
 * not only after a 25-minute regen. At the cap it's a no-op beyond the regen.
 */
export function grantLevelUpEnergy(e: EnergyState, levels: number, nowTs: number): EnergyState {
  const r = regenEnergy(e, nowTs);
  if (levels <= 0) return r;
  const max = Math.min(MAX_ENERGY, r.max + levels);
  const delta = max - r.max;
  return { ...r, max, current: Math.min(max, r.current + delta) };
}

/** Milliseconds until the next life regenerates (0 when full). */
export function msToNextEnergy(e: EnergyState, nowTs: number): number {
  if (e.current >= e.max) return 0;
  const base = e.lastRegenTs ?? nowTs;
  const intoWindow = Math.max(0, nowTs - base) % REGEN_MS;
  return REGEN_MS - intoWindow;
}
