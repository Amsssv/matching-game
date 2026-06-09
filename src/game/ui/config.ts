import { getLocalDpr } from '../device';

// ── Raw palette — internal, not exported directly ─────────────────────────────

const palette = {
  navy: 0x001428,  // deepest background
} as const;

// ── Design tokens ─────────────────────────────────────────────────────────────

export const UI = {

  // ── Semantic colors ─────────────────────────────────────────────────────────
  colors: {
    bgDark: palette.navy,  // Phaser scene backgroundColor (src/game/config.ts)
  },

  // ── Layout ───────────────────────────────────────────────────────────────────
  layout: {
    /** Header bar height in game pixels (= 56 CSS px × DPR). */
    get headerHeight() { return Math.round(56 * getLocalDpr()); },
  },

  // ── Animation durations (ms) ─────────────────────────────────────────────────
  animation: {
    /** Camera fadeIn / fadeOut between scenes */
    fadeScene:      300,
    /** Delay after 2nd card flip before checking match (lets card finish opening) */
    cardFlipDelay:  300,
    /** Delay between last pair found and game-complete event */
    cardMatchDelay: 600,
    /** Alpha yoyo duration for matched-pair flash */
    cardMatchFlash: 180,
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    radius:        12,
    hoverScale:    1.06,
    hoverDuration: 100,
    matchedAlpha:  0.45,
    flipDuration:  140,
    shadowAlpha:  0.39,
    shadowOffset: 4,
    borderColor:      0xC7C7C7 as number,
    borderWidth:      1.5,
  },

};
