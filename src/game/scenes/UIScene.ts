import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { LOCALES } from '../i18n';
import type { Lang, Locale } from '../i18n';
import { getYSDK } from '../../ysdk';
import { createButton, createText } from '../ui/factory';
import type { ButtonHandle } from '../ui/factory';
import { UI } from '../ui/config';
import { fetchLeaderboard, type LeaderboardData, SCORE_BASE } from '../leaderboard';
import type { Difficulty } from '../layout';

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
      this.game.registry.set('lastScore', n);
      getYSDK()?.features.GameplayAPI?.stop();
      const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
      const lb = getYSDK()?.leaderboards;
      if (lb && typeof lb.setLeaderboardScore === 'function') {
        lb.setLeaderboardScore(difficulty, SCORE_BASE - n).catch(() => {});
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
    this.headerBg.setDepth(5);
    this.timerText.setDepth(22);
    this.movesText.setDepth(22);
    this.pairsText.setDepth(22);
    this.menuBtn.container.setDepth(22);
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
    const pW        = Math.min(W * 0.85, 340);
    const localDpr  = Math.min(window.devicePixelRatio || 1, 2);
    const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
    const lbPromise = fetchLeaderboard(difficulty);
    const accentHex = '#' + UI.colors.accent.toString(16).padStart(6, '0');

    // ── Element sizes ────────────────────────────────────────────────────────────
    const titleSize     = Math.min(40, Math.floor(pW * 0.16));
    const subtitleSize  = Math.max(13, Math.floor(pW * 0.045));
    const statLabelSize = Math.max(10, Math.floor(pW * 0.038));
    const statValueSize = Math.min(28, Math.floor(pW * 0.105));

    // ── Button sizes ─────────────────────────────────────────────────────────────
    const modalPadX = Math.round(20 * localDpr);
    const btnW      = pW - modalPadX * 2;
    const btnH      = Math.max(40, Math.round(46 * (localDpr / 2 + 0.5)));

    // ── Vertical gaps ─────────────────────────────────────────────────────────────
    const padTop          = Math.round(28 * localDpr);
    const padBot          = Math.round(20 * localDpr);
    const gapTitleSep     = Math.round(12 * localDpr);
    const gapSepSubtitle  = Math.round(14 * localDpr);
    const gapSubtitleStat = Math.round(20 * localDpr);
    const gapStatBtns     = Math.round(22 * localDpr);
    const gapBtnBtn       = Math.round(10 * localDpr);
    const statBlockGap    = Math.round(6  * localDpr);

    // ── Panel height from content ─────────────────────────────────────────────────
    const statBlockH = statLabelSize + statBlockGap + statValueSize;
    const contentH   =
      padTop +
      titleSize     + gapTitleSep +
      1             + gapSepSubtitle +
      subtitleSize  + gapSubtitleStat +
      statBlockH    + gapStatBtns +
      btnH + gapBtnBtn + btnH + gapBtnBtn + btnH +
      padBot;
    const pH = Math.min(contentH, H * 0.92);

    // ── Cursor layout (local coords, origin = panel centre) ───────────────────────
    let cursorY = -pH / 2 + padTop;

    const titleY    = cursorY + titleSize / 2;
    cursorY        += titleSize + gapTitleSep;

    const sepY      = cursorY;
    cursorY        += 1 + gapSepSubtitle;

    const subtitleY = cursorY + subtitleSize / 2;
    cursorY        += subtitleSize + gapSubtitleStat;

    const statColX   = pW * 0.22;
    const statLabelY = cursorY + statLabelSize / 2;
    const statValueY = cursorY + statLabelSize + statBlockGap + statValueSize / 2;
    const statDivTop = cursorY - 4;
    const statDivBot = cursorY + statBlockH + 4;
    cursorY         += statBlockH + gapStatBtns;

    const btnPrimaryY = cursorY + btnH / 2;
    cursorY          += btnH + gapBtnBtn;
    const btnGhostY   = cursorY + btnH / 2;
    cursorY          += btnH + gapBtnBtn;
    const btnLbY      = cursorY + btnH / 2;

    // ── Backdrop ──────────────────────────────────────────────────────────────────
    const backdrop = this.add.graphics().setDepth(20);
    backdrop.fillStyle(UI.colors.bgDark);
    backdrop.fillRect(0, 0, W, H);
    backdrop.setAlpha(0);
    this.tweens.add({ targets: backdrop, alpha: 0.78, duration: UI.animation.fadeScene, ease: 'Sine.easeOut' });

    // ── Modal container ───────────────────────────────────────────────────────────
    const modal = this.add.container(cx, cy).setDepth(21).setAlpha(0).setScale(0.9);
    this.tweens.add({ targets: modal, alpha: 1, scale: 1, duration: UI.animation.fadeScene, ease: 'Back.easeOut' });

    // ── Panel ─────────────────────────────────────────────────────────────────────
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(UI.panel.bg);
    panelGfx.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, UI.panel.radius);
    panelGfx.lineStyle(UI.panel.borderWidth, UI.panel.border, UI.panel.borderAlpha);
    panelGfx.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, UI.panel.radius);

    // ── Title ─────────────────────────────────────────────────────────────────────
    const titleText = createText(this, {
      x: 0, y: titleY, text: this.L.victory, variant: 'title', localDpr, fontSize: titleSize,
    });

    // ── Separator ─────────────────────────────────────────────────────────────────
    const sep = this.add.graphics();
    sep.lineStyle(1, UI.colors.accent, 0.35);
    sep.lineBetween(-pW * 0.32, sepY, pW * 0.32, sepY);

    // ── Subtitle ──────────────────────────────────────────────────────────────────
    const subtitleText = createText(this, {
      x: 0, y: subtitleY, text: this.L.allPairsFound, variant: 'stat', localDpr, fontSize: subtitleSize,
    });

    // ── Stats — two columns ───────────────────────────────────────────────────────
    const movesLabel = createText(this, { x: -statColX, y: statLabelY, text: this.L.movesLabel, variant: 'stat',  localDpr, fontSize: statLabelSize });
    const movesValue = createText(this, { x: -statColX, y: statValueY, text: String(moves),      variant: 'timer', localDpr, fontSize: statValueSize, color: accentHex });
    const timeLabel  = createText(this, { x:  statColX, y: statLabelY, text: this.L.timeLabel,   variant: 'stat',  localDpr, fontSize: statLabelSize });
    const timeValue  = createText(this, { x:  statColX, y: statValueY, text: formatTime(seconds),variant: 'timer', localDpr, fontSize: statValueSize, color: accentHex });

    const statDiv = this.add.graphics();
    statDiv.lineStyle(1, UI.colors.textDim, 0.2);
    statDiv.lineBetween(0, statDivTop, 0, statDivBot);

    // ── Buttons — vertical stack ──────────────────────────────────────────────────
    const restartBtn = createButton(this, {
      x: 0, y: btnPrimaryY, label: this.L.restart,
      onClick: () => { this.sfx('sfx-click'); this.scene.stop(); this.gameScene.restartGame(); },
      variant: 'primary', fixedWidth: btnW, fixedHeight: btnH,
    });
    const toMenuBtn = createButton(this, {
      x: 0, y: btnGhostY, label: this.L.toMenu,
      onClick: () => { this.sfx('sfx-click'); this.scene.stop(); this.gameScene.goToMenu(); },
      variant: 'ghost', fixedWidth: btnW, fixedHeight: btnH,
    });
    const lbBtn = createButton(this, {
      x: 0, y: btnLbY, label: '🏆 ' + this.L.leaderboard,
      onClick: () => { this.sfx('sfx-click'); this.openLeaderboardOverlay(); },
      variant: 'ghost', fixedWidth: btnW, fixedHeight: btnH,
    });

    // ── Assemble ──────────────────────────────────────────────────────────────────
    modal.add([
      panelGfx, titleText, sep, subtitleText,
      movesLabel, movesValue, statDiv, timeLabel, timeValue,
      restartBtn.container, toMenuBtn.container, lbBtn.container,
    ]);

    // ── Stagger animation ─────────────────────────────────────────────────────────
    const baseDelay   = UI.animation.fadeScene * 0.6;
    const staggerStep = 120;
    const dur         = 240;
    const offset      = 8;

    movesLabel.setAlpha(0).setY(statLabelY + offset);
    movesValue.setAlpha(0).setY(statValueY + offset);
    statDiv.setAlpha(0);
    timeLabel.setAlpha(0).setY(statLabelY + offset);
    timeValue.setAlpha(0).setY(statValueY + offset);
    restartBtn.container.setAlpha(0).setY(btnPrimaryY + offset);
    toMenuBtn.container.setAlpha(0).setY(btnGhostY + offset);
    lbBtn.container.setAlpha(0).setY(btnLbY + offset);

    this.tweens.add({ targets: movesLabel,           alpha: 1, y: statLabelY,  duration: dur, ease: 'Sine.easeOut', delay: baseDelay });
    this.tweens.add({ targets: movesValue,           alpha: 1, y: statValueY,  duration: dur, ease: 'Sine.easeOut', delay: baseDelay });
    this.tweens.add({ targets: statDiv,              alpha: 1,                 duration: dur, ease: 'Sine.easeOut', delay: baseDelay + staggerStep });
    this.tweens.add({ targets: timeLabel,            alpha: 1, y: statLabelY,  duration: dur, ease: 'Sine.easeOut', delay: baseDelay + staggerStep });
    this.tweens.add({ targets: timeValue,            alpha: 1, y: statValueY,  duration: dur, ease: 'Sine.easeOut', delay: baseDelay + staggerStep });
    this.tweens.add({ targets: restartBtn.container, alpha: 1, y: btnPrimaryY, duration: dur, ease: 'Sine.easeOut', delay: baseDelay + staggerStep * 2 });
    this.tweens.add({ targets: toMenuBtn.container,  alpha: 1, y: btnGhostY,   duration: dur, ease: 'Sine.easeOut', delay: baseDelay + staggerStep * 3 });
    this.tweens.add({
      targets: lbBtn.container,
      alpha: 1, y: btnLbY,
      duration: dur, ease: 'Sine.easeOut',
      delay: baseDelay + staggerStep * 4,
      onComplete: () => {
        lbPromise.then(data => {
          if (data && this.scene.isActive('UIScene')) {
            this.showCompactLeaderboard(data, W, H, cx, cy + pH / 2, pW, localDpr);
          }
        });
        this.showAuthPromptIfNeeded(moves, W, H, cx, cy + pH / 2, pW, localDpr);
      },
    });
  }

  private async openLeaderboardOverlay(): Promise<void> {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const localDpr  = Math.min(window.devicePixelRatio || 1, 2);
    const lang: Lang = this.game.registry.get('lang') ?? 'ru';
    const L         = LOCALES[lang];
    const cx        = W / 2;
    const cy        = H / 2;
    const pW        = Math.min(W * 0.92, 486);
    const pH        = Math.min(H * 0.78, 460);
    const accentHex = '#' + UI.colors.accent.toString(16).padStart(6, '0');

    // depth 24/25 — above victory modal (21) and header elements (22)
    const backdrop = this.add.graphics().setDepth(24);
    backdrop.fillStyle(UI.colors.bgDark);
    backdrop.fillRect(0, 0, W, H);
    backdrop.setAlpha(0);
    this.tweens.add({ targets: backdrop, alpha: 0.78, duration: UI.animation.fadeScene, ease: 'Sine.easeOut' });

    const modal = this.add.container(cx, cy).setDepth(25).setAlpha(0).setScale(0.9);
    this.tweens.add({ targets: modal, alpha: 1, scale: 1, duration: UI.animation.fadeScene, ease: 'Back.easeOut' });

    const closeModal = () => {
      this.sfx('sfx-click');
      backdrop.destroy();
      modal.destroy(true);
    };

    // Panel
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(UI.panel.bg);
    panelGfx.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, UI.panel.radius);
    panelGfx.lineStyle(UI.panel.borderWidth, UI.panel.border, UI.panel.borderAlpha);
    panelGfx.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, UI.panel.radius);

    // Title
    const titleFontSize = Math.min(26, Math.floor(pW * 0.11));
    const titleY        = -pH / 2 + 28 + titleFontSize / 2;
    const titleText     = createText(this, {
      x: 0, y: titleY, text: '🏆 ' + L.lbTitle, variant: 'title', localDpr, fontSize: titleFontSize,
    });

    // Difficulty tabs
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
    let currentDiff: Difficulty = this.game.registry.get('difficulty') ?? 'medium';

    const tabH   = Math.max(22, Math.round(26 * (localDpr / 2 + 0.5)));
    const tabGap = Math.round(4 * localDpr) + 12;
    const tabW   = Math.floor((pW - tabGap * 3 - 40) / 4);
    const tabsY  = titleY + titleFontSize / 2 + 20 + tabH / 2;

    const tabHandles = new Map<Difficulty, ButtonHandle>();

    // Separator + table area
    const sepY        = tabsY + tabH / 2 + 10;
    const tableStartY = sepY + 20;
    const rowH        = Math.round(28 * (localDpr / 2 + 0.5));
    const nameFontSz  = Math.max(10, Math.floor(pW * 0.04));

    const sep = this.add.graphics();
    sep.lineStyle(1, UI.colors.accent, 0.35);
    sep.lineBetween(-pW * 0.4, sepY, pW * 0.4, sepY);

    const loadingText = createText(this, { x: 0, y: tableStartY + rowH, text: L.lbLoading, variant: 'stat', localDpr });
    const tableContainer = this.add.container(0, 0);

    // Close button
    const closeBtnH = Math.max(36, Math.round(40 * (localDpr / 2 + 0.5)));
    const closeBtnW = Math.min(pW * 0.55, 180);
    const closeBtnY = pH / 2 - closeBtnH / 2 - 16;
    const closeBtn  = createButton(this, {
      x: 0, y: closeBtnY, label: L.lbClose, onClick: closeModal,
      variant: 'ghost', fixedWidth: closeBtnW, fixedHeight: closeBtnH,
      fontSize: Math.round(11 * localDpr),
    });

    modal.add([panelGfx, titleText, sep, loadingText, tableContainer, closeBtn.container]);

    // Table render — clears and refills tableContainer
    const renderTable = async (diff: Difficulty) => {
      tableContainer.removeAll(true);
      loadingText.setVisible(true);
      const data = await fetchLeaderboard(diff);
      if (!modal.active) return;
      loadingText.setVisible(false);
      if (!data || data.rows.length === 0) {
        tableContainer.add(createText(this, { x: 0, y: tableStartY + rowH, text: '—', variant: 'stat', localDpr }));
        return;
      }
      const rowTexts: Phaser.GameObjects.Text[] = [];
      data.rows.forEach((row, i) => {
        const rowY  = tableStartY + i * (rowH + 6) + rowH / 2;
        const color = row.isPlayer ? accentHex : undefined;
        rowTexts.push(
          createText(this, { x: -(pW / 2 - 20), y: rowY, text: `#${row.rank}`,    variant: 'timer', localDpr, fontSize: nameFontSz, color }),
          createText(this, { x:  0,             y: rowY, text: row.name,          variant: 'stat',  localDpr, fontSize: nameFontSz, color }),
          createText(this, { x:  pW / 2 - 20,  y: rowY, text: String(row.score), variant: 'timer', localDpr, fontSize: nameFontSz, color }),
        );
      });
      tableContainer.add(rowTexts);
    };

    const switchDiff = (diff: Difficulty) => {
      currentDiff = diff;
      tabHandles.forEach((handle, d) => handle.setActive(d === diff));
      renderTable(diff);
    };

    // Create tab buttons
    difficulties.forEach((diff, i) => {
      const tx     = -pW / 2 + 20 + i * (tabW + tabGap) + tabW / 2;
      const handle = createButton(this, {
        x: tx, y: tabsY,
        label:       L.diffLabels[diff],
        onClick:     () => { this.sfx('sfx-click'); switchDiff(diff); },
        variant:     'primary',
        active:      diff === currentDiff,
        noAutoScale: true,
        fixedWidth:  tabW,
        fixedHeight: tabH,
        fontSize:    Math.round(11 * localDpr),
      });
      tabHandles.set(diff, handle);
      modal.add(handle.container);
    });

    await renderTable(currentDiff);
  }

  private showCompactLeaderboard(
    data:         LeaderboardData,
    _W:           number,
    H:            number,
    cx:           number,
    modalBottomY: number,
    pW:           number,
    localDpr:     number,
  ): void {
    const accentHex = '#' + UI.colors.accent.toString(16).padStart(6, '0');

    // Find player and neighbors, or show top 3
    const playerIdx  = data.rows.findIndex(r => r.isPlayer);
    const displayRows = playerIdx === -1
      ? data.rows.slice(0, 3)
      : data.rows.slice(Math.max(0, playerIdx - 1), playerIdx + 2);

    if (displayRows.length === 0) return;

    const nameFontSz = Math.max(10, Math.floor(pW * 0.038));
    const rowH       = Math.round(24 * (localDpr / 2 + 0.5));
    const padV       = 8;
    const panelH     = displayRows.length * rowH + displayRows.length * 4 + padV * 2;
    const panelGap   = 10;
    const panelCy    = modalBottomY + panelGap + panelH / 2;

    if (panelCy + panelH / 2 > H - 8) return;

    const lbContainer = this.add.container(cx, panelCy).setDepth(21).setAlpha(0);

    const bg = this.add.graphics();
    bg.fillStyle(UI.panel.bg);
    bg.fillRoundedRect(-pW / 2, -panelH / 2, pW, panelH, UI.panel.radius);
    bg.lineStyle(UI.panel.borderWidth, UI.panel.border, UI.panel.borderAlpha * 0.5);
    bg.strokeRoundedRect(-pW / 2, -panelH / 2, pW, panelH, UI.panel.radius);

    const rowTexts: Phaser.GameObjects.Text[] = [];
    displayRows.forEach((row, i) => {
      const rowY  = -panelH / 2 + padV + i * (rowH + 4) + rowH / 2;
      const color = row.isPlayer ? accentHex : undefined;
      rowTexts.push(
        createText(this, { x: -pW * 0.36, y: rowY, text: `#${row.rank}`,     variant: 'timer', localDpr, fontSize: nameFontSz, color }),
        createText(this, { x:  pW * 0.02, y: rowY, text: row.name,            variant: 'stat',  localDpr, fontSize: nameFontSz, color }),
        createText(this, { x:  pW * 0.40, y: rowY, text: String(row.score),   variant: 'timer', localDpr, fontSize: nameFontSz, color }),
      );
    });

    lbContainer.add([bg, ...rowTexts]);

    this.tweens.add({
      targets: lbContainer, alpha: 1,
      duration: 240, ease: 'Sine.easeOut',
    });
  }

  private showAuthPromptIfNeeded(
    moves:        number,
    _W:           number,
    H:            number,
    cx:           number,
    modalBottomY: number,
    pW:           number,
    localDpr:     number,
  ): void {
    if (this.game.registry.get('authPromptShown')) return;
    const sdk = getYSDK();
    if (!sdk) return;

    sdk.getPlayer({ scopes: false }).then(player => {
      if (player.getMode() !== 'lite') return;
      if (!this.scene.isActive('UIScene')) return;

      this.game.registry.set('authPromptShown', true);

      const btnH = Math.max(36, Math.round(40 * (localDpr / 2 + 0.5)));
      const btnW = Math.min(pW * 0.85, 280);
      const estimatedLbH = 100;
      const btnCy = modalBottomY + estimatedLbH + 12 + btnH / 2;

      if (btnCy + btnH / 2 > H - 8) return;

      const lang: Lang = this.game.registry.get('lang') ?? 'ru';
      const L = LOCALES[lang];

      const btn = createButton(this, {
        x: cx, y: btnCy,
        label:      L.loginToSave,
        onClick:    () => {
          sdk.auth.openAuthDialog().then(result => {
            if (result.action !== 'login') return;
            sdk.getPlayer({ scopes: false }).then(p => {
              if (p.getMode() === 'lite') return;
              const diff: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
              const lastMoves: number = this.game.registry.get('lastScore') ?? moves;
              sdk.leaderboards?.setLeaderboardScore(diff, SCORE_BASE - lastMoves).catch(() => {});
            });
          }).catch(() => {});
        },
        variant:    'ghost',
        fixedWidth: btnW,
        fixedHeight: btnH,
        fontSize:   Math.round(10 * localDpr),
      });

      btn.container.setDepth(21).setAlpha(0);
      this.tweens.add({ targets: btn.container, alpha: 1, duration: 240, ease: 'Sine.easeOut' });
    }).catch(() => {});
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