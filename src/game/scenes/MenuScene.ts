import Phaser from 'phaser';
import { LOCALES } from '../i18n';
import type { Lang } from '../i18n';
import { getYSDK } from '../../ysdk';
import { fetchLeaderboard } from '../leaderboard';
import { saveLang, saveSoundEnabled, SUPPORTED } from '../settings';
import { type Difficulty } from '../layout';
import { createButton, createTitle, createSubtitle, createIconButton, createText, preWarmGradients } from '../ui/factory';
import { isMobileDevice } from '../device';
import type { ButtonHandle } from '../ui/factory';
import { UI, clamp } from '../ui/config';

export class MenuScene extends Phaser.Scene {
  private difficulty: Difficulty = 'medium';
  private soundEnabled = true;
  private lang: Lang = 'ru';
  private fromResize = false;
  private lastW = 0;
  private lastH = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data?: { fromResize?: boolean }) {
    this.fromResize = data?.fromResize ?? false;
  }

  create() {
    this.difficulty   = this.game.registry.get('difficulty')   ?? 'medium';
    this.soundEnabled = this.game.registry.get('soundEnabled') ?? true;
    this.lang         = this.game.registry.get('lang')         ?? 'ru';

    const W = this.scale.width;
    const H = this.scale.height;

    if (W !== this.lastW || H !== this.lastH) {
      this.textures.getTextureKeys()
        .filter(k => k.startsWith('gbt_'))
        .forEach(k => this.textures.remove(k));
      preWarmGradients(this, W, H);
      this.lastW = W;
      this.lastH = H;
    }

    this.drawBackground(W, H);
    this.createUI(W, H);

    // Start music on first user interaction (autoplay policy)
    const audioManager: import('../AudioManager').AudioManager | undefined =
      this.game.registry.get('audioManager');
    if (audioManager) {
      this.input.once('pointerdown', () => audioManager.play());
    }

    if (!this.fromResize) {
      this.cameras.main.fadeIn(UI.animation.fadeScene, 7, 21, 40);
    }

    // Show sticky banner while in menu; hide when leaving
    getYSDK()?.adv.showBannerAdv();
    this.events.once('shutdown', () => {
      getYSDK()?.adv.hideBannerAdv();
    });

    // Game.tsx now tracks window.resize and updates the container div when DPR changes.
    // That triggers Phaser's ScaleManager (via ResizeObserver) to resize the canvas and
    // emit 'resize' — so this.scale.on('resize') reliably catches DevTools device switches.
    // Using Phaser's event (not window.resize) avoids spurious restarts from mobile browser
    // viewport changes (iOS address bar, keyboard) that don't affect the Phaser canvas.
    let resizeTimer: Phaser.Time.TimerEvent | null = null;
    const onResize = () => {
      if (resizeTimer) resizeTimer.remove();
      resizeTimer = this.time.delayedCall(150, () => this.scene.restart({ fromResize: true }));
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      resizeTimer?.remove();
    });
  }

  private drawBackground(W: number, H: number) {
    this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H);
  }

  private createUI(W: number, H: number) {
    const localDpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.round(W / localDpr);

    const L    = LOCALES[this.lang];
    const midX = W / 2;

    const gap  = clamp(Math.floor(W * 0.015), 8, 16);
    const btnW = clamp(Math.floor((W * 0.92 - gap * 3) / 4), 70, 160);
    const btnH = Math.max(64, clamp(Math.floor(H * 0.1), 60, 88));
    const sH   = clamp(Math.floor(H * 0.065), 36, 48);

    // ── Language toggle (top-right, 3×2 grid) ────────────────────────────────
    const langs: Lang[] = SUPPORTED;
    const lBtnW = Math.round(36 * localDpr), lBtnH = Math.round(24 * localDpr), lGap = Math.round(6 * localDpr);
    const lStartX = W - lBtnW * 3 - lGap * 2 - 12;
    const lY = 14;

    langs.forEach((lng, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      createIconButton(this, {
        lx:     lStartX + col * (lBtnW + lGap),
        ly:     lY + row * (lBtnH + lGap),
        w:      lBtnW,
        h:      lBtnH,
        label:  lng,
        onClick: lng === this.lang ? null : () => {
          this.sfx('sfx-click');
          this.game.registry.set('lang', lng);
          saveLang(lng);
          this.scene.restart();
        },
        active: lng === this.lang,
      });
    });

    // ── Title ────────────────────────────────────────────────────────────────
    const titleY = H * 0.16;
    const titleText = createTitle(this, { x: midX, y: titleY, text: L.title, H, W, cssW, localDpr });

    const titleBgImg = this.add.image(titleText.x, titleText.y, 'title-bg')
      .setOrigin(0.5)
      .setDepth(1);
    titleBgImg.setScale(Math.max(titleText.displayWidth * 1.5, Math.min(650, W * 0.85)) / titleBgImg.width);

    // ── Subtitle ─────────────────────────────────────────────────────────────
    const subtitleText = createSubtitle(this, {
      x:    midX,
      y:    titleBgImg.y + titleBgImg.displayHeight / 2 + 8,
      text: L.subtitle.toUpperCase(),
      H, W, cssW, localDpr,
    });

    // ── Difficulty ───────────────────────────────────────────────────────────
    const isMobile = isMobileDevice();
    const diffBtnW = isMobile
      ? clamp(Math.floor((W * 0.92 - gap) / 2), 100, 180)
      : btnW;

    // Label is anchored to the subtitle; buttons are anchored to the label.
    const diffLabelY = subtitleText.y + subtitleText.height / 2 + clamp(Math.floor(H * 0.07), 48, 90);
    const diffLabel  = createText(this, {
      x: midX, y: diffLabelY,
      text: L.difficulty, variant: 'sectionLabel', localDpr,
    });

    // Larger gap between the 2×2 cells on mobile for better tap comfort
    const mobileGap = clamp(Math.floor(H * 0.02), 16, 28);

    // Row 0 center = label bottom + 24 + half-button-height
    const row0Y       = diffLabel.y + diffLabel.height / 2 + 24 + btnH / 2;
    const row1Y       = row0Y + btnH + mobileGap;   // mobile row 1
    const diffBottomY = isMobile ? row1Y : row0Y;   // bottom row center

    const hintText = createText(this, {
      x: midX, y: diffBottomY + btnH / 2 + 32,
      text: L.diffHint[this.difficulty],
      variant: 'hint', localDpr,
    });

    // On mobile stretch buttons to fill the usable width (2 columns with one gap)
    const mobileBtnW = isMobile ? Math.floor((W * 0.92 - mobileGap) / 2) : diffBtnW;

    const lblSz = clamp(Math.round(mobileBtnW * 0.1), Math.round(7 * localDpr), 16);
    const diffHandles = new Map<Difficulty, ButtonHandle>();
    (['easy', 'medium', 'hard', 'expert'] as Difficulty[]).forEach((diff, i) => {
      let bx: number, by: number;
      if (isMobile) {
        const col   = i % 2;
        const row   = Math.floor(i / 2);
        const gridW = mobileBtnW * 2 + mobileGap;
        bx = midX - gridW / 2 + col * (mobileBtnW + mobileGap) + mobileBtnW / 2;
        by = row === 0 ? row0Y : row1Y;
      } else {
        const gridW = diffBtnW * 4 + gap * 3;
        bx = midX - gridW / 2 + i * (diffBtnW + gap) + diffBtnW / 2;
        by = row0Y;
      }
      const handle = createButton(this, {
        x:           bx,
        y:           by,
        label:       L.diffLabels[diff],
        onClick:     () => {
          this.sfx('sfx-click');
          this.difficulty = diff;
          diffHandles.forEach((h, d) => h.setActive(d === diff));
          hintText.setText(L.diffHint[diff]);
        },
        variant:     'primary',
        active:      this.difficulty === diff,
        description: L.diffDesc[diff],
        fixedWidth:  isMobile ? mobileBtnW : diffBtnW,
        fixedHeight: btnH,
        fontSize:    lblSz,
      });
      diffHandles.set(diff, handle);
    });

    // ── Sound toggle ─────────────────────────────────────────────────────────
    let soundY = hintText.y + hintText.height / 2 + 40 + Math.max(H * 0.04, sH / 2 + 14);
    const pW = clamp(Math.floor(W * 0.5), 180, 280);
    const pH = clamp(Math.floor(H * 0.08), 44, 58);
    let playY = soundY + sH / 2 + 40 + pH / 2;
    const minPlayY = H - 200;
    if (playY < minPlayY) {
      const shift = minPlayY - playY;
      soundY += shift;
      playY  += shift;
    }

    const sW = clamp(Math.floor(W * 0.38), 120, 180);

    createText(this, { x: midX, y: soundY - sH / 2 - 28, text: L.sound, variant: 'sectionLabel', localDpr });

    let soundHandle: ButtonHandle;
    soundHandle = createButton(this, {
      x:           midX,
      y:           soundY,
      label:       this.soundEnabled ? L.soundOn : L.soundOff,
      onClick:     () => {
        this.sfx('sfx-click');
        this.soundEnabled = !this.soundEnabled;
        soundHandle.setActive(this.soundEnabled);
        soundHandle.setLabel(this.soundEnabled ? L.soundOn : L.soundOff);
        saveSoundEnabled(this.soundEnabled);
        const am: import('../AudioManager').AudioManager | undefined =
          this.game.registry.get('audioManager');
        am?.setMuted(!this.soundEnabled);
      },
      variant:     'primary',
      active:      this.soundEnabled,
      fixedWidth:  sW,
      fixedHeight: sH,
      fontSize:    Math.round(sH * 0.38),
    });

    // ── Play button ──────────────────────────────────────────────────────────
    // active: true → always renders with gold gradient + ring (primary CTA)
    // noAutoScale: true → background doesn't expand on active; container tween handles it
    createButton(this, {
      x:           midX,
      y:           playY,
      label:       L.play,
      onClick:     () => { this.sfx('sfx-click'); this.startGame(); },
      variant:     'primary',
      active:      true,
      noAutoScale: true,
      fixedWidth:  pW,
      fixedHeight: pH,
    });

    // ── Leaderboard button ───────────────────────────────────────────────────
    const lbH    = Math.round(pH / 1.5);
    const lbBtnY = playY + pH / 2 + 14 + lbH / 2;

    createButton(this, {
      x:           midX,
      y:           lbBtnY,
      label:       '🏆 ' + L.leaderboard,
      onClick:     () => { this.sfx('sfx-click'); this.openLeaderboardModal(W, H); },
      variant:     'ghost',
      fixedWidth:  pW,
      fixedHeight: lbH,
    });
  }

  private async requireAuthIfNeeded(): Promise<void> {
    const sdk = getYSDK();
    if (!sdk) return;
    try {
      const player = await sdk.getPlayer({ scopes: false });
      if (player.getMode() !== 'lite') return;
      await sdk.auth.openAuthDialog();
    } catch {
      // auth unavailable or dismissed — proceed anyway
    }
  }

  private async openLeaderboardModal(W: number, H: number): Promise<void> {
    await this.requireAuthIfNeeded();

    const localDpr  = Math.min(window.devicePixelRatio || 1, 2);
    const L         = LOCALES[this.lang];
    const cx        = W / 2;
    const cy        = H / 2;
    const pW        = Math.min(W * 0.92, 486);
    const pH        = Math.min(H * 0.78, 460);
    const accentHex = '#' + UI.colors.accent.toString(16).padStart(6, '0');

    // Backdrop
    const backdrop = this.add.graphics().setDepth(20);
    backdrop.fillStyle(UI.colors.bgDark);
    backdrop.fillRect(0, 0, W, H);
    backdrop.setAlpha(0);
    this.tweens.add({ targets: backdrop, alpha: 0.78, duration: UI.animation.fadeScene, ease: 'Sine.easeOut' });

    // Modal container
    const modal = this.add.container(cx, cy).setDepth(21).setAlpha(0).setScale(0.9);
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
    let currentDiff: Difficulty = this.difficulty;

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

  private sfx(key: string) {
    const am: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
    am?.playSfx(key);
  }

  private startGame() {
    this.game.registry.set('difficulty',   this.difficulty);
    this.game.registry.set('soundEnabled', this.soundEnabled);
    this.game.registry.set('lang',         this.lang);
    this.cameras.main.fadeOut(UI.animation.fadeScene, 7, 21, 40);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
  }
}