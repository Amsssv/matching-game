// ── Ocean theme color palette ─────────────────────────────────────────────────
export const C = {
  bgDark:  0x001428, // Deep navy — overlays, header bg
  bgMid:   0x002244, // Navy blue — panels, unselected buttons
  ocean:   0x1565c0, // Medium blue — inactive borders
  teal:    0x0d47a1, // Deep blue — active state, play button
  foam:    0xffffff, // White — primary text
  coral:   0xff6b6b, // Coral reef — primary accent
  gold:    0xf7d077, // Sandy gold — scores, victory
  dim:     0x334466, // Muted navy — secondary text
  white:   0xffffff,
};



// Device pixel ratio — capped at 2 to limit memory on 3x screens
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

// Texture dimensions for generated card graphics (scaled for device sharpness)
export const TEX_W = Math.round(90 * DPR);
export const TEX_H = Math.round(120 * DPR);

// Fixed header height (px) — shared between GameScene and UIScene
export const HEADER_H = Math.round(56 * DPR);