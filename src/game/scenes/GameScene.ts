import Phaser from 'phaser';
import { UI } from '../ui/config';
import { SYMBOLS } from '../assets-config';
import { getYSDK } from '../../ysdk';
import { DIFF_ROWS, DIFF_ROWS_MOBILE, calcLayout as calcLayoutFn, type Difficulty, type Layout } from '../layout';
import { isMobileDevice } from '../device';

interface Card {
  container: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Image;
  front: Phaser.GameObjects.Image;
  maskGfx: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Graphics;
  border: Phaser.GameObjects.Graphics;
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
  private isMobile = false;
  private bgObj?: Phaser.GameObjects.Image;
  private islandObj?: Phaser.GameObjects.NineSlice;
  private gameActive = true;
  private lastAdvTime = 0;
  private static readonly ADV_MIN_INTERVAL = 180_000;
  private static readonly CARD_AREA_RATIO = 0.80;
  private static readonly ISLAND_SLICE = { left: 400, right: 400, top: 360, bottom: 400 };

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
    this.isMobile = isMobileDevice();
    this.rowWidths = (this.isMobile ? DIFF_ROWS_MOBILE : DIFF_ROWS)[difficulty];
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
      this.cards.forEach(card => { card.maskGfx.destroy(); card.shadow.destroy(); });
      this.islandObj?.destroy();
    });
  }

  // ── Background ───────────────────────────────────────────────────────────────
  private drawBackground(W: number, H: number) {
    this.bgObj = this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H).setDepth(-1);
    if (!this.islandObj) {
      const { x, y, w, h } = this.calcIslandBounds(W, H);
      const s = GameScene.ISLAND_SLICE;
      this.islandObj = this.add.nineslice(x, y, 'island', undefined, w, h, s.left, s.right, s.top, s.bottom).setDepth(0);
    }
  }

  private calcRefCardSize(W: number, H: number): { cardW: number; cardH: number } {
    const availH = H - UI.layout.headerH;
    const baseAreaW = W * 0.90 * GameScene.CARD_AREA_RATIO;
    const baseAreaH = availH * 0.90 * GameScene.CARD_AREA_RATIO;
    const refRows = this.isMobile ? DIFF_ROWS_MOBILE.medium : DIFF_ROWS.medium;
    const { cardW, cardH } = calcLayoutFn(refRows, baseAreaW, baseAreaH, 0, 0);
    if (this.isMobile) {
      return { cardW: Math.round(cardW * 1.5), cardH: Math.round(cardH * 1.5) };
    }
    return { cardW, cardH };
  }

  private calcIslandBounds(W: number, H: number): { x: number; y: number; w: number; h: number } {
    const availH = H - UI.layout.headerH;
    const { cardW, cardH } = this.calcRefCardSize(W, H);
    // Island never shrinks below medium size (easy has fewer cards but same island)
    const medRef = this.isMobile ? DIFF_ROWS_MOBILE.medium : DIFF_ROWS.medium;
    const maxCols = Math.max(Math.max(...this.rowWidths), Math.max(...medRef));
    const numRows = Math.max(this.rowWidths.length, medRef.length);

    // Natural grid size with max gap (24px) — island grows to fit
    const gridW = maxCols * cardW + (maxCols - 1) * 24;
    const gridH = numRows * cardH + (numRows - 1) * 24;

    const r = GameScene.CARD_AREA_RATIO;
    const maxIslandH = this.isMobile ? availH - 300 : availH * 0.97;
    return {
      x: W / 2,
      y: UI.layout.headerH + availH / 2,
      w: Math.min(gridW / r, W * 0.99),
      h: Math.min(gridH / r, maxIslandH),
    };
  }

  // ── Card layout calculation ──────────────────────────────────────────────────
  private calcLayoutFromIsland(island: { x: number; y: number; w: number; h: number }, W: number, H: number): Layout {
    const r = GameScene.CARD_AREA_RATIO;
    const areaW = island.w * r;
    const areaH = island.h * r;
    const { cardW, cardH } = this.calcRefCardSize(W, H);
    const maxCols = Math.max(...this.rowWidths);
    const numRows = this.rowWidths.length;
    // Use fixed card size if it fits (island may be viewport-clamped for expert on small screens)
    const fits = maxCols * cardW + (maxCols - 1) * 8 <= areaW &&
                 numRows * cardH + (numRows - 1) * 8 <= areaH;
    return calcLayoutFn(this.rowWidths, areaW, areaH, island.x, island.y, fits ? cardW : undefined, fits ? cardH : undefined);
  }

  private calcLayout(W: number, H: number): Layout {
    return this.calcLayoutFromIsland(this.calcIslandBounds(W, H), W, H);
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
    const shadow = this.add.graphics().setDepth(1);
    this.drawCardShadow(shadow, x, y, cardW, cardH);

    const back   = this.add.image(0, 0, 'card-back').setDisplaySize(cardW, cardH);
    const front  = this.add.image(0, 0, `card-${symbol}`).setDisplaySize(cardW, cardH).setVisible(false);
    const border = this.add.graphics();
    this.drawCardBorderInner(border, cardW, cardH);

    const maskGfx = this.add.graphics().setVisible(false);
    this.drawCardMask(maskGfx, x, y, cardW, cardH);

    const container = this.add.container(x, y, [back, front, border]);
    container.setSize(cardW, cardH).setInteractive().setDepth(2);
    container.setMask(maskGfx.createGeometryMask());

    const card: Card = { container, back, front, maskGfx, shadow, border, symbol, index, isFlipped: false, isMatched: false };

    container.on('pointerover', () => {
      if (!card.isFlipped && !card.isMatched && !this.isLocked) {
        this.tweens.add({ targets: container, scaleX: UI.card.hoverScale, scaleY: UI.card.hoverScale, duration: UI.card.hoverDuration });
      }
    });
    container.on('pointerout', () => {
      if (!card.isFlipped && !card.isMatched) {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: UI.card.hoverDuration });
      }
    });
    container.on('pointerdown', () => this.onCardClick(card));

    return card;
  }

  private drawCardMask(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    gfx.clear();
    gfx.fillStyle(0xffffff);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, UI.card.radius);
  }

  private drawCardShadow(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    gfx.setPosition(x, y);
    gfx.clear();
    const o = UI.card.shadowOffset;
    gfx.fillStyle(0x000000, UI.card.shadowAlpha);
    gfx.fillRoundedRect(-w / 2 + o, -h / 2 + o, w, h, UI.card.radius);
  }

  private drawCardBorderInner(gfx: Phaser.GameObjects.Graphics, w: number, h: number) {
    gfx.clear();
    const bw = UI.card.borderWidth;
    gfx.lineStyle(bw, UI.card.borderColor, 1);
    gfx.strokeRoundedRect(-w / 2 + bw / 2, -h / 2 + bw / 2, w - bw, h - bw, UI.card.radius - bw / 2);
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
      this.islandObj.setPosition(island.x, island.y);
      this.islandObj.setSize(island.w, island.h);
    }

    // Relayout cards
    const layout = this.calcLayoutFromIsland(island, W, H);
    this.cards.forEach((card) => {
      const { x, y } = layout.positions[card.index];
      card.container.setPosition(x, y);
      card.container.setSize(layout.cardW, layout.cardH).setInteractive();
      card.back.setDisplaySize(layout.cardW, layout.cardH);
      card.front.setDisplaySize(layout.cardW, layout.cardH);
      this.drawCardMask(card.maskGfx, x, y, layout.cardW, layout.cardH);
      this.drawCardShadow(card.shadow, x, y, layout.cardW, layout.cardH);
      this.drawCardBorderInner(card.border, layout.cardW, layout.cardH);
    });
  }

  // ── Game logic ───────────────────────────────────────────────────────────────
  private onCardClick(card: Card) {
    if (this.isLocked || card.isFlipped || card.isMatched) return;
    if (this.flippedCards.length >= 2) return;

    this.tweens.killTweensOf(card.container);
    card.container.setScale(1);

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
    if (faceUp) card.isFlipped = true;
    this.tweens.add({
      targets: [card.container, card.shadow],
      scaleX: 0,
      duration: UI.card.flipDuration,
      ease: 'Linear',
      onComplete: () => {
        card.back.setVisible(!faceUp);
        card.front.setVisible(faceUp);
        if (!faceUp) card.isFlipped = false;
        this.tweens.add({ targets: [card.container, card.shadow], scaleX: 1, duration: UI.card.flipDuration, ease: 'Linear' });
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
          a.shadow.setAlpha(UI.card.matchedAlpha);
          b.shadow.setAlpha(UI.card.matchedAlpha);
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