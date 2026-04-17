import Phaser from 'phaser';
import { UI, clamp } from './config';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = keyof typeof UI.button.variants;
type DeepState = 'active' | 'hover' | 'inactive';

export interface ButtonHandle {
  container: Phaser.GameObjects.Container;
  /** Toggle the active/selected visual state */
  setActive(active: boolean): void;
  /** Replace the button's label text */
  setLabel(text: string): void;
}

export interface CreateButtonOpts {
  x: number;
  y: number;
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  /** Initial active/selected state (default false) */
  active?: boolean;
  /** Second line of text — rendered below the label (primary variant only) */
  description?: string;
  /** Skip text-based width calculation and use this value instead */
  fixedWidth?: number;
  /** Skip text-based height calculation and use this value instead */
  fixedHeight?: number;
  /** Font size in px; defaults to 16 × localDpr */
  fontSize?: number;
  /**
   * When active, skip expanding the gradient background by 5%.
   * Pass true for the play button (container tween handles scale instead).
   */
  noAutoScale?: boolean;
}

export interface CreatePanelOpts {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface CreateTextOpts {
  x: number;
  y: number;
  text: string;
  /** Key from UI.text — determines font, color, shadow, gradient, depth, etc. */
  variant: keyof typeof UI.text;
  localDpr: number;
  /** Override the computed font size (baseFontSize × localDpr) */
  fontSize?: number;
  /** Override the variant's color */
  color?: string;
  /** Canvas width — required for variants with maxWidthRatio */
  W?: number;
}

/** Options for createTitle / createSubtitle (responsive sizing needs H, cssW). */
export interface CreateTitleOpts {
  x: number;
  y: number;
  text: string;
  /** Canvas height — used for responsive font sizing */
  H: number;
  /** Canvas width — used for overflow clamping */
  W: number;
  /** CSS-pixel viewport width — used for mobile breakpoint */
  cssW: number;
  localDpr: number;
}

export interface CreateIconButtonOpts {
  lx: number;
  ly: number;
  w: number;
  h: number;
  label: string;
  onClick: (() => void) | null;
  active: boolean;
  depth?: number;
}

// ── Internal: gradient CanvasTexture cache ────────────────────────────────────

function gradTexture(
  scene: Phaser.Scene,
  w: number, h: number, r: number,
  state: DeepState,
): string {
  const key = `gbt_${state}_${w}_${h}_${r}`;
  if (scene.textures.exists(key)) return key;

  const vcfg = UI.button.variants.primary;
  const [from, to] =
    state === 'active' ? vcfg.gradActive :
    state === 'hover'  ? vcfg.gradHover  :
                         vcfg.gradInact;

  const tex = scene.textures.createCanvas(key, w, h) as Phaser.Textures.CanvasTexture;
  const ctx = tex.getContext();

  ctx.beginPath();
  ctx.moveTo(r, 0);        ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r); ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r); ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.clip();

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = `rgba(255,255,255,${state === 'active' ? 0.15 : 0.10})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r, 1.5);
  ctx.lineTo(w - r, 1.5);
  ctx.stroke();

  tex.refresh();
  return key;
}

// ── Internal: draw helpers ────────────────────────────────────────────────────

function drawDeep(
  scene:    Phaser.Scene,
  bg:       Phaser.GameObjects.Graphics,
  fillImg:  Phaser.GameObjects.Image,
  x: number, y: number, w: number, h: number,
  r:        number,
  state:    DeepState,
  noAutoScale: boolean,
): void {
  bg.clear();
  const isMobile = scene.scale.width < 768;
  const sc = (!noAutoScale && state === 'active') ? (isMobile ? 1.02 : 1.05) : 1;
  const sw = Math.round(w * sc), sh = Math.round(h * sc);
  const sx = Math.round(x - (sw - w) / 2), sy = Math.round(y - (sh - h) / 2);
  const sr = Math.round(r * sc);

  const key = gradTexture(scene, sw, sh, sr, state);
  fillImg.setTexture(key).setDisplaySize(sw, sh).setPosition(x + w / 2, y + h / 2);

  const bColor = UI.button.variants.primary.borderColor;
  const bAlpha = state === 'active' ? 0.5 : state === 'hover' ? 0.35 : 0.2;
  bg.lineStyle(1, bColor, bAlpha);
  bg.strokeRoundedRect(sx, sy, sw, sh, sr);

  if (state === 'active') {
    bg.lineStyle(2, bColor, 0.7);
    bg.strokeRoundedRect(sx - 3, sy - 3, sw + 6, sh + 6, sr + 2);
  }
}

interface FlatCfg { bg: number; bgHover: number; border: number }

function drawFlat(
  bg:    Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  r:     number,
  state: DeepState,
  cfg:   FlatCfg,
): void {
  bg.clear();
  bg.fillStyle(state === 'hover' ? cfg.bgHover : cfg.bg);
  bg.fillRoundedRect(x, y, w, h, r);
  bg.lineStyle(1, cfg.border);
  bg.strokeRoundedRect(x, y, w, h, r);
}

// ── preWarmGradients ──────────────────────────────────────────────────────────

/**
 * Pre-generates gradient CanvasTextures for the button sizes that MenuScene
 * will use at the given viewport dimensions. Call this before MenuScene.create()
 * so the first frame has no lazy-texture hitch.
 */
export function preWarmGradients(scene: Phaser.Scene, W: number, H: number): void {
  const gap  = clamp(Math.floor(W * 0.015), 8, 16);
  const btnW = clamp(Math.floor((W * 0.92 - gap * 3) / 4), 70, 160);
  const btnH = Math.max(64, clamp(Math.floor(H * 0.1), 60, 88));
  const sH   = clamp(Math.floor(H * 0.065), 36, 48);
  const sW   = clamp(Math.floor(W * 0.38), 120, 180);
  const pW   = clamp(Math.floor(W * 0.5), 180, 280);
  const pH   = clamp(Math.floor(H * 0.08), 44, 58);
  const r    = UI.button.radius;
  const states: DeepState[] = ['active', 'hover', 'inactive'];
  for (const [w, h] of [[btnW, btnH], [sW, sH], [pW, pH]] as [number, number][]) {
    for (const state of states) {
      gradTexture(scene, w, h, r, state);
    }
  }
}

// ── createButton ──────────────────────────────────────────────────────────────

export function createButton(
  scene: Phaser.Scene,
  opts:  CreateButtonOpts,
): ButtonHandle {
  const {
    x, y, label, onClick,
    variant = 'primary',
    active:     initActive = false,
    description,
    fixedWidth,
    fixedHeight,
    noAutoScale = false,
  } = opts;

  const vcfg     = UI.button.variants[variant];
  const bc       = UI.button;
  const localDpr = Math.min(window.devicePixelRatio || 1, 2);
  const fontSize = opts.fontSize ?? Math.round(16 * localDpr);

  // ── Measure texts ────────────────────────────────────────────────────────
  const tmpLbl = scene.add.text(0, 0, label, {
    fontSize: `${fontSize}px`, fontFamily: UI.font.body, fontStyle: 'bold',
  }).setVisible(false);

  let tmpDesc: Phaser.GameObjects.Text | undefined;
  if (description) {
    const descSz = clamp(Math.round(fontSize * 0.75), 8, 14);
    tmpDesc = scene.add.text(0, 0, description, {
      fontSize: `${descSz}px`, fontFamily: UI.font.body,
    }).setVisible(false);
  }

  const labelH = tmpLbl.height;
  const descH  = tmpDesc?.height ?? 0;
  const gap    = descH > 0 ? 6 : 0;

  const w = fixedWidth  ?? Math.max(tmpLbl.width + bc.paddingX * 2, bc.minWidth);
  const h = fixedHeight ?? (labelH + descH + gap + bc.paddingY * 2);

  tmpLbl.destroy();
  tmpDesc?.destroy();

  // ── State ────────────────────────────────────────────────────────────────
  let isActive = initActive;
  let isHover  = false;

  // ── Visual layers ────────────────────────────────────────────────────────
  let fillImg: Phaser.GameObjects.Image | undefined;
  if (vcfg.style === 'deep') {
    fillImg = scene.add.image(0, 0, '__DEFAULT').setOrigin(0.5);
  }
  const bg = scene.add.graphics();

  const totalTextH = labelH + gap + descH;
  const lblY = descH > 0 ? -(totalTextH / 2 - labelH / 2) : 0;
  const lbl  = scene.add.text(0, lblY, label, {
    fontSize: `${fontSize}px`,
    color:    vcfg.text,
    fontFamily: UI.font.body,
    fontStyle:  'bold',
  }).setOrigin(0.5);

  let descTxt: Phaser.GameObjects.Text | undefined;
  if (description) {
    const descSz = clamp(Math.round(fontSize * 0.75), 8, 14);
    const descY  = totalTextH / 2 - descH / 2;
    descTxt = scene.add.text(0, descY, description, {
      fontSize: `${descSz}px`,
      color: '#ffffffb3',
      fontFamily: UI.font.body,
    }).setOrigin(0.5);
  }

  const children: Phaser.GameObjects.GameObject[] = [];
  if (fillImg) children.push(fillImg);
  children.push(bg, lbl);
  if (descTxt) children.push(descTxt);

  const container = scene.add.container(x, y, children);
  container.setSize(w, h).setInteractive();

  // ── Redraw ───────────────────────────────────────────────────────────────
  const draw = () => {
    const state: DeepState = isActive ? 'active' : isHover ? 'hover' : 'inactive';
    if (vcfg.style === 'deep') {
      drawDeep(scene, bg, fillImg!, -w / 2, -h / 2, w, h, bc.radius, state, noAutoScale);
    } else {
      drawFlat(bg, -w / 2, -h / 2, w, h, bc.radius, state, vcfg as unknown as FlatCfg);
    }
  };
  draw();

  // ── Hover / click ─────────────────────────────────────────────────────────
  const isDeep = vcfg.style === 'deep';
  container.on('pointerover', () => {
    if (!isActive) { isHover = true; draw(); }
    if (isDeep) {
      scene.tweens.killTweensOf(container);
      scene.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Cubic.easeOut' });
    }
  });
  container.on('pointerout', () => {
    if (!isActive) { isHover = false; draw(); }
    if (isDeep) {
      scene.tweens.killTweensOf(container);
      scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150, ease: 'Cubic.easeOut' });
    }
  });
  container.on('pointerdown', () => onClick());

  return {
    container,
    setActive(active: boolean) {
      isActive = active;
      isHover  = false;
      draw();
      if (isDeep) {
        scene.tweens.killTweensOf(container);
        scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150, ease: 'Cubic.easeOut' });
      }
    },
    setLabel(text: string) { lbl.setText(text); },
  };
}

// ── createPanel ───────────────────────────────────────────────────────────────

export function createPanel(
  scene: Phaser.Scene,
  opts:  CreatePanelOpts,
): Phaser.GameObjects.Graphics {
  const { cx, cy, w, h } = opts;
  const p = UI.panel;
  const g = scene.add.graphics();
  g.fillStyle(p.bg);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, p.radius);
  g.lineStyle(p.borderWidth, p.border, p.borderAlpha);
  g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, p.radius);
  return g;
}

// ── createText ────────────────────────────────────────────────────────────────

/**
 * Renders a text object using a named style from UI.text.
 * Supports gradient fill, depth, and proportional scale-down for overflow.
 */
export function createText(
  scene: Phaser.Scene,
  opts:  CreateTextOpts,
): Phaser.GameObjects.Text {
  const { x, y, text, variant, localDpr, W } = opts;
  const style = UI.text[variant];
  const sz    = opts.fontSize ?? (style.baseFontSize ? Math.round(style.baseFontSize * localDpr) : 16);

  const t = scene.add.text(x, y, text, {
    fontSize:   `${sz}px`,
    color:      opts.color ?? style.color,
    fontFamily: style.fontFamily,
    fontStyle:  style.fontStyle ?? 'normal',
    ...('shadow'  in style && style.shadow  ? { shadow:  style.shadow  } : {}),
    ...('padding' in style && style.padding ? { padding: style.padding } : {}),
  }).setOrigin(0.5);

  if ('letterSpacingRatio' in style && style.letterSpacingRatio) {
    t.setLetterSpacing(Math.round(sz * style.letterSpacingRatio));
  }
  if ('depth' in style && style.depth !== undefined) {
    t.setDepth(style.depth);
  }
  if ('gradient' in style && style.gradient) {
    const ctx = t.canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, t.canvas.height);
      g.addColorStop(0, style.gradient[0]);
      g.addColorStop(1, style.gradient[1]);
      t.setFill(g as unknown as string);
    }
  }
  if ('maxWidthRatio' in style && style.maxWidthRatio && W) {
    const maxW = W * style.maxWidthRatio;
    if (t.width > maxW) t.setScale(maxW / t.width);
  }

  return t;
}

// ── createTitle / createSubtitle ──────────────────────────────────────────────

/** Responsive display title — delegates to createText('title') after computing font size. */
export function createTitle(
  scene: Phaser.Scene,
  opts:  CreateTitleOpts,
): Phaser.GameObjects.Text {
  const { x, y, text, H, W, cssW, localDpr } = opts;
  const maxSz   = cssW < 600 ? 28 * localDpr : 56;
  const fontSize = clamp(Math.floor(H * 0.075), 14, maxSz);
  return createText(scene, { x, y, text, variant: 'title', localDpr, fontSize, W });
}

/** Responsive subtitle — delegates to createText('subtitle') after computing font size. */
export function createSubtitle(
  scene: Phaser.Scene,
  opts:  CreateTitleOpts,
): Phaser.GameObjects.Text {
  const { x, y, text, H, W, cssW, localDpr } = opts;
  const maxSz    = cssW < 600 ? 14 * localDpr : 28;
  const fontSize = clamp(Math.floor(H * 0.05), 10, maxSz);
  return createText(scene, { x, y, text, variant: 'subtitle', localDpr, fontSize, W });
}

// ── createIconButton ──────────────────────────────────────────────────────────

/**
 * Small square/rectangle button for icon grids (e.g. language selector).
 * Positioned by top-left corner.
 * Set onClick to null for the currently-active button (non-interactive).
 */
export function createIconButton(
  scene: Phaser.Scene,
  opts:  CreateIconButtonOpts,
): void {
  const { lx, ly, w, h, label, onClick, active, depth = 5 } = opts;
  const C   = UI.colors;
  const bg  = scene.add.graphics().setDepth(depth);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  bg.fillStyle(active ? C.primary : C.bgMid, active ? 1 : 0.8);
  bg.fillRoundedRect(lx, ly, w, h, 5);
  bg.lineStyle(1, active ? C.primary : C.border);
  bg.strokeRoundedRect(lx, ly, w, h, 5);

  scene.add.text(lx + w / 2, ly + h / 2, label.toUpperCase(), {
    fontSize:   `${Math.round(10 * dpr)}px`,
    color:      '#ffffff',
    fontFamily: UI.font.body,
    fontStyle:  'bold',
  }).setOrigin(0.5).setDepth(depth);

  if (!active && onClick) {
    scene.add
      .zone(lx + w / 2, ly + h / 2, w, h)
      .setInteractive()
      .setDepth(depth)
      .on('pointerdown', onClick);
  }
}