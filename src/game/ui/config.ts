import { getLocalDpr } from '../device';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

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

  // ── Buttons ─────────────────────────────────────────────────────────────────
  button: {
    radius: 16,

    variants: {
      /**
       * Primary — deep ocean gradient. Source for the pre-warmed button
       * gradient CanvasTextures (see ui/factory preWarmGradients / gradTexture).
       */
      primary: {
        gradActive: ['rgba(10,61,122,0.92)', 'rgba(1,40,106,0.95)'] as [string, string],
        gradHover:  ['rgba(2,52,122,0.87)',  'rgba(1,35,88,0.90)']  as [string, string],
        gradInact:  ['rgba(1,40,106,0.82)',  'rgba(1,29,74,0.85)']  as [string, string],
      },
    },
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
