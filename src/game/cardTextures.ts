import Phaser from 'phaser';
import { UI } from './ui/config';
import { SYMBOLS } from './assets-config';

const hex = (c: number) => '#' + (c & 0xffffff).toString(16).padStart(6, '0');

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x,     y + h, rr);
  ctx.arcTo(x,     y + h, x,     y,     rr);
  ctx.arcTo(x,     y,     x + w, y,     rr);
  ctx.closePath();
}

function addCanvas(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d')!;
  paint(ctx);
  scene.textures.addCanvas(key, canvas);
}

/** A rounded copy of a loaded image texture (no border). */
function bakeRounded(scene: Phaser.Scene, srcKey: string, dstKey: string, w: number, h: number, radius: number) {
  const src = scene.textures.get(srcKey).getSourceImage() as CanvasImageSource;
  addCanvas(scene, dstKey, w, h, (ctx) => {
    ctx.save();
    roundRectPath(ctx, 0, 0, w, h, radius);
    ctx.clip();
    ctx.drawImage(src, 0, 0, w, h);
    ctx.restore();
  });
}

/** Shared untinted gold rounded border (transparent interior). */
function bakeBorder(scene: Phaser.Scene, dstKey: string, w: number, h: number, radius: number) {
  const bw = UI.card.borderWidth;
  addCanvas(scene, dstKey, w, h, (ctx) => {
    ctx.lineWidth = bw;
    ctx.strokeStyle = hex(UI.card.borderColor);
    roundRectPath(ctx, bw / 2, bw / 2, w - bw, h - bw, Math.max(0, radius - bw / 2));
    ctx.stroke();
  });
}

/** Shared card-shaped drop shadow (rounded fill at shadowAlpha). */
function bakeShadow(scene: Phaser.Scene, dstKey: string, w: number, h: number, radius: number) {
  addCanvas(scene, dstKey, w, h, (ctx) => {
    ctx.fillStyle = `rgba(0,0,0,${UI.card.shadowAlpha})`;
    roundRectPath(ctx, 0, 0, w, h, radius);
    ctx.fill();
  });
}

/**
 * Bake all card textures at the given pixel size (re-call on resize). Replaces the
 * per-frame per-card geometry masks + Graphics with batchable image textures.
 * Keys: 'card-back-r', 'card-<symbol>-r', 'card-border-r', 'card-shadow-r'.
 */
export function bakeCardTextures(scene: Phaser.Scene, cardW: number, cardH: number): void {
  const r = UI.card.radius;
  bakeRounded(scene, 'card-back', 'card-back-r', cardW, cardH, r);
  for (const s of SYMBOLS) bakeRounded(scene, `card-${s}`, `card-${s}-r`, cardW, cardH, r);
  bakeBorder(scene, 'card-border-r', cardW, cardH, r);
  bakeShadow(scene, 'card-shadow-r', cardW, cardH, r);
}
