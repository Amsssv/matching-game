import Phaser from 'phaser';
import { C, HEADER_H } from '../constants';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  // Header element refs (repositioned on resize)
  private headerBg!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private pairsText!: Phaser.GameObjects.Text;
  private menuBtnBg!: Phaser.GameObjects.Graphics;
  private menuBtnLabel!: Phaser.GameObjects.Text;
  private menuBtnZone!: Phaser.GameObjects.Zone;

  private totalPairs = 8;
  private currentMoves = 0;
  private currentPairs = 0;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.totalPairs = data.gameScene.totalPairs;
  }

  create() {
    this.currentMoves = 0;
    this.currentPairs = 0;

    this.createHeader(this.scale.width, this.scale.height);

    // Game event listeners (cleaned up on shutdown)
    const onMoves   = (n: number)  => { this.currentMoves = n; this.movesText.setText(`Ходов: ${n}`); };
    const onMatch   = (n: number)  => { this.currentPairs = n; this.updatePairsText(n); };
    const onComplete = (n: number) => this.showVictory(n);

    this.gameScene.events.on('moves-updated', onMoves,    this);
    this.gameScene.events.on('match-found',   onMatch,    this);
    this.gameScene.events.on('game-complete', onComplete, this);

    this.events.once('shutdown', () => {
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

    this.titleText = this.add.text(W / 2, cy, 'НАЙДИ ПАРУ', {
      fontSize: '17px',
      color: '#ade8f4',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.movesText = this.add.text(Math.max(70, W * 0.1), cy, 'Ходов: 0', {
      fontSize: '14px',
      color: '#6688aa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.pairsText = this.add.text(W - Math.max(80, W * 0.18), cy, `Пар: 0 / ${this.totalPairs}`, {
      fontSize: '14px',
      color: '#6688aa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Menu button — create label and bg first, then zone at correct position
    this.menuBtnBg = this.add.graphics();
    this.menuBtnLabel = this.add.text(0, 0, 'МЕНЮ', {
      fontSize: '10px',
      color: '#ade8f4',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const BW = 52, BH = 30;
    const bx = W - BW - 10;
    const by = (HEADER_H - BH) / 2;
    this.drawMenuBtn(W, false);

    // Zone created AFTER drawMenuBtn so size/position are final
    this.menuBtnZone = this.add.zone(bx + BW / 2, by + BH / 2, BW, BH).setInteractive();
    this.menuBtnZone.on('pointerover',  () => this.drawMenuBtn(this.scale.width, true));
    this.menuBtnZone.on('pointerout',   () => this.drawMenuBtn(this.scale.width, false));
    this.menuBtnZone.on('pointerdown', () => {
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
    const BW = 52, BH = 30;
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
    this.pairsText.setText(`Пар: ${n} / ${this.totalPairs}`);
    if (n > 0) this.pairsText.setColor('#ade8f4');
  }

  // ── Resize ───────────────────────────────────────────────────────────────────
  private onResize(gameSize: Phaser.Structs.Size) {
    const W = gameSize.width;
    const cy = HEADER_H / 2;

    this.drawHeaderBg(W);
    this.titleText.setPosition(W / 2, cy);
    this.movesText.setPosition(Math.max(70, W * 0.1), cy);
    this.pairsText.setPosition(W - Math.max(80, W * 0.18), cy);
    this.drawMenuBtn(W, false);
  }

  // ── Victory overlay ──────────────────────────────────────────────────────────
  private showVictory(moves: number) {
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

    this.add.text(cx, cy - pH * 0.3, 'ПОБЕДА!', {
      fontSize: `${Math.min(40, Math.floor(pW * 0.16))}px`,
      color: '#ade8f4',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - pH * 0.06, 'Все пары найдены!', {
      fontSize: '14px',
      color: '#6688aa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.add.text(cx, cy + pH * 0.1, `Ходов: ${moves}`, {
      fontSize: `${Math.min(28, Math.floor(pW * 0.1))}px`,
      color: C.gold.toString(16).padStart(6, '0'),
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setColor(`#${C.gold.toString(16).padStart(6, '0')}`);

    const btnW = Math.min(pW * 0.46, 150);
    const btnH = Math.min(pH * 0.15, 42);
    const btnY = cy + pH * 0.31;

    this.victoryBtn(cx - btnW * 0.56, btnY, btnW, btnH, 'ЗАНОВО', C.teal, () => {
      this.scene.stop();
      this.gameScene.restartGame();
    });

    this.victoryBtn(cx + btnW * 0.56, btnY, btnW, btnH, 'В МЕНЮ', C.ocean, () => {
      this.scene.stop();
      this.gameScene.goToMenu();
    }, C.teal);
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
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(cx, cy, w, h).setInteractive();
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout',  () => draw(false));
    zone.on('pointerdown', onClick);
  }
}