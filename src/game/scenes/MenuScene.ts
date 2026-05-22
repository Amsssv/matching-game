import Phaser from 'phaser';
import { LOCALES } from '../i18n';
import type { Lang } from '../i18n';
import { getYSDK } from '../../ysdk';
import { openLeaderboardModal } from '../ui/leaderboardModal';
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

    // Show sticky banner while in menu, but hide it in mobile landscape where it
    // would crop game elements (Yandex rules 1.10.1 + 1.6.2.3). Hidden when scene
    // leaves either way.
    const sdk = getYSDK();
    const isMobileLandscape = isMobileDevice() && W > H;
    if (!isMobileLandscape) {
      sdk?.adv.showBannerAdv();
    } else {
      sdk?.adv.hideBannerAdv();
    }
    this.events.once('shutdown', () => {
      getYSDK()?.adv.hideBannerAdv();
    });

    // Game.tsx now tracks window.resize and updates the container div when DPR changes.
    // That triggers Phaser's ScaleManager (via ResizeObserver) to resize the canvas and
    // emit 'resize' — so this.scale.on('resize') reliably catches DevTools device switches.
    // Using Phaser's event (not window.resize) avoids spurious restarts from mobile browser
    // viewport changes (iOS address bar, keyboard) that don't affect the Phaser canvas.
    //
    // Yandex rule 1.14: iOS Safari emits a storm of resize events during orientation
    // changes. The previous 150ms debounce was too short — multiple scene.restart()
    // calls would queue and stall the main thread. We now wait 400ms and ignore
    // micro-changes (< 6px on either axis) to avoid spurious restarts from the
    // iOS address bar collapsing or the soft keyboard appearing.
    let resizeTimer: Phaser.Time.TimerEvent | null = null;
    let lastSeenW = W;
    let lastSeenH = H;
    const onResize = (gameSize: Phaser.Structs.Size) => {
      const nw = gameSize.width;
      const nh = gameSize.height;
      if (Math.abs(nw - lastSeenW) < 6 && Math.abs(nh - lastSeenH) < 6) return;
      lastSeenW = nw;
      lastSeenH = nh;
      if (resizeTimer) resizeTimer.remove();
      resizeTimer = this.time.delayedCall(400, () => this.scene.restart({ fromResize: true }));
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
          document.title = LOCALES[lng].title;
          document.documentElement.lang = lng;
          document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', LOCALES[lng].description);
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
    const isMobile          = isMobileDevice();
    // Portrait mobile = vertical stack; landscape mobile or desktop = single row.
    // For very short screens (mobile landscape ≤ 560px tall) we further switch to
    // a 2×2 grid so the play/sound/leaderboard stack still fits below.
    // Yandex rules 1.6.2.3 (desktop & mobile) + 1.10.1 (iOS banner crop) demand
    // that nothing falls off the bottom even at 430-CSS-px landscape heights.
    const usePortraitMobile = isMobile && H >= W;
    const useTwoColGrid     = !usePortraitMobile && H < 560;
    const mobileBtnW = usePortraitMobile ? Math.floor(W * 0.80) : btnW;
    const btnGapV = 10;
    const diffBtnH = usePortraitMobile
      ? clamp(Math.floor(H * 0.137), 70, 86)
      : (useTwoColGrid ? clamp(Math.floor(H * 0.13), 44, 64) : btnH);

    const diffLabelY = usePortraitMobile
      ? Math.max(H / 2 - 27 - 2 * diffBtnH, subtitleText.y + subtitleText.height / 2 + 24)
      : subtitleText.y + subtitleText.height / 2 + clamp(Math.floor(H * 0.07), useTwoColGrid ? 16 : 48, 90);
    const diffLabel  = createText(this, {
      x: midX, y: diffLabelY,
      text: L.difficulty, variant: 'sectionLabel', localDpr,
    });

    const row0Y = diffLabel.y + diffLabel.height / 2 + (useTwoColGrid ? 12 : 24) + diffBtnH / 2;
    // diffBottomY = Y of last row of buttons (so we can place the hint below)
    const diffBottomY = usePortraitMobile
      ? row0Y + 3 * (diffBtnH + btnGapV)
      : (useTwoColGrid ? row0Y + 1 * (diffBtnH + btnGapV) : row0Y);

    const hintText = createText(this, {
      x: midX, y: diffBottomY + diffBtnH / 2 + (useTwoColGrid ? 12 : 32),
      text: L.diffHint[this.difficulty],
      variant: 'hint', localDpr,
    });

    const lblSzBase = clamp(Math.round(mobileBtnW * 0.1), Math.round(7 * localDpr), 16);
    const lblSz = usePortraitMobile ? Math.round(lblSzBase * 1.5) : lblSzBase;
    const diffHandles = new Map<Difficulty, ButtonHandle>();
    (['easy', 'medium', 'hard', 'expert'] as Difficulty[]).forEach((diff, i) => {
      let bx: number, by: number;
      if (usePortraitMobile) {
        bx = midX;
        by = row0Y + i * (diffBtnH + btnGapV);
      } else if (useTwoColGrid) {
        // 2×2 — column index = i % 2, row index = floor(i / 2)
        const gridW = btnW * 2 + gap;
        const col = i % 2;
        const row = Math.floor(i / 2);
        bx = midX - gridW / 2 + col * (btnW + gap) + btnW / 2;
        by = row0Y + row * (diffBtnH + btnGapV);
      } else {
        const gridW = btnW * 4 + gap * 3;
        bx = midX - gridW / 2 + i * (btnW + gap) + btnW / 2;
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
        fixedWidth:  usePortraitMobile ? mobileBtnW : btnW,
        fixedHeight: diffBtnH,
        fontSize:    lblSz,
      });
      diffHandles.set(diff, handle);
    });

    // ── Play + Sound + Leaderboard layout ───────────────────────────────────
    const pW = clamp(Math.floor(W * 0.5), 180, 280);
    const pH = useTwoColGrid
      ? clamp(Math.floor(H * 0.10), 36, 48)
      : clamp(Math.floor(H * 0.08), 44, 58);
    const lbH = usePortraitMobile ? Math.round(pH) : Math.round(pH / 1.5);

    let playY: number, soundLabelY: number, soundY: number, lbBtnY: number;

    if (usePortraitMobile) {
      // Anchor from bottom: lb → sound button → sound label → play button
      lbBtnY      = H - 56 - lbH / 2;
      soundY      = lbBtnY - lbH / 2 - 24 - sH / 2;
      soundLabelY = soundY - sH / 2 - 16 - 10;
      playY       = soundLabelY - 10 - 36 - pH / 2;

      // On small screens recompute top-down if play button would overlap difficulty hint
      const minPlayY = hintText.y + hintText.height / 2 + 24 + pH / 2;
      if (playY < minPlayY) {
        playY       = minPlayY;
        soundLabelY = playY       + pH / 2 + 36 + 10;
        soundY      = soundLabelY + 10 + 16 + sH / 2;
        lbBtnY      = soundY      + sH / 2 + 24 + lbH / 2;
      }
    } else if (useTwoColGrid) {
      // Compact landscape (short height): pack tightly from the bottom up,
      // then clamp so nothing falls off-screen.
      const bottomPad = 12;
      lbBtnY      = H - bottomPad - lbH / 2;
      soundY      = lbBtnY - lbH / 2 - 10 - sH / 2;
      soundLabelY = soundY - sH / 2 - 10 - 8;
      playY       = soundLabelY - 8 - 14 - pH / 2;

      // Ensure stack doesn't overlap the difficulty hint
      const minPlayY = hintText.y + hintText.height / 2 + 12 + pH / 2;
      if (playY < minPlayY) {
        playY       = minPlayY;
        soundLabelY = playY       + pH / 2 + 14 + 8;
        soundY      = soundLabelY + 8 + 10 + sH / 2;
        lbBtnY      = soundY      + sH / 2 + 10 + lbH / 2;
      }
    } else {
      playY = Math.max(
        hintText.y + hintText.height / 2 + 40 + Math.max(H * 0.04, pH / 2 + 14),
        H - 260,
      );
      const soundGap = Math.max(24, Math.floor(H * 0.04));
      soundLabelY = playY + pH / 2 + soundGap + 10;
      soundY      = soundLabelY + 10 + 16 + sH / 2;
      lbBtnY      = soundY + sH / 2 + 14 + lbH / 2;
    }

    // Final safety: clamp the whole bottom stack within the visible area.
    // Yandex rule 1.6.2.3 — no element may extend past the bottom edge.
    const bottomBound = H - 8;
    if (lbBtnY + lbH / 2 > bottomBound) {
      const overshoot = lbBtnY + lbH / 2 - bottomBound;
      lbBtnY      -= overshoot;
      soundY      -= overshoot;
      soundLabelY -= overshoot;
      playY       -= overshoot;
    }

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

    createText(this, { x: midX, y: soundLabelY, text: L.sound, variant: 'sectionLabel', localDpr });

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
      fixedWidth:  pW,
      fixedHeight: sH,
      fontSize:    Math.round(sH * 0.38),
    });

    createButton(this, {
      x:           midX,
      y:           lbBtnY,
      label:       '🏆 ' + L.leaderboard,
      onClick:     () => { this.sfx('sfx-click'); this.openLeaderboardModal(W, H); },
      variant:     'ghost',
      fixedWidth:  pW,
      fixedHeight: lbH,
      fontSize:    Math.round(lbH * 0.4),
    });
  }

  private async openLeaderboardModal(W: number, H: number): Promise<void> {
    // Per Yandex Games rule 1.2.1: authorization only happens after explicit user
    // action on a dedicated button. We open the leaderboard as a guest and let
    // the modal show a "Login to save" CTA inside, which is the explicit action.
    await openLeaderboardModal(this, {
      W, H,
      lang:          this.lang,
      difficulty:    this.difficulty,
      backdropDepth: 20,
      modalDepth:    21,
    });
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