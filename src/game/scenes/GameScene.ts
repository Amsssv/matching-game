import Phaser from 'phaser';
import { UI } from '../ui/config';
import { SYMBOLS } from '../assets-config';
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
  private bgObj?: Phaser.GameObjects.Image;
  private islandObj?: Phaser.GameObjects.Image;
  private gameActive = true;
  private lastAdvTime = 0;
  private static readonly ADV_MIN_INTERVAL = 180_000; // 3 minutes between ads
  private static readonly CARD_AREA_RATIO = 0.80;    // 10% inset from each island edge

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
    this.bgObj = undefined;
    this.islandObj = undefined;

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
      this.islandObj?.destroy();
    });
  }

  // ── Background ───────────────────────────────────────────────────────────────
  private drawBackground(W: number, H: number) {
    this.bgObj = this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H).setDepth(-1);
    if (!this.islandObj) {
      const { x, y, w, h } = this.calcIslandBounds(W, H);
      this.islandObj = this.add.image(x, y, 'island').setDisplaySize(w, h).setDepth(0);
    }
  }

  private calcIslandBounds(W: number, H: number): { x: number; y: number; w: number; h: number } {
    const availH = H - UI.layout.headerH;
    const ISLAND_ASPECT = 1093 / 1267; // h/w of iland.webp
    const TARGET = 0.9;
    let islandW = W * TARGET;
    let islandH = islandW * ISLAND_ASPECT;
    const maxH = availH * TARGET;
    if (islandH > maxH) {
      islandH = maxH;
      islandW = islandH / ISLAND_ASPECT;
    }
    return {
      x: W / 2,
      y: UI.layout.headerH + availH / 2,
      w: islandW,
      h: islandH,
    };
  }

  // ── Card layout calculation ──────────────────────────────────────────────────
  private calcLayoutFromIsland(island: { x: number; y: number; w: number; h: number }): Layout {
    const r = GameScene.CARD_AREA_RATIO;
    return calcLayoutFn(this.rowWidths, island.w * r, island.h * r, island.x, island.y);
  }

  private calcLayout(W: number, H: number): Layout {
    return this.calcLayoutFromIsland(this.calcIslandBounds(W, H));
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
    this.bgObj?.setPosition(W / 2, H / 2).setDisplaySize(W, H);

    // Compute island bounds once — reused for island reposition and card layout
    const island = this.calcIslandBounds(W, H);

    // Reposition island
    if (this.islandObj) {
      this.islandObj.setPosition(island.x, island.y).setDisplaySize(island.w, island.h);
    }

    // Relayout cards
    const layout = this.calcLayoutFromIsland(island);
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

  // ── Ad helper ────────────────────────────────────────────────────────────────
  private showAdThenProceed(proceed: () => void): void {
    const sdk = getYSDK();
    if (!sdk?.adv?.showFullscreenAdv) { proceed(); return; }

    const now = Date.now();
    if (now - this.lastAdvTime < GameScene.ADV_MIN_INTERVAL) { proceed(); return; }

    type AM = import('../AudioManager').AudioManager;
    const am = this.game.registry.get('audioManager') as AM | undefined;
    const soundEnabled: boolean = this.game.registry.get('soundEnabled') ?? true;

    sdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen:  () => am?.setMuted(true),
        onClose: () => { this.lastAdvTime = Date.now(); am?.setMuted(!soundEnabled); proceed(); },
        onError: () => { am?.setMuted(!soundEnabled); proceed(); },
      },
    });
  }

  // ── Public API for UIScene ───────────────────────────────────────────────────
  restartGame() {
    getYSDK()?.features.GameplayAPI?.stop();
    this.showAdThenProceed(() => this.scene.restart());
  }

  goToMenu() {
    getYSDK()?.features.GameplayAPI?.stop();
    this.showAdThenProceed(() => {
      this.cameras.main.fadeOut(UI.animation.fadeScene, 7, 21, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }
}