import Phaser from 'phaser';
import { UI } from '../ui/config';
import { SYMBOLS } from '../assets-config';
import { getYSDK } from '../../ysdk';
import { DIFF_ROWS, DIFF_ROWS_MOBILE, calcLayout as calcLayoutFn, type Difficulty, type Layout } from '../layout';
import { isMobileDevice, getLocalDpr } from '../device';
import { setTransition } from '../../state/store';
import { bus } from '../../state/eventBus';
import { progressStore } from '../../state/progress';
import { tintOf } from '../../state/catalog';
import { bakeCardTextures } from '../cardTextures';
import { createRenderActivity, type RenderActivity } from '../renderActivity';

interface Card {
  container: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Image;
  front: Phaser.GameObjects.Image;
  borderImg: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  symbol: string;
  index: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export class GameScene extends Phaser.Scene {
  private cards: Card[] = [];
  private flippedCards: Card[] = [];
  private moves = 0;
  private matchedPairs = 0;
  totalPairs = 0;

  private rowWidths: readonly number[] = [];
  private isMobile = false;
  // Layout mode: portrait phones use the tall MOBILE grid; landscape phones (and
  // desktop) use the wide DESKTOP grid so cards aren't squeezed into a short height.
  private portraitMobile = false;
  private difficulty: Difficulty = 'medium';
  private bgObj?: Phaser.GameObjects.Image;
  private islandObj?: Phaser.GameObjects.NineSlice;
  // Portrait mobile renders the island as a full-screen stretched image instead of the
  // grid-sized NineSlice (islandObj). Exactly one of the two exists at a time.
  private islandImg?: Phaser.GameObjects.Image;
  private gameActive = true;
  private lastAdvTime = 0;
  private resizeTimer: Phaser.Time.TimerEvent | null = null;
  private renderActivity?: RenderActivity;
  private lastResizeW = 0;
  private lastResizeH = 0;
  private static readonly ADV_MIN_INTERVAL = 180_000;
  private static readonly ISLAND_SLICE = { left: 60, right: 60, top: 60, bottom: 60 };
  // Extra padding inside the 9-slice frame to keep cards within the sandy octagon
  // Desktop: 40px clears the ~40px diagonal corner cuts (texture: cut at ~100px from corner, slice=60px → 40px into inner area)
  // Mobile: 16px (smaller screen, different island proportion)
  private static readonly ISLAND_INNER_PAD         = 40;
  private static readonly ISLAND_INNER_PAD_MOBILE  = 16;
  // Sand region of 'island-mobile.webp' (normalized → fraction of the stretched-to-fill
  // canvas). The taller y-extent exploits the octagonal grid ([2,4,…,4,2]): its narrow
  // top/bottom rows sit in the chamfered corners while the 4-wide interior rows always
  // land in the full-width sand band (y≈0.18–0.82), so cards fill the sand without
  // overlapping the water frame.
  private static readonly MOBILE_SAND = { x0: 0.069, y0: 0.10, x1: 0.925, y1: 0.90 };
  // Expert packs 8 rows → the grid is height-limited, so cards shrink. A taller band
  // gives them more vertical room; the octagonal grid keeps the 4-wide rows (at norm
  // y≈0.19–0.81 for 8 rows) safely in the sand body even at this height.
  private static readonly MOBILE_SAND_EXPERT = { x0: 0.069, y0: 0.045, x1: 0.925, y1: 0.955 };

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
    this.moves = 0;
    this.matchedPairs = 0;
    this.gameActive = true;
    this.bgObj = undefined;
    this.islandObj = undefined;
    this.islandImg = undefined;

    const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
    this.difficulty = difficulty;
    this.isMobile = isMobileDevice();

    const canvasWidth = this.scale.width;
    const canvasHeight = this.scale.height;
    this.resolveLayout(canvasWidth, canvasHeight);   // sets portraitMobile + rowWidths
    this.totalPairs = this.rowWidths.reduce((s, n) => s + n, 0) / 2;

    this.drawBackground(canvasWidth, canvasHeight);
    this.dealCards(canvasWidth, canvasHeight);
    // Board fully built (bg + island assigned, cards dealt) — tint all targets from
    // the equipped sea/card-back items (default tints are 0xffffff → no visible change).
    this.applyEquippedTints();
    // Live re-tint if the player equips something while the game is running.
    const offEquip = bus.on('cmd:equip-changed', () => this.applyEquippedTints());

    this.scene.launch('UIScene', { gameScene: this });
    getYSDK()?.features.GameplayAPI?.start();
    // The opaque DOM cover (App.tsx) fades out, revealing the dealt board. MenuScene
    // set visible:false before the swap; restore it so the cover lifts.
    setTransition(true);

    // Render-on-demand: sleep the loop while the board is static. Stay awake through the
    // cover fade-out window, then allow sleeping once the board settles.
    this.renderActivity = createRenderActivity(this.game);
    this.renderActivity.enable();
    window.setTimeout(() => this.renderActivity?.scheduleSleep(), UI.animation.fadeScene);

    // Yandex rule 1.14: iOS orientation change emits 5–10 resize events back-to-back.
    // Running the heavy onResize on each one (re-laying out every card + redrawing
    // shadows/masks) freezes the main thread for >1s on real devices. We debounce
    // with a 200ms tail so only the final stable size triggers the relayout.
    this.lastResizeW = this.scale.width;
    this.lastResizeH = this.scale.height;
    const onResizeDebounced = (gameSize: Phaser.Structs.Size) => {
      const newWidth = gameSize.width;
      const newHeight = gameSize.height;
      if (Math.abs(newWidth - this.lastResizeW) < 6 && Math.abs(newHeight - this.lastResizeH) < 6) return;
      this.lastResizeW = newWidth;
      this.lastResizeH = newHeight;
      this.renderActivity?.wake();   // the relayout runs on a Phaser timer → keep the loop awake
      if (this.resizeTimer) this.resizeTimer.remove();
      this.resizeTimer = this.time.delayedCall(200, () => this.onResize(gameSize));
    };
    this.scale.on('resize', onResizeDebounced, this);
    this.events.once('game-complete', () => { this.gameActive = false; });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResizeDebounced, this);
      this.resizeTimer?.remove();
      this.resizeTimer = null;
      offEquip();
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.renderActivity?.disable();
      this.cards.forEach(card => card.shadow.destroy());
      this.islandObj?.destroy();
      this.islandImg?.destroy();
    });
  }

  // ── Background ───────────────────────────────────────────────────────────────
  private drawBackground(canvasWidth: number, canvasHeight: number) {
    // The sea fills the canvas and shows through the island's transparent rounded edges.
    this.bgObj = this.add.image(canvasWidth / 2, canvasHeight / 2, 'bg').setDisplaySize(canvasWidth, canvasHeight).setDepth(-1);
    this.buildIsland(canvasWidth, canvasHeight);
  }

  /** True when the board should use the portrait full-screen island instead of the NineSlice. */
  private useMobileIsland(): boolean {
    return this.portraitMobile && this.textures.exists('island-mobile');
  }

  /** (Re)create the island for the current layout mode, destroying any previous one. */
  private buildIsland(canvasWidth: number, canvasHeight: number) {
    this.islandObj?.destroy(); this.islandObj = undefined;
    this.islandImg?.destroy(); this.islandImg = undefined;

    if (this.useMobileIsland()) {
      this.islandImg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'island-mobile').setDepth(0);
      this.fitIslandFill(canvasWidth, canvasHeight);
    } else {
      const { x, y, w, h } = this.calcIslandBounds(canvasWidth, canvasHeight);
      const s = GameScene.ISLAND_SLICE;
      this.islandObj = this.add.nineslice(x, y, 'island', undefined, w, h, s.left, s.right, s.top, s.bottom).setDepth(0);
    }
  }

  /** Stretch the mobile island to fill the board area — full width, from just below the
   *  header down to the bottom edge — so its top frame isn't hidden behind the HUD. */
  private fitIslandFill(canvasWidth: number, canvasHeight: number) {
    const top = UI.layout.headerHeight;
    const h = canvasHeight - top;
    this.islandImg?.setPosition(canvasWidth / 2, top + h / 2).setDisplaySize(canvasWidth, h);
  }

  private applyEquippedTints() {
    const eq = progressStore.get().equipped;
    const seaTint  = tintOf(eq.seaTheme);
    const backTint = tintOf(eq.cardBack);
    this.bgObj?.setTint(seaTint);
    this.islandObj?.setTint(seaTint);
    this.islandImg?.setTint(seaTint);
    this.cards.forEach((card) => card.back.setTint(backTint));
  }

  // Decide the grid arrangement from the live aspect ratio. Portrait phones keep the
  // tall MOBILE pattern; landscape phones fall back to the wide DESKTOP pattern (few
  // rows, many columns) so the short viewport height isn't wasted. Totals are equal
  // across patterns, so this is safe to re-run on resize without changing card count.
  private resolveLayout(canvasWidth: number, canvasHeight: number) {
    this.portraitMobile = this.isMobile && canvasHeight >= canvasWidth;
    this.rowWidths = (this.portraitMobile ? DIFF_ROWS_MOBILE : DIFF_ROWS)[this.difficulty];
  }

  private calcRefCardSize(canvasWidth: number, canvasHeight: number): { cardWidth: number; cardHeight: number } {
    const availableHeight = canvasHeight - UI.layout.headerHeight;
    const islandSlice = GameScene.ISLAND_SLICE;
    const islandPadding = this.portraitMobile ? GameScene.ISLAND_INNER_PAD_MOBILE : GameScene.ISLAND_INNER_PAD;
    const maxIslandH = this.portraitMobile ? availableHeight - 300 : availableHeight * 0.97;
    const baseAreaW = canvasWidth * 0.90 - 2 * (islandSlice.left + islandPadding);
    const baseAreaH = maxIslandH - 2 * (islandSlice.top + islandPadding);
    const refRows = this.portraitMobile ? DIFF_ROWS_MOBILE.medium : DIFF_ROWS.medium;
    const { cardWidth, cardHeight } = calcLayoutFn(refRows, Math.max(baseAreaW, 40), Math.max(baseAreaH, 40), 0, 0);
    if (this.portraitMobile) {
      return { cardWidth: Math.round(cardWidth * 1.5), cardHeight: Math.round(cardHeight * 1.5) };
    }
    return { cardWidth, cardHeight };
  }

  private calcIslandBounds(canvasWidth: number, canvasHeight: number): { x: number; y: number; w: number; h: number } {
    const availableHeight = canvasHeight - UI.layout.headerHeight;
    const { cardWidth, cardHeight } = this.calcRefCardSize(canvasWidth, canvasHeight);
    // Island never shrinks below medium size (easy has fewer cards but same island)
    const medRef = this.portraitMobile ? DIFF_ROWS_MOBILE.medium : DIFF_ROWS.medium;
    const maxColumns = Math.max(Math.max(...this.rowWidths), Math.max(...medRef));
    const rowCount = Math.max(this.rowWidths.length, medRef.length);

    // Natural grid size with max gap (24px) — island sized to contain grid + frame + inner padding
    const gridWidth = maxColumns * cardWidth + (maxColumns - 1) * 24;
    const gridHeight = rowCount * cardHeight + (rowCount - 1) * 24;

    const islandSlice = GameScene.ISLAND_SLICE;
    const islandPadding = this.portraitMobile ? GameScene.ISLAND_INNER_PAD_MOBILE : GameScene.ISLAND_INNER_PAD;
    const maxIslandH = this.portraitMobile ? availableHeight - 300 : availableHeight * 0.97;
    return {
      x: canvasWidth / 2,
      y: UI.layout.headerHeight + availableHeight / 2,
      w: Math.min(gridWidth + 2 * (islandSlice.left + islandPadding), canvasWidth * 0.99),
      h: Math.min(gridHeight + 2 * (islandSlice.top + islandPadding), maxIslandH),
    };
  }

  // ── Card layout calculation ──────────────────────────────────────────────────
  private calcLayoutFromIsland(island: { x: number; y: number; w: number; h: number }, canvasWidth: number, canvasHeight: number): Layout {
    const islandSlice = GameScene.ISLAND_SLICE;
    const islandPadding = this.portraitMobile ? GameScene.ISLAND_INNER_PAD_MOBILE : GameScene.ISLAND_INNER_PAD;
    const areaWidth = island.w - 2 * (islandSlice.left + islandPadding);
    const areaHeight = island.h - 2 * (islandSlice.top + islandPadding);
    const { cardWidth, cardHeight } = this.calcRefCardSize(canvasWidth, canvasHeight);
    const maxColumns = Math.max(...this.rowWidths);
    const rowCount = this.rowWidths.length;
    // Use fixed card size if it fits (island may be viewport-clamped for expert on small screens)
    const fits = maxColumns * cardWidth + (maxColumns - 1) * 8 <= areaWidth &&
                 rowCount * cardHeight + (rowCount - 1) * 8 <= areaHeight;
    return calcLayoutFn(this.rowWidths, areaWidth, areaHeight, island.x, island.y, fits ? cardWidth : undefined, fits ? cardHeight : undefined);
  }

  private calcLayout(canvasWidth: number, canvasHeight: number): Layout {
    if (this.useMobileIsland()) return this.calcMobileLayout(canvasWidth, canvasHeight);
    return this.calcLayoutFromIsland(this.calcIslandBounds(canvasWidth, canvasHeight), canvasWidth, canvasHeight);
  }

  // Portrait mobile: lay cards into the cover-fit island's sand region, clamped to the
  // visible canvas below the header. Card size is maximized to fill that area, so the
  // grid occupies as much of the sandy zone as possible.
  private calcMobileLayout(canvasWidth: number, canvasHeight: number): Layout {
    // The island fills the board area below the header, so map the sand region into
    // that same band — keeps cards aligned with the stretched sand.
    const top = UI.layout.headerHeight;
    const fillH = canvasHeight - top;
    const S = this.difficulty === 'expert' ? GameScene.MOBILE_SAND_EXPERT : GameScene.MOBILE_SAND;
    const margin = Math.round(10 * getLocalDpr());
    const sx0 = Math.max(S.x0 * canvasWidth, margin);
    const sx1 = Math.min(S.x1 * canvasWidth, canvasWidth - margin);
    const sy0 = top + S.y0 * fillH;
    const sy1 = top + S.y1 * fillH;
    const areaWidth = Math.max(sx1 - sx0, 40);
    const areaHeight = Math.max(sy1 - sy0, 40);
    return calcLayoutFn(this.rowWidths, areaWidth, areaHeight, (sx0 + sx1) / 2, (sy0 + sy1) / 2);
  }

  // ── Deal cards ───────────────────────────────────────────────────────────────
  private dealCards(canvasWidth: number, canvasHeight: number) {
    const picked = [...SYMBOLS].slice(0, this.totalPairs);
    const symbolPool = Phaser.Utils.Array.Shuffle([...picked, ...picked]) as string[];

    const layout = this.calcLayout(canvasWidth, canvasHeight);
    bakeCardTextures(this, layout.cardWidth, layout.cardHeight);   // baked at this size; re-baked on resize

    symbolPool.forEach((symbol, i) => {
      const { x, y } = layout.positions[i];
      this.cards.push(this.createCard(x, y, symbol, i, layout.cardWidth, layout.cardHeight));
    });
  }

  private createCard(x: number, y: number, symbol: string, index: number, cardWidth: number, cardHeight: number): Card {
    const shadow = this.add.image(x + UI.card.shadowOffset, y + UI.card.shadowOffset, 'card-shadow-r')
      .setDisplaySize(cardWidth, cardHeight).setDepth(1);

    const back      = this.add.image(0, 0, 'card-back-r').setDisplaySize(cardWidth, cardHeight);
    const front     = this.add.image(0, 0, `card-${symbol}-r`).setDisplaySize(cardWidth, cardHeight).setVisible(false);
    const borderImg = this.add.image(0, 0, 'card-border-r').setDisplaySize(cardWidth, cardHeight);

    const container = this.add.container(x, y, [back, front, borderImg]);
    container.setSize(cardWidth, cardHeight).setInteractive().setDepth(2);

    const card: Card = { container, back, front, borderImg, shadow, symbol, index, isFlipped: false, isMatched: false };

    container.on('pointerover', () => {
      if (!card.isFlipped && !card.isMatched) {
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

  // ── Resize ───────────────────────────────────────────────────────────────────
  private onResize(gameSize: Phaser.Structs.Size) {
    const canvasWidth = gameSize.width;
    const canvasHeight = gameSize.height;

    // Re-resolve the grid arrangement: an orientation flip swaps portrait↔landscape
    // patterns (same card count) so the board re-arranges instead of staying squeezed.
    this.resolveLayout(canvasWidth, canvasHeight);

    // Reposition / rescale background
    this.bgObj?.setPosition(canvasWidth / 2, canvasHeight / 2).setDisplaySize(canvasWidth, canvasHeight);

    // Island: an orientation flip can switch portrait↔landscape, which swaps the
    // full-screen image and the NineSlice. Rebuild on a mode change, else update in place.
    if (this.useMobileIsland() !== !!this.islandImg) {
      this.buildIsland(canvasWidth, canvasHeight);
    } else if (this.islandImg) {
      this.fitIslandFill(canvasWidth, canvasHeight);
    } else if (this.islandObj) {
      const island = this.calcIslandBounds(canvasWidth, canvasHeight);
      this.islandObj.setPosition(island.x, island.y);
      this.islandObj.setSize(island.w, island.h);
    }

    // Relayout cards — re-bake textures at the new size, then re-point + resize each card.
    const layout = this.calcLayout(canvasWidth, canvasHeight);
    bakeCardTextures(this, layout.cardWidth, layout.cardHeight);
    this.cards.forEach((card) => {
      const { x, y } = layout.positions[card.index];
      card.container.setPosition(x, y);
      card.container.setSize(layout.cardWidth, layout.cardHeight);
      const io = card.container.input;
      if (io) (io.hitArea as Phaser.Geom.Rectangle).setTo(0, 0, layout.cardWidth, layout.cardHeight);
      card.back.setTexture('card-back-r').setDisplaySize(layout.cardWidth, layout.cardHeight);
      card.front.setTexture(`card-${card.symbol}-r`).setDisplaySize(layout.cardWidth, layout.cardHeight);
      card.borderImg.setTexture('card-border-r').setDisplaySize(layout.cardWidth, layout.cardHeight);
      card.shadow.setTexture('card-shadow-r').setDisplaySize(layout.cardWidth, layout.cardHeight)
        .setPosition(x + UI.card.shadowOffset, y + UI.card.shadowOffset);
    });
    this.applyEquippedTints();   // re-tint the rebuilt back textures
    this.renderActivity?.scheduleSleep();
  }

  // ── Game logic ───────────────────────────────────────────────────────────────
  private onCardClick(card: Card) {
    if (card.isFlipped || card.isMatched) return;
    if (this.flippedCards.length >= 2) return;

    this.tweens.killTweensOf(card.container);
    card.container.setScale(1);

    this.flipCard(card, true);
    this.sfx('sfx-flip', 0.15);
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.events.emit('moves-updated', this.moves);
      const [cardA, cardB] = this.flippedCards;
      this.flippedCards = [];
      this.scheduleCheck(UI.animation.cardFlipDelay, () => this.checkMatch(cardA, cardB));
    }
  }

  /** Wrap a flip/match delayedCall so render-on-demand keeps the loop awake until it fires. */
  private scheduleCheck(delay: number, fn: () => void) {
    this.renderActivity?.beginCheck();
    this.time.delayedCall(delay, () => { this.renderActivity?.endCheck(); fn(); });
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

  private checkMatch(cardA: Card, cardB: Card) {

    if (cardA.symbol === cardB.symbol) {
      this.matchedPairs++;
      cardA.isMatched = true;
      cardB.isMatched = true;

      this.tweens.add({
        targets: [cardA.container, cardB.container],
        alpha: 0.55,
        yoyo: true,
        repeat: 1,
        duration: UI.animation.cardMatchFlash,
        onComplete: () => {
          cardA.container.setAlpha(UI.card.matchedAlpha);
          cardB.container.setAlpha(UI.card.matchedAlpha);
          cardA.shadow.setAlpha(UI.card.matchedAlpha);
          cardB.shadow.setAlpha(UI.card.matchedAlpha);
          cardA.container.disableInteractive();
          cardB.container.disableInteractive();
        },
      });

      this.sfx('sfx-match');
      this.events.emit('match-found', this.matchedPairs);

      if (this.matchedPairs === this.totalPairs)
        this.scheduleCheck(UI.animation.cardMatchDelay, () => {
          this.sfx('sfx-win');
          this.events.emit('game-complete', this.moves);
        });
    } else {
      this.scheduleCheck(UI.animation.cardFlipDelay, () => {
        this.flipCard(cardA, false);
        this.flipCard(cardB, false);
      });
    }
  }

  // ── SFX helper ───────────────────────────────────────────────────────────────
  private sfx(key: string, volume?: number) {
    const audioManager: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
    audioManager?.playSfx(key, volume);
  }

  // ── Ad helper ────────────────────────────────────────────────────────────────
  private showAdThenProceed(proceed: () => void): void {
    const sdk = getYSDK();
    if (!sdk?.adv?.showFullscreenAdv) { proceed(); return; }

    const now = Date.now();
    if (now - this.lastAdvTime < GameScene.ADV_MIN_INTERVAL) { proceed(); return; }

    type AM = import('../AudioManager').AudioManager;
    const audioManager = this.game.registry.get('audioManager') as AM | undefined;
    const soundEnabled: boolean = this.game.registry.get('soundEnabled') ?? true;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      proceed();
    };

    // Fallback: unblock if SDK callbacks never fire (broken SDK, MIME error, etc.)
    const fallback = window.setTimeout(() => { audioManager?.setMuted(!soundEnabled); finish(); }, 15_000);

    try {
      sdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen:  () => { window.clearTimeout(fallback); audioManager?.setMuted(true); },
          onClose: () => { window.clearTimeout(fallback); this.lastAdvTime = Date.now(); audioManager?.setMuted(!soundEnabled); finish(); },
          onError: () => { window.clearTimeout(fallback); audioManager?.setMuted(!soundEnabled); finish(); },
        },
      });
    } catch {
      window.clearTimeout(fallback);
      finish();
    }
  }

  // ── Public API for UIScene ───────────────────────────────────────────────────
  restartGame() {
    // Stop render-on-demand first: the loop must run continuously through the ad
    // + scene.restart (queued scene ops don't process while the loop is asleep).
    this.renderActivity?.disable();
    getYSDK()?.features.GameplayAPI?.stop();
    this.showAdThenProceed(() => {
      setTransition(false);   // opaque cover fades in, then re-deal behind it
      window.setTimeout(() => this.scene.restart(), UI.animation.fadeScene);
    });
  }

  goToMenu() {
    // Stop render-on-demand first so the loop runs continuously through the ad +
    // cover fade + scene swap (queued scene ops don't process while it's asleep).
    this.renderActivity?.disable();
    getYSDK()?.features.GameplayAPI?.stop();
    this.showAdThenProceed(() => {
      setTransition(false);   // opaque DOM cover fades in over the canvas
      window.setTimeout(() => this.scene.start('MenuScene'), UI.animation.fadeScene);
    });
  }
}
