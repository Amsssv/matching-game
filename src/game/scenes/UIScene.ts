import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { LOCALES } from '../i18n';
import type { Lang, Locale } from '../i18n';
import { getYSDK } from '../../ysdk';
import { createButton, createPanel, createText } from '../ui/factory';
import type { ButtonHandle } from '../ui/factory';
import { UI } from '../ui/config';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  // Header element refs (repositioned on resize)
  private headerBg!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private pairsText!: Phaser.GameObjects.Text;
  private menuBtn!: ButtonHandle;

  private totalPairs = 8;
  private elapsedSeconds = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private L!: Locale;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.totalPairs = data.gameScene.totalPairs;
  }

  create() {
    this.elapsedSeconds = 0;
    const lang: Lang = this.game.registry.get('lang') ?? 'ru';
    this.L = LOCALES[lang];

    this.createHeader(this.scale.width, this.scale.height);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: -1,
      callback: () => {
        this.elapsedSeconds++;
        this.timerText.setText(formatTime(this.elapsedSeconds));
      },
    });

    const onMoves    = (n: number) => this.movesText.setText(this.L.moves(n));
    const onMatch    = (n: number) => this.updatePairsText(n);
    const onComplete = (n: number) => {
      this.timerEvent?.remove();
      getYSDK()?.features.GameplayAPI?.stop();
      const lb = getYSDK()?.leaderboards;
      if (lb && typeof lb.setLeaderboardScore === 'function') {
        lb.setLeaderboardScore('main', n)
          .catch(() => { /* guest or not authorized — ignore */ });
      }
      this.showVictory(n, this.elapsedSeconds);
    };

    this.gameScene.events.on('moves-updated', onMoves,    this);
    this.gameScene.events.on('match-found',   onMatch,    this);
    this.gameScene.events.on('game-complete', onComplete, this);

    this.events.once('shutdown', () => {
      this.timerEvent?.remove();
      this.gameScene.events.off('moves-updated', onMoves,    this);
      this.gameScene.events.off('match-found',   onMatch,    this);
      this.gameScene.events.off('game-complete', onComplete, this);
      this.scale.off('resize', this.onResize, this);
    });

    this.scale.on('resize', this.onResize, this);
  }

  // ── Header ───────────────────────────────────────────────────────────────────
  private createHeader(W: number, _H: number) {
    const HEADER_H = UI.layout.headerH;
    this.headerBg = this.add.graphics();
    this.drawHeaderBg(W);

    const cy       = HEADER_H / 2;
    const localDpr = Math.min(window.devicePixelRatio || 1, 2);
    const BW       = Math.round(52 * localDpr), BH = Math.round(30 * localDpr);
    const bx       = W - BW - 10;
    const by       = (HEADER_H - BH) / 2;

    const statFontPx = Math.max(11, Math.min(14, Math.floor(W / 38)));

    this.timerText = createText(this, {
      x: W / 2, y: cy,
      text: '0:00', variant: 'timer', localDpr,
    });

    this.movesText = createText(this, {
      x: Math.max(50, W * 0.08), y: cy,
      text: this.L.moves(0), variant: 'stat', localDpr, fontSize: statFontPx,
    }).setOrigin(0, 0.5);

    this.pairsText = createText(this, {
      x: W - BW - Math.round(10 * localDpr) - Math.round(6 * localDpr), y: cy,
      text: this.L.pairs(0, this.totalPairs), variant: 'stat', localDpr, fontSize: statFontPx,
    }).setOrigin(1, 0.5);

    this.menuBtn = createButton(this, {
      x: bx + BW / 2,
      y: by + BH / 2,
      label:       this.L.menu,
      onClick:     () => {
        this.sfx('sfx-click');
        this.scene.stop();
        this.gameScene.goToMenu();
      },
      variant:     'ghost',
      fixedWidth:  BW,
      fixedHeight: BH,
      fontSize:    Math.round(10 * localDpr),
    });
    this.menuBtn.container.setDepth(10);
  }

  private drawHeaderBg(W: number) {
    const HEADER_H = UI.layout.headerH;
    this.headerBg.clear();
    this.headerBg.fillStyle(UI.colors.bgDark, 0.95);
    this.headerBg.fillRect(0, 0, W, HEADER_H);
    this.headerBg.lineStyle(1, UI.colors.primary, 0.2);
    this.headerBg.lineBetween(0, HEADER_H, W, HEADER_H);
  }

  private updatePairsText(n: number) {
    this.pairsText.setText(this.L.pairs(n, this.totalPairs));
    if (n > 0) this.pairsText.setColor('#ffffff');
  }

  // ── Resize ───────────────────────────────────────────────────────────────────
  private onResize(gameSize: Phaser.Structs.Size) {
    const W        = gameSize.width;
    const HEADER_H = UI.layout.headerH;
    const cy       = HEADER_H / 2;
    const localDpr = Math.min(window.devicePixelRatio || 1, 2);
    const BW       = Math.round(52 * localDpr), BH = Math.round(30 * localDpr);
    const bx       = W - BW - 10;
    const by       = (HEADER_H - BH) / 2;
    const statFontPx = Math.max(11, Math.min(14, Math.floor(W / 38)));

    this.drawHeaderBg(W);
    this.timerText.setPosition(W / 2, cy);
    this.movesText.setPosition(Math.max(50, W * 0.08), cy).setFontSize(statFontPx);
    this.pairsText
      .setPosition(W - BW - Math.round(10 * localDpr) - Math.round(6 * localDpr), cy)
      .setFontSize(statFontPx);
    this.menuBtn.container.setPosition(bx + BW / 2, by + BH / 2);
  }

  // ── Victory overlay ──────────────────────────────────────────────────────────
  private showVictory(moves: number, seconds: number) {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;
    const pW = Math.min(W * 0.85, 340);
    const pH = Math.min(H * 0.55, 300);
    const localDpr = Math.min(window.devicePixelRatio || 1, 2);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, W, H);

    createPanel(this, { cx, cy, w: pW, h: pH });

    this.add.text(cx, cy - pH * 0.3, this.L.victory, {
      fontSize:   `${Math.min(40, Math.floor(pW * 0.16))}px`,
      color:      '#FFE566',
      fontFamily: 'Cinzel',
      fontStyle:  'bold',
      shadow:     { offsetX: 0, offsetY: 2, color: '#003250', blur: 10, fill: true },
    }).setOrigin(0.5);

    createText(this, {
      x: cx, y: cy - pH * 0.06,
      text: this.L.allPairsFound, variant: 'stat', localDpr,
    });

    const statFontSize = Math.min(22, Math.floor(pW * 0.085));

    createText(this, {
      x: cx, y: cy + pH * 0.06,
      text:     this.L.movesResult(moves),
      variant:  'timer',
      localDpr,
      fontSize: statFontSize,
      color:    `#${UI.colors.accent.toString(16).padStart(6, '0')}`,
    });

    createText(this, {
      x: cx, y: cy + pH * 0.2,
      text:     this.L.timeResult(formatTime(seconds)),
      variant:  'timer',
      localDpr,
      fontSize: statFontSize,
    });

    const btnW = Math.min(pW * 0.46, 150);
    const btnH = Math.min(pH * 0.15, 42);
    const btnY = cy + pH * 0.38;

    createButton(this, {
      x: cx - btnW * 0.56, y: btnY,
      label:       this.L.restart,
      onClick:     () => { this.sfx('sfx-click'); this.scene.stop(); this.gameScene.restartGame(); },
      variant:     'secondary',
      fixedWidth:  btnW,
      fixedHeight: btnH,
    });

    createButton(this, {
      x: cx + btnW * 0.56, y: btnY,
      label:       this.L.toMenu,
      onClick:     () => { this.sfx('sfx-click'); this.scene.stop(); this.gameScene.goToMenu(); },
      variant:     'ghost',
      fixedWidth:  btnW,
      fixedHeight: btnH,
    });
  }

  private sfx(key: string) {
    const am: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
    am?.playSfx(key);
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}