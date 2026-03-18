import Phaser from 'phaser';
import { C, HEADER_H } from '../constants';
import { CUSTOM_ASSETS, SYMBOLS } from '../assets-config';
import { getYSDK } from '../../ysdk';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

// Cards per row — outer rows smaller by 2 than middle rows
const DIFF_ROWS: Record<Difficulty, number[]> = {
  easy:   [2, 4, 4, 2],   // 12 cards, 6 pairs
  medium: [4, 6, 6, 4],   // 20 cards, 10 pairs
  hard:   [5, 7, 7, 5],   // 24 cards, 12 pairs
  expert: [6, 8, 8, 6],   // 28 cards, 14 pairs
};

const CARD_RADIUS = 12;

interface Card {
  container: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Image;
  front: Phaser.GameObjects.Image;
  maskGfx: Phaser.GameObjects.Graphics;
  symbol: string;
  index: number;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Layout {
  cardW: number;
  cardH: number;
  positions: { x: number; y: number }[];
}

export class GameScene extends Phaser.Scene {
  private cards: Card[] = [];
  private flippedCards: Card[] = [];
  private isLocked = false;
  private moves = 0;
  private matchedPairs = 0;
  totalPairs = 0;

  private rowWidths: number[] = [];
  private bgObj?: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cards = [];
    this.flippedCards = [];
    this.isLocked = false;
    this.moves = 0;
    this.matchedPairs = 0;

    const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
    this.rowWidths = DIFF_ROWS[difficulty];
    this.totalPairs = this.rowWidths.reduce((s, n) => s + n, 0) / 2;

    const W = this.scale.width;
    const H = this.scale.height;

    this.drawBackground(W, H);
    this.dealCards(W, H);

