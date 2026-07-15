import type { Difficulty } from './layout';

export type GameMode = 'classic' | 'timeAttack' | 'survival' | 'noMistakes';

export const MODE_ORDER: readonly GameMode[] = ['classic', 'timeAttack', 'survival', 'noMistakes'];

/** Player level required to start a mode (levelFromXp(stats.xp).level >= this). */
export const MODE_UNLOCK: Record<GameMode, number> = { classic: 1, timeAttack: 2, survival: 4, noMistakes: 7 };

export const MODE_EMOJI: Record<GameMode, string> = {
  classic: '🌊', timeAttack: '⏳', survival: '🛡️', noMistakes: '🎯',
};

// Reward multipliers are PER-CELL: noMistakes-easy (12 cards fully previewed) is
// objectively easier than classic-easy and must not pay the full ×2.
export const PEARL_MULT: Record<GameMode, Record<Difficulty, number>> = {
  classic:    { easy: 1,    medium: 1,    hard: 1,    expert: 1 },
  timeAttack: { easy: 1.5,  medium: 1.5,  hard: 1.5,  expert: 1.5 },
  survival:   { easy: 1.75, medium: 1.75, hard: 1.75, expert: 1.75 },
  noMistakes: { easy: 1.25, medium: 1.5,  hard: 1.75, expert: 2 },
};
// Same values in v1; a separate name so pearls/XP can be decoupled later.
export const XP_MULT: Record<GameMode, Record<Difficulty, number>> = PEARL_MULT;

export interface TimeAttackCfg { startSec: number; bonusSec: number }

export const TIME_ATTACK: Record<Difficulty, TimeAttackCfg> = {
  easy:   { startSec: 10, bonusSec: 3 },
  medium: { startSec: 15, bonusSec: 4 },
  hard:   { startSec: 20, bonusSec: 5 },
  expert: { startSec: 30, bonusSec: 6 },
};

/** noMistakes: seconds all cards stay face-up before play begins. Max 10 (user decision). */
export const PREVIEW_SEC: Record<Difficulty, number> = { easy: 5, medium: 7, hard: 9, expert: 10 };

/** Seconds left in a timeAttack game. Clamped ≥ 0 — the HUD formats this directly. */
export function timeAttackRemaining(elapsedSec: number, matchedPairs: number, cfg: TimeAttackCfg): number {
  return Math.max(0, cfg.startSec + cfg.bonusSec * matchedPairs - elapsedSec);
}

/** e2e hook: `registry.get('modeTestOverrides')` — e2e can only patch the registry,
 * not ES-module consts. Read once in GameScene/UIScene create(). */
export interface ModeTestOverrides {
  timeAttackStartSec?: number;
  timeAttackBonusSec?: number;
  previewSec?: number;
}
