// Device pixel ratio — capped at 2 to limit memory on 3x screens
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

// Texture dimensions for generated card graphics (scaled for device sharpness)
export const TEX_W = Math.round(90 * DPR);
export const TEX_H = Math.round(120 * DPR);