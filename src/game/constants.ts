// ── Ocean theme color palette ─────────────────────────────────────────────────
export const C = {
  bgDark:  0x071528, // Deep ocean — main background
  bgMid:   0x0d2137, // Ocean mid — panels, card backs
  ocean:   0x1b4965, // Ocean blue — inactive buttons, borders
  teal:    0x00b4d8, // Bright teal — selected state, highlights
  foam:    0xade8f4, // Sea foam — light text, soft accents
  coral:   0xff6b6b, // Coral reef — primary accent
  gold:    0xffd166, // Sandy gold — scores, victory
  dim:     0x4d6680, // Muted blue-grey — secondary text
  white:   0xffffff,
};

// Per-symbol border/shape colors (10 ocean-themed shades)
export const SYMBOL_COLORS: number[] = [
  0xffd166, // star     — golden sand
  0xff6b6b, // heart    — coral
  0x48cae4, // diamond  — ocean teal
  0x5390d9, // moon     — deep sky
  0xf77f00, // sun      — sunset orange
  0xade8f4, // cloud    — sea foam
  0x00b4d8, // bolt     — electric ocean
  0x52b788, // leaf     — seaweed green
  0x9b5de5, // circle   — anemone purple
  0xff9e00, // cross    — amber
];

// Texture dimensions for generated card graphics
export const TEX_W = 90;
export const TEX_H = 120;

// Fixed header height (px) — shared between GameScene and UIScene
export const HEADER_H = 56;