import Phaser from 'phaser';
import { C, SYMBOL_COLORS, TEX_W, TEX_H } from '../constants';
import { CUSTOM_ASSETS, SYMBOLS } from '../assets-config';

export class BootScene extends Phaser.Scene {
  private failedKeys = new Set<string>();

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.failedKeys.add(file.key);
    });

    if (CUSTOM_ASSETS.bg) {
      this.load.image('bg', 'assets/bg.png');
      this.load.image('bg-game', 'assets/bg-game.png');
    }
    if (CUSTOM_ASSETS.cardBack) {
      this.load.image('card-back', 'assets/cards/back.png');
    }
    if (CUSTOM_ASSETS.cardFaces) {
      SYMBOLS.forEach((sym) => this.load.image(`card-${sym}`, `assets/cards/${sym}.png`));
    }
  }

  create() {
    // Generate fallback textures for anything not loaded from files
    if (!CUSTOM_ASSETS.cardBack || this.failedKeys.has('card-back')) {
      this.generateCardBack();
    }
    SYMBOLS.forEach((sym, i) => {
      const key = `card-${sym}`;
      if (!CUSTOM_ASSETS.cardFaces || this.failedKeys.has(key)) {
        this.generateCardFront(sym, SYMBOL_COLORS[i]);
      }
    });

    this.scene.start('MenuScene');
  }

  // ── Card back: ocean dark with wave pattern ──────────────────────────────────
  private generateCardBack() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Base
    g.fillStyle(C.bgMid);
    g.fillRoundedRect(0, 0, TEX_W, TEX_H, 10);

    // Subtle wave lines
    g.lineStyle(1, C.ocean, 0.6);
    for (let row = 1; row < 8; row++) {
      const y = (TEX_H / 8) * row;
      g.beginPath();
      for (let x = 0; x <= TEX_W; x += 2) {
        const wy = y + Math.sin((x / TEX_W) * Math.PI * 4) * 2.5;
        x === 0 ? g.moveTo(x, wy) : g.lineTo(x, wy);
      }
      g.strokePath();
    }

    // Teal border
    g.lineStyle(2, C.teal, 0.7);
    g.strokeRoundedRect(2, 2, TEX_W - 4, TEX_H - 4, 8);

    // Center anchor-like dot
    g.fillStyle(C.teal, 0.3);
    g.fillCircle(TEX_W / 2, TEX_H / 2, 10);
    g.lineStyle(1, C.teal, 0.5);
    g.strokeCircle(TEX_W / 2, TEX_H / 2, 10);

    g.generateTexture('card-back', TEX_W, TEX_H);
    g.destroy();
  }

  // ── Card front: white card with colored symbol ───────────────────────────────
  private generateCardFront(symbol: string, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Card background
    g.fillStyle(0xf0fff8); // warm greenish white — coastal
    g.fillRoundedRect(0, 0, TEX_W, TEX_H, 10);
    g.lineStyle(3, color);
    g.strokeRoundedRect(2, 2, TEX_W - 4, TEX_H - 4, 8);

    // Symbol in center
    g.fillStyle(color);
    this.drawSymbol(g, symbol, TEX_W / 2, TEX_H / 2, 26);

    g.generateTexture(`card-${symbol}`, TEX_W, TEX_H);
    g.destroy();
  }

  private drawSymbol(g: Phaser.GameObjects.Graphics, symbol: string, cx: number, cy: number, s: number) {
    switch (symbol) {
      case 'star':
        this.drawStar(g, cx, cy, 5, s, s * 0.45);
        break;
      case 'heart':
        g.fillCircle(cx - s * 0.5, cy - s * 0.22, s * 0.52);
        g.fillCircle(cx + s * 0.5, cy - s * 0.22, s * 0.52);
        g.fillTriangle(cx - s * 1.02, cy - s * 0.1, cx + s * 1.02, cy - s * 0.1, cx, cy + s * 0.92);
        break;
      case 'diamond':
        g.fillPoints(
          [{ x: cx, y: cy - s }, { x: cx + s * 0.65, y: cy }, { x: cx, y: cy + s }, { x: cx - s * 0.65, y: cy }],
          true
        );
        break;
      case 'moon':
        g.fillCircle(cx, cy, s * 0.75);
        g.fillStyle(0xf0fff8);
        g.fillCircle(cx + s * 0.32, cy - s * 0.1, s * 0.55);
        break;
      case 'sun':
        g.fillCircle(cx, cy, s * 0.48);
        for (let a = 0; a < 360; a += 45) {
          const r = (a * Math.PI) / 180;
          g.lineStyle(3, g.defaultFillColor);
          g.lineBetween(
            cx + Math.cos(r) * s * 0.56, cy + Math.sin(r) * s * 0.56,
            cx + Math.cos(r) * s * 0.9,  cy + Math.sin(r) * s * 0.9
          );
        }
        break;
      case 'cloud':
        g.fillCircle(cx - s * 0.32, cy + s * 0.18, s * 0.42);
        g.fillCircle(cx + s * 0.32, cy + s * 0.18, s * 0.42);
        g.fillCircle(cx, cy - s * 0.08, s * 0.52);
        g.fillCircle(cx - s * 0.6, cy + s * 0.28, s * 0.32);
        g.fillCircle(cx + s * 0.6, cy + s * 0.28, s * 0.32);
        break;
      case 'bolt':
        g.fillPoints(
          [
            { x: cx + s * 0.2, y: cy - s }, { x: cx - s * 0.15, y: cy - s * 0.05 },
            { x: cx + s * 0.22, y: cy - s * 0.05 }, { x: cx - s * 0.2, y: cy + s },
            { x: cx + s * 0.15, y: cy + s * 0.05 }, { x: cx - s * 0.22, y: cy + s * 0.05 },
          ],
          true
        );
        break;
      case 'leaf':
        g.fillEllipse(cx, cy, s * 1.2, s * 1.8, 32);
        g.lineStyle(2, 0xf0fff8, 0.6);
        g.lineBetween(cx, cy - s * 0.8, cx, cy + s * 0.8);
        break;
      case 'circle':
        g.lineStyle(s * 0.35, g.defaultFillColor);
        g.strokeCircle(cx, cy, s * 0.58);
        break;
      case 'cross':
        g.fillRect(cx - s * 0.18, cy - s, s * 0.36, s * 2);
        g.fillRect(cx - s, cy - s * 0.18, s * 2, s * 0.36);
        break;
    }
  }

  private drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, n: number, outer: number, inner: number) {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < n * 2; i++) {
      const angle = (i * Math.PI) / n - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    g.fillPoints(pts, true);
  }
}