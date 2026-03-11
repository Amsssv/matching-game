import Phaser from 'phaser';
import { C, HEADER_H } from '../constants';
import { CUSTOM_ASSETS, SYMBOLS } from '../assets-config';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFF_CONFIG: Record<Difficulty, { cols: number; rows: number; pairs: number }> = {
  easy:   { cols: 3, rows: 4, pairs: 6  },
  medium: { cols: 4, rows: 4, pairs: 8  },
  hard:   { cols: 5, rows: 4, pairs: 10 },
};

// Min card size (px) — prevents cards from becoming unplayably small
const MIN_CARD_W = 54;

interface Card {
  container: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Image;
  front: Phaser.GameObjects.Image;
  symbol: string;
  index: number;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Layout {
  cardW: number;
  cardH: number;
  gapX: number;
  gapY: number;
  startX: number;
  startY: number;
}

export class GameScene extends Phaser.Scene {
  private cards: Card[] = [];
  private flippedCards: Card[] = [];
  private isLocked = false;
  private moves = 0;
  private matchedPairs = 0;
  totalPairs = 0;

  private cols = 4;
  private rows = 4;
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
    const { cols, rows, pairs } = DIFF_CONFIG[difficulty];
    this.cols = cols;
    this.rows = rows;
    this.totalPairs = pairs;

    const W = this.scale.width;
    const H = this.scale.height;

    this.drawBackground(W, H);
    this.dealCards(W, H);

    this.scene.launch('UIScene', { gameScene: this });
    this.cameras.main.fadeIn(300, 7, 21, 40);

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
  }

  // ── Background ───────────────────────────────────────────────────────────────
  private drawBackground(W: number, H: number) {
    if (CUSTOM_ASSETS.bg && this.textures.exists('bg')) {
      const img = this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H);
      this.bgObj = img;
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
    const pad = Math.max(8, W * 0.02);
    const availW = W - pad * 2;
    const availH = H - HEADER_H - pad * 2;

    const minGap = 8;
    let cardW = Math.floor((availW - (this.cols - 1) * minGap) / this.cols);
    let cardH = Math.round(cardW * (4 / 3));

    // Constrain by height
    const maxCardH = Math.floor((availH - (this.rows - 1) * minGap) / this.rows);
    if (cardH > maxCardH) {
      cardH = maxCardH;
      cardW = Math.round(cardH * (3 / 4));
    }

    cardW = Math.max(cardW, MIN_CARD_W);
    cardH = Math.round(cardW * (4 / 3));

    const gapX = Math.floor((availW - this.cols * cardW) / Math.max(1, this.cols - 1));
    const gapY = Math.floor((availH - this.rows * cardH) / Math.max(1, this.rows - 1));
    const clampedGapX = Math.min(Math.max(gapX, minGap), 24);
    const clampedGapY = Math.min(Math.max(gapY, minGap), 24);

    const gridW = this.cols * cardW + (this.cols - 1) * clampedGapX;
    const gridH = this.rows * cardH + (this.rows - 1) * clampedGapY;
    const startX = (W - gridW) / 2 + cardW / 2;
    const startY = HEADER_H + (availH - gridH) / 2 + pad + cardH / 2;

    return { cardW, cardH, gapX: clampedGapX, gapY: clampedGapY, startX, startY };
  }

  // ── Deal cards ───────────────────────────────────────────────────────────────
  private dealCards(W: number, H: number) {
    const symbolPool = Phaser.Utils.Array.Shuffle([
      ...SYMBOLS.slice(0, this.totalPairs),
      ...SYMBOLS.slice(0, this.totalPairs),
    ]) as string[];

    const layout = this.calcLayout(W, H);

    symbolPool.forEach((symbol, i) => {
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);
      const x = layout.startX + col * (layout.cardW + layout.gapX);
      const y = layout.startY + row * (layout.cardH + layout.gapY);
      this.cards.push(this.createCard(x, y, symbol, i, layout.cardW, layout.cardH));
    });
  }

  private createCard(x: number, y: number, symbol: string, index: number, cardW: number, cardH: number): Card {
    const back  = this.add.image(0, 0, 'card-back').setDisplaySize(cardW, cardH);
    const front = this.add.image(0, 0, `card-${symbol}`).setDisplaySize(cardW, cardH).setVisible(false);

    const container = this.add.container(x, y, [back, front]);
    container.setSize(cardW, cardH).setInteractive();

    const card: Card = { container, back, front, symbol, index, isFlipped: false, isMatched: false };

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

  // ── Resize ───────────────────────────────────────────────────────────────────
  private onResize(gameSize: Phaser.Structs.Size) {
    const W = gameSize.width;
    const H = gameSize.height;

    // Reposition / rescale background
    if (this.bgObj instanceof Phaser.GameObjects.Image) {
      this.bgObj.setPosition(W / 2, H / 2).setDisplaySize(W, H);
    } else if (this.bgObj instanceof Phaser.GameObjects.Graphics) {
      this.bgObj.destroy();
      this.drawBackground(W, H);
      this.bgObj.setDepth(-1);
    }

    // Relayout cards
    const layout = this.calcLayout(W, H);
    this.cards.forEach((card) => {
      const col = card.index % this.cols;
      const row = Math.floor(card.index / this.cols);
      const x = layout.startX + col * (layout.cardW + layout.gapX);
      const y = layout.startY + row * (layout.cardH + layout.gapY);

      card.container.setPosition(x, y);
      card.container.setSize(layout.cardW, layout.cardH).setInteractive();
      card.back.setDisplaySize(layout.cardW, layout.cardH);
      card.front.setDisplaySize(layout.cardW, layout.cardH);
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
    this.scene.stop('UIScene');
    this.cameras.main.fadeOut(300, 7, 21, 40);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
  }
}