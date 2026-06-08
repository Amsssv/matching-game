import Phaser from 'phaser';
import { UI, clamp } from './config';

// ── Types ─────────────────────────────────────────────────────────────────────

type DeepState = 'active' | 'hover' | 'inactive';

// ── Internal: gradient CanvasTexture cache ────────────────────────────────────

function gradTexture(
  scene: Phaser.Scene,
  w: number, h: number, radius: number,
  state: DeepState,
): string {
  const key = `gbt_${state}_${w}_${h}_${radius}`;
  if (scene.textures.exists(key)) return key;

  const variantConfig = UI.button.variants.primary;
  const [from, to] =
    state === 'active' ? variantConfig.gradActive :
    state === 'hover'  ? variantConfig.gradHover  :
                         variantConfig.gradInact;

  const tex = scene.textures.createCanvas(key, w, h) as Phaser.Textures.CanvasTexture;
  const context = tex.getContext();

  context.beginPath();
  context.moveTo(radius, 0);        context.lineTo(w - radius, 0);
  context.arcTo(w, 0, w, radius, radius);  context.lineTo(w, h - radius);
  context.arcTo(w, h, w - radius, h, radius); context.lineTo(radius, h);
  context.arcTo(0, h, 0, h - radius, radius); context.lineTo(0, radius);
  context.arcTo(0, 0, radius, 0, radius);
  context.closePath();
  context.clip();

  const gradient = context.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  context.fillStyle = gradient;
  context.fillRect(0, 0, w, h);

  context.strokeStyle = `rgba(255,255,255,${state === 'active' ? 0.15 : 0.10})`;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(radius, 1.5);
  context.lineTo(w - radius, 1.5);
  context.stroke();

  tex.refresh();
  return key;
}

// ── preWarmGradients ──────────────────────────────────────────────────────────

/**
 * Pre-generates gradient CanvasTextures for the button sizes that MenuScene
 * will use at the given viewport dimensions. Call this before MenuScene.create()
 * so the first frame has no lazy-texture hitch.
 */
export function preWarmGradients(scene: Phaser.Scene, W: number, H: number): void {
  const gap           = clamp(Math.floor(W * 0.015), 8, 16);
  const buttonWidth   = clamp(Math.floor((W * 0.92 - gap * 3) / 4), 70, 160);
  const buttonHeight  = Math.max(64, clamp(Math.floor(H * 0.1), 60, 88));
  const sectionHeight = clamp(Math.floor(H * 0.065), 36, 48);
  const sectionWidth  = clamp(Math.floor(W * 0.38), 120, 180);
  const panelWidth    = clamp(Math.floor(W * 0.5), 180, 280);
  const panelHeight   = clamp(Math.floor(H * 0.08), 44, 58);
  const radius        = UI.button.radius;
  const states: DeepState[] = ['active', 'hover', 'inactive'];
  for (const [w, h] of [[buttonWidth, buttonHeight], [sectionWidth, sectionHeight], [panelWidth, panelHeight]] as [number, number][]) {
    for (const state of states) {
      gradTexture(scene, w, h, radius, state);
    }
  }
}
