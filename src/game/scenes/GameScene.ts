import Phaser from 'phaser';
import { UI } from '../ui/config';
import { CUSTOM_ASSETS, SYMBOLS } from '../assets-config';
import { getYSDK } from '../../ysdk';
import { DIFF_ROWS, calcLayout as calcLayoutFn, type Difficulty, type Layout } from '../layout';

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

export class GameScene extends Phaser.Scene {
  private cards: Card[] = [];
  private flippedCards: Card[] = [];
  private isLocked = false;
  private moves = 0;
  private matchedPairs = 0;
  totalPairs = 0;

  private rowWidths: readonly number[] = [];
  private bgObj?: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private gameActive = true;
  private onVisibilityChange = () => {
    if (document.hidden) {
      getYSDK()?.features.GameplayAPI?.stop();
    } else if (this.gameActive) {
      getYSDK()?.features.GameplayAPI?.start();
    }
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cards = [];
    this.flippedCards = [];
    this.isLocked = false;
    this.moves = 0;
    this.matchedPairs = 0;
    this.gameActive = true;

    const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
    this.rowWidths = DIFF_ROWS[difficulty];
    this.totalPairs = this.rowWidths.reduce((s, n) => s + n, 0) / 2;

    const W = this.scale.width;
    const H = this.scale.height;

    this.drawBackground(W, H);
    this.dealCards(W, H);

    this.scene.launch('UIScene', { gameScene: this });
    getYSDK()?.features.GameplayAPI?.start();
    this.cameras.main.fadeIn(UI.animation.fadeScene, 7, 21, 40);

    this.scale.on('resize', this.onResize, this);
    this.events.once('game-complete', () => { this.gameActive = false; });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.cards.forEach(card => card.maskGfx.destroy());
    });
  }

  // ── Background ───────────────────────────────────────────────────────────────
  private drawBackground(W: number, H: number) {
    if (CUSTOM_ASSETS.bg && this.textures.exists('bg-game')) {
      const bgH = H - UI.layout.headerH;
      this.bgObj = this.add.image(W / 2, UI.layout.headerH + bgH / 2, 'bg-game').setDisplaySize(W, bgH);
      return;
    }
    const g = this.add.graphics();
    g.fillStyle(UI.colors.bgDark);
    g.fillRect(0, 0, W, H);
    // Subtle wave lines at bottom third
    g.lineStyle(1, UI.colors.primary, 0.06);
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
    return calcLayoutFn(this.rowWidths, W, H, UI.layout.headerH);
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

    const maskGfx = this.add.graphics().setVisible(false);
    this.drawCardMask(maskGfx, x, y, cardW, cardH);

    const container = this.add.container(x, y, [back, front]);
    container.setSize(cardW, cardH).setInteractive();
    container.setMask(maskGfx.createGeometryMask());

    const card: Card = { container, back, front, maskGfx, symbol, index, isFlipped: false, isMatched: false };

    container.on('pointerover', () => {
      if (!card.isFlipped && !card.isMatched && !this.isLocked)
        this.tweens.add({ targets: container, scaleX: UI.card.hoverScale, scaleY: UI.card.hoverScale, duration: UI.card.hoverDuration });
    });
    container.on('pointerout', () => {
      if (!card.isFlipped && !card.isMatched)
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: UI.card.hoverDuration });
    });
    container.on('pointerdown', () => this.onCardClick(card));

    return card;
  }

  private drawCardMask(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    gfx.clear();
    gfx.fillStyle(0xffffff);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, UI.card.radius);
  }

  // ── Resize ───────────────────────────────────────────────────────────────────
  private onResize(gameSize: Phaser.Structs.Size) {
    const W = gameSize.width;
    const H = gameSize.height;

    // Reposition / rescale background
    if (this.bgObj instanceof Phaser.GameObjects.Image) {
      const bgH = H - UI.layout.headerH;
      this.bgObj.setPosition(W / 2, UI.layout.headerH + bgH / 2).setDisplaySize(W, bgH);
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
    this.sfx('sfx-flip', 0.15);
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.events.emit('moves-updated', this.moves);
      this.isLocked = true;
      this.time.delayedCall(UI.animation.cardFlipDelay, () => this.checkMatch());
    }
  }

  private flipCard(card: Card, faceUp: boolean) {
    if (faceUp) card.isFlipped = true; // guard against double-click before animation completes
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: UI.card.flipDuration,
      ease: 'Linear',
      onComplete: () => {
        card.back.setVisible(!faceUp);
        card.front.setVisible(faceUp);
        if (!faceUp) card.isFlipped = false;
        this.tweens.add({ targets: card.container, scaleX: 1, duration: UI.card.flipDuration, ease: 'Linear' });
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
        duration: UI.animation.cardMatchFlash,
        onComplete: () => {
          a.container.setAlpha(UI.card.matchedAlpha);
          b.container.setAlpha(UI.card.matchedAlpha);
          a.container.disableInteractive();
          b.container.disableInteractive();
        },
      });

      this.sfx('sfx-match');
      this.events.emit('match-found', this.matchedPairs);

      if (this.matchedPairs === this.totalPairs)
        this.time.delayedCall(UI.animation.cardMatchDelay, () => {
          this.sfx('sfx-win');
          this.events.emit('game-complete', this.moves);
        });
    } else {
      this.flipCard(a, false);
      this.flipCard(b, false);
    }

    this.flippedCards = [];
    this.isLocked = false;
  }

  // ── SFX helper ───────────────────────────────────────────────────────────────
  private sfx(key: string, volume?: number) {
    const am: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
    am?.playSfx(key, volume);
  }

  // ── Public API for UIScene ───────────────────────────────────────────────────
  restartGame() {
    this.scene.restart();
  }

  goToMenu() {
    getYSDK()?.features.GameplayAPI?.stop();
    const sdk = getYSDK();
    const proceed = () => {
      this.cameras.main.fadeOut(UI.animation.fadeScene, 7, 21, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    };
    if (sdk?.adv?.showFullscreenAdv) {
      sdk.adv.showFullscreenAdv({
        callbacks: { onClose: proceed, onError: proceed },
      });
    } else {
      proceed();
    }
  }
}