    this.scene.launch('UIScene', { gameScene: this });
    getYSDK()?.features.GameplayAPI?.start();
    this.cameras.main.fadeIn(300, 7, 21, 40);

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      this.cards.forEach(card => card.maskGfx.destroy());
    });
  }

  // ── Background ───────────────────────────────────────────────────────────────
  private drawBackground(W: number, H: number) {
    if (CUSTOM_ASSETS.bg && this.textures.exists('bg-game')) {
      const bgH = H - HEADER_H;
      this.bgObj = this.add.image(W / 2, HEADER_H + bgH / 2, 'bg-game').setDisplaySize(W, bgH);
      return;
    }
    const g = this.add.graphics();
    g.fillStyle(C.bgDark);
    g.fillRect(0, 0, W, H);
    // Subtle wave lines at bottom third
    g.lineStyle(1, C.teal, 0.06);
    for (let row = 0; row < 4; row++) {
      const y = H * 0.72 + row * 16;
      g.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const wy = y + Math.sin((x / W) * Math.PI * 5 + row * 0.8) * 3;
        x === 0 ? g.moveTo(x, wy) : g.lineTo(x, wy);
      }
      g.strokePath();
    }
    this.bgObj = g;
  }

  // ── Card layout calculation ──────────────────────────────────────────────────
  private calcLayout(W: number, H: number): Layout {
    const padH = Math.max(40, H * 0.09); // top (from header) and bottom padding
    const padW = Math.max(8, W * 0.02);
    const availW = W - padW * 2;
    const availH = H - HEADER_H - padH * 2;
    const numRows = this.rowWidths.length;
    const maxCols = Math.max(...this.rowWidths);

    const minGap = 8;
    let cardW = Math.floor((availW - (maxCols - 1) * minGap) / maxCols);
    let cardH = Math.round(cardW * (4 / 3));

    // Constrain by height
    const maxCardH = Math.floor((availH - (numRows - 1) * minGap) / numRows);
    if (cardH > maxCardH) {
      cardH = maxCardH;
      cardW = Math.round(cardH * (3 / 4));
    }

    cardH = Math.round(cardW * (4 / 3));

    const gapX = Math.min(Math.max(Math.floor((availW - maxCols * cardW) / Math.max(1, maxCols - 1)), minGap), 24);
    const gapY = Math.min(Math.max(Math.floor((availH - numRows * cardH) / Math.max(1, numRows - 1)), minGap), 24);

    const gridH = numRows * cardH + (numRows - 1) * gapY;
    const startY = HEADER_H + (availH - gridH) / 2 + padH + cardH / 2;

    // Build positions — each row centered individually
    const positions: { x: number; y: number }[] = [];
    this.rowWidths.forEach((cols, rowIdx) => {
      const rowW = cols * cardW + (cols - 1) * gapX;
      const rowStartX = (W - rowW) / 2 + cardW / 2;
      const y = startY + rowIdx * (cardH + gapY);
      for (let col = 0; col < cols; col++) {
        positions.push({ x: rowStartX + col * (cardW + gapX), y });
      }
    });

    return { cardW, cardH, positions };
  }

  // ── Deal cards ───────────────────────────────────────────────────────────────
  private dealCards(W: number, H: number) {
    const picked = [...SYMBOLS].slice(0, this.totalPairs);
    const symbolPool = Phaser.Utils.Array.Shuffle([...picked, ...picked]) as string[];

    const layout = this.calcLayout(W, H);

    symbolPool.forEach((symbol, i) => {
      const { x, y } = layout.positions[i];
      this.cards.push(this.createCard(x, y, symbol, i, layout.cardW, layout.cardH));
    });
  }

  private createCard(x: number, y: number, symbol: string, index: number, cardW: number, cardH: number): Card {
    const back  = this.add.image(0, 0, 'card-back').setDisplaySize(cardW, cardH);
    const front = this.add.image(0, 0, `card-${symbol}`).setDisplaySize(cardW, cardH).setVisible(false);

    const maskGfx = this.add.graphics();
    this.drawCardMask(maskGfx, x, y, cardW, cardH);

    const container = this.add.container(x, y, [back, front]);
    container.setSize(cardW, cardH).setInteractive();
    container.setMask(maskGfx.createGeometryMask());

    const card: Card = { container, back, front, maskGfx, symbol, index, isFlipped: false, isMatched: false };

    container.on('pointerover', () => {
      if (!card.isFlipped && !card.isMatched && !this.isLocked)
        this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 100 });
    });
    container.on('pointerout', () => {
      if (!card.isFlipped && !card.isMatched)
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    container.on('pointerdown', () => this.onCardClick(card));

    return card;
  }

  private drawCardMask(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    gfx.clear();
    gfx.fillStyle(0xffffff);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, CARD_RADIUS);
  }

  // ── Resize ───────────────────────────────────────────────────────────────────
  private onResize(gameSize: Phaser.Structs.Size) {
    const W = gameSize.width;
    const H = gameSize.height;

    // Reposition / rescale background
    if (this.bgObj instanceof Phaser.GameObjects.Image) {
      const bgH = H - HEADER_H;
      this.bgObj.setPosition(W / 2, HEADER_H + bgH / 2).setDisplaySize(W, bgH);
    } else if (this.bgObj instanceof Phaser.GameObjects.Graphics) {
      this.bgObj.destroy();
      this.drawBackground(W, H);
      this.bgObj.setDepth(-1);
    }

    // Relayout cards
    const layout = this.calcLayout(W, H);
    this.cards.forEach((card) => {
      const { x, y } = layout.positions[card.index];
      card.container.setPosition(x, y);
      card.container.setSize(layout.cardW, layout.cardH).setInteractive();
      card.back.setDisplaySize(layout.cardW, layout.cardH);
      card.front.setDisplaySize(layout.cardW, layout.cardH);
      this.drawCardMask(card.maskGfx, x, y, layout.cardW, layout.cardH);
    });
  }

  // ── Game logic ───────────────────────────────────────────────────────────────
  private onCardClick(card: Card) {
    if (this.isLocked || card.isFlipped || card.isMatched) return;
    if (this.flippedCards.length >= 2) return;

    this.flipCard(card, true);
    this.flippedCards.push(card);
    this.moves++;
    this.events.emit('moves-updated', this.moves);

    if (this.flippedCards.length === 2) {
      this.isLocked = true;
      this.time.delayedCall(800, () => this.checkMatch());
    }
  }

  private flipCard(card: Card, faceUp: boolean) {
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 140,
      ease: 'Linear',
      onComplete: () => {
        card.back.setVisible(!faceUp);
        card.front.setVisible(faceUp);
        card.isFlipped = faceUp;
        this.tweens.add({ targets: card.container, scaleX: 1, duration: 140, ease: 'Linear' });
      },
    });
  }

  private checkMatch() {
    const [a, b] = this.flippedCards;

    if (a.symbol === b.symbol) {
      this.matchedPairs++;
      a.isMatched = true;
      b.isMatched = true;

      this.tweens.add({
        targets: [a.container, b.container],
        alpha: 0.55,
        yoyo: true,
        repeat: 1,
        duration: 180,
        onComplete: () => {
          a.container.setAlpha(0.45);
          b.container.setAlpha(0.45);
          a.container.disableInteractive();
          b.container.disableInteractive();
        },
      });

      this.events.emit('match-found', this.matchedPairs);

      if (this.matchedPairs === this.totalPairs)
        this.time.delayedCall(600, () => this.events.emit('game-complete', this.moves));
    } else {
      this.flipCard(a, false);
      this.flipCard(b, false);
    }

    this.flippedCards = [];
    this.isLocked = false;
  }

  // ── Public API for UIScene ───────────────────────────────────────────────────
  restartGame() {
    this.scene.restart();
  }

  goToMenu() {
    getYSDK()?.features.GameplayAPI?.stop();
    const sdk = getYSDK();
    const proceed = () => {
      this.cameras.main.fadeOut(300, 7, 21, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    };
    if (sdk?.adv?.showInterstitial) {
      sdk.adv.showInterstitial({
        callbacks: { onClose: proceed, onError: proceed },
      });
    } else {
      proceed();
    }
  }
}