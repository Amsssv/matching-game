import Phaser from 'phaser';
import { C, DPR, HEADER_H } from '../constants';
import { GameScene } from './GameScene';
import { LOCALES } from '../i18n';
import type { Lang, Locale } from '../i18n';
import { getYSDK } from '../../ysdk';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  // Header element refs (repositioned on resize)
  private headerBg!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private pairsText!: Phaser.GameObjects.Text;
  private menuBtnBg!: Phaser.GameObjects.Graphics;
  private menuBtnLabel!: Phaser.GameObjects.Text;
  private menuBtnZone!: Phaser.GameObjects.Zone;

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

    // Start timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: -1,
      callback: () => {
        this.elapsedSeconds++;
        this.timerText.setText(formatTime(this.elapsedSeconds));
      },
    });

    // Game event listeners (cleaned up on shutdown)
    const onMoves    = (n: number) => this.movesText.setText(this.L.moves(n));
    const onMatch    = (n: number) => this.updatePairsText(n);
    const onComplete = (n: number) => {
      this.timerEvent?.remove();
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
    this.headerBg = this.add.graphics();
    this.drawHeaderBg(W);

    const cy = HEADER_H / 2;

    this.timerText = this.add.text(W / 2, cy, '0:00', {
      fontSize: `${Math.round(18 * DPR)}px`,
      color: '#ffffff',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const statFontPx = Math.max(11, Math.min(14, Math.floor(W / 38)));

    this.movesText = this.add.text(Math.max(50, W * 0.08), cy, this.L.moves(0), {
      fontSize: `${statFontPx}px`,
      color: '#B8D4DC',
      fontFamily: 'Nunito',
    }).setOrigin(0, 0.5);

    this.pairsText = this.add.text(W - Math.round(52 * DPR) - Math.round(10 * DPR) - Math.round(6 * DPR), cy, this.L.pairs(0, this.totalPairs), {
      fontSize: `${statFontPx}px`,
      color: '#B8D4DC',
      fontFamily: 'Nunito',
    }).setOrigin(1, 0.5);

    // Menu button — create label and bg first, then zone at correct position
    this.menuBtnBg = this.add.graphics();
    this.menuBtnLabel = this.add.text(0, 0, this.L.menu, {
      fontSize: `${Math.round(10 * DPR)}px`,
      color: '#ffffff',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const BW = Math.round(52 * DPR), BH = Math.round(30 * DPR);
    const bx = W - BW - 10;
    const by = (HEADER_H - BH) / 2;
    this.drawMenuBtn(W, false);

    // Zone created AFTER drawMenuBtn so size/position are final
    this.menuBtnZone = this.add.zone(bx + BW / 2, by + BH / 2, BW, BH).setInteractive();
    this.menuBtnZone.on('pointerover',  () => this.drawMenuBtn(this.scale.width, true));
    this.menuBtnZone.on('pointerout',   () => this.drawMenuBtn(this.scale.width, false));
    this.menuBtnZone.on('pointerdown', () => {
      this.sfx('sfx-click');
      this.scene.stop();
      this.gameScene.goToMenu();
    });
  }

  private drawHeaderBg(W: number) {
    this.headerBg.clear();
    this.headerBg.fillStyle(C.bgDark, 0.95);
    this.headerBg.fillRect(0, 0, W, HEADER_H);
    this.headerBg.lineStyle(1, C.teal, 0.2);
    this.headerBg.lineBetween(0, HEADER_H, W, HEADER_H);
  }

  private drawMenuBtn(W: number, hover: boolean) {
    const BW = Math.round(52 * DPR), BH = Math.round(30 * DPR);
    const bx = W - BW - 10;
    const by = (HEADER_H - BH) / 2;
    this.menuBtnBg.clear();
    this.menuBtnBg.fillStyle(hover ? C.ocean : C.bgMid);
    this.menuBtnBg.fillRoundedRect(bx, by, BW, BH, 6);
    this.menuBtnBg.lineStyle(1, hover ? C.teal : C.ocean);
    this.menuBtnBg.strokeRoundedRect(bx, by, BW, BH, 6);

    if (this.menuBtnZone) this.menuBtnZone.setPosition(bx + BW / 2, by + BH / 2);
    if (this.menuBtnLabel) this.menuBtnLabel.setPosition(bx + BW / 2, by + BH / 2);
  }

  private updatePairsText(n: number) {
    this.pairsText.setText(this.L.pairs(n, this.totalPairs));
    if (n > 0) this.pairsText.setColor('#ffffff');
  }

  // ── Resize ───────────────────────────────────────────────────────────────────
  private onResize(gameSize: Phaser.Structs.Size) {
    const W = gameSize.width;
    const cy = HEADER_H / 2;
    const statFontPx = Math.max(11, Math.min(14, Math.floor(W / 38)));

    this.drawHeaderBg(W);
    this.timerText.setPosition(W / 2, cy);
    this.movesText.setPosition(Math.max(50, W * 0.08), cy).setFontSize(statFontPx);
    this.pairsText.setPosition(W - Math.round(52 * DPR) - Math.round(10 * DPR) - Math.round(6 * DPR), cy).setFontSize(statFontPx);
    this.drawMenuBtn(W, false);
  }

  // ── Victory overlay ──────────────────────────────────────────────────────────
  private showVictory(moves: number, seconds: number) {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;
    const pW = Math.min(W * 0.85, 340);
    const pH = Math.min(H * 0.55, 300);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, W, H);

    const panel = this.add.graphics();
    panel.fillStyle(C.bgMid);
    panel.fillRoundedRect(cx - pW / 2, cy - pH / 2, pW, pH, 14);
    panel.lineStyle(2, C.teal, 0.7);
    panel.strokeRoundedRect(cx - pW / 2, cy - pH / 2, pW, pH, 14);

    this.add.text(cx, cy - pH * 0.3, this.L.victory, {
      fontSize: `${Math.min(40, Math.floor(pW * 0.16))}px`,
      color: '#FFE566',
      fontFamily: 'Cinzel',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: '#003250', blur: 10, fill: true },
    }).setOrigin(0.5);

    this.add.text(cx, cy - pH * 0.06, this.L.allPairsFound, {
      fontSize: `${Math.round(14 * DPR)}px`,
      color: '#B8D4DC',
      fontFamily: 'Nunito',
    }).setOrigin(0.5);

    const statFontSize = `${Math.min(22, Math.floor(pW * 0.085))}px`;
    this.add.text(cx, cy + pH * 0.06, this.L.movesResult(moves), {
      fontSize: statFontSize,
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5).setColor(`#${C.gold.toString(16).padStart(6, '0')}`);

    this.add.text(cx, cy + pH * 0.2, this.L.timeResult(formatTime(seconds)), {
      fontSize: statFontSize,
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5).setColor(`#${C.foam.toString(16).padStart(6, '0')}`);

    const btnW = Math.min(pW * 0.46, 150);
    const btnH = Math.min(pH * 0.15, 42);
    const btnY = cy + pH * 0.38;

    this.victoryBtn(cx - btnW * 0.56, btnY, btnW, btnH, this.L.restart, C.teal, () => {
      this.scene.stop();
      this.gameScene.restartGame();
    });

    this.victoryBtn(cx + btnW * 0.56, btnY, btnW, btnH, this.L.toMenu, C.ocean, () => {
      this.scene.stop();
      this.gameScene.goToMenu();
    }, C.teal);
  }

  private sfx(key: string) {
    const am: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
    am?.playSfx(key);
  }

  private victoryBtn(
    cx: number, cy: number,
    w: number, h: number,
    label: string,
    fill: number,
    onClick: () => void,
    border?: number
  ) {
    const bg = this.add.graphics();
    const brd = border ?? fill;
    const draw = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(fill, hover ? 1 : 0.7);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
      bg.lineStyle(2, brd);
      bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    };
    draw(false);

    this.add.text(cx, cy, label, {
      fontSize: `${Math.min(15, Math.floor(h * 0.38))}px`,
      color: '#ffffff',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(cx, cy, w, h).setInteractive();
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout',  () => draw(false));
    zone.on('pointerdown', () => { this.sfx('sfx-click'); onClick(); });
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}