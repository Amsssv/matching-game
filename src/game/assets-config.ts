// ── Custom Asset Configuration ────────────────────────────────────────────────
//
// Steps to use your own images:
//   1. Place files in the public/assets/ directory (see structure below)
//   2. Set the corresponding flag to `true`
//   3. Restart the dev server
//
// public/assets/
//   bg.png                ← background image (any resolution, will be scaled)
//   cards/
//     back.png            ← card back (recommended: 270×360 px, 3:4 ratio)
//     star.png            ← card face images (same size as back)
//     heart.png
//     diamond.png
//     moon.png
//     sun.png
//     cloud.png
//     bolt.png
//     leaf.png
//     circle.png          ← used only in HARD mode
//     cross.png           ← used only in HARD mode
// ─────────────────────────────────────────────────────────────────────────────

export const CUSTOM_ASSETS = {
  /** Use your own background. File: public/assets/bg.png */
  bg: true,

  /** Use your own card back. File: public/assets/cards/back.png */
  cardBack: true,

  /** Use your own card face images. Files: public/assets/cards/<symbol>.png */
  cardFaces: true,
};

// Internal: all symbol keys
export const SYMBOLS = [
  'octopus', 'crab', 'clownfish', 'surgeonfish', 'jellyfish',
  'turtle', 'seahorse', 'stingray', 'lobster', 'starfish',
  'whale', 'pufferfish', 'shark', 'eel', 'coral',
] as const;

export type SymbolKey = typeof SYMBOLS[number];