import Phaser from 'phaser';
import { C } from '../constants';
import { CUSTOM_ASSETS } from '../assets-config';
import { LOCALES } from '../i18n';
import type { Lang } from '../i18n';
import { saveLang, saveSoundEnabled, SUPPORTED } from '../settings';
import { type Difficulty } from '../layout';

export class MenuScene extends Phaser.Scene {
  private difficulty: Difficulty = 'medium';
  private soundEnabled = true;
  private lang: Lang = 'ru';
  private fromResize = false;

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

    // Purge gradient textures from previous layout (sizes change on resize)
    this.textures.getTextureKeys()
      .filter(k => k.startsWith('gbt_'))
      .forEach(k => this.textures.remove(k));

    const W = this.scale.width;
    const H = this.scale.height;

    this.drawBackground(W, H);
    this.createUI(W, H);

    // Start music on first user interaction (autoplay policy)
    const audioManager: import('../AudioManager').AudioManager | undefined =
      this.game.registry.get('audioManager');
    if (audioManager) {
      this.input.once('pointerdown', () => audioManager.play());
    }

    if (!this.fromResize) {
      this.cameras.main.fadeIn(300, 7, 21, 40);
    }

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
    if (CUSTOM_ASSETS.bg && this.textures.exists('bg')) {
      this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H);
      return;
    }
    const g = this.add.graphics();
    g.fillStyle(C.bgDark);
    g.fillRect(0, 0, W, H);
    const cx = W / 2;
    const cy = H * 0.45;
    for (let i = 6; i >= 0; i--) {
      g.fillStyle(C.ocean, 0.03 * (7 - i));
      g.fillEllipse(cx, cy, W * 0.7 * (i / 6 + 0.4), H * 0.5 * (i / 6 + 0.4));
    }
    g.lineStyle(1, C.teal, 0.08);
    for (let row = 0; row < 5; row++) {
      const y = H * 0.75 + row * 18;
      g.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const wy = y + Math.sin((x / W) * Math.PI * 6 + row) * 4;
        x === 0 ? g.moveTo(x, wy) : g.lineTo(x, wy);
      }
      g.strokePath();
    }
    g.lineStyle(1, C.teal, 0.15);
    g.strokeRect(16, 16, W - 32, H - 32);
  }

  private createUI(W: number, H: number) {
    // Read current DPR at scene-create time so DevTools device switches work correctly
    const localDpr = Math.min(window.devicePixelRatio || 1, 2);
    // CSS viewport width — used to distinguish mobile from desktop
    const cssW = Math.round(W / localDpr);

    const L    = LOCALES[this.lang];
    const midX = W / 2;

    const titleY = H * 0.16;
    let diffY  = H * 0.38;
    let soundY = H * 0.62;
    let playY  = H * 0.8;

    const diffRadius = 16;
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
      const lx = lStartX + col * (lBtnW + lGap);
      const ly = lY + row * (lBtnH + lGap);
      const active = lng === this.lang;
      const lBg = this.add.graphics().setDepth(5);
      lBg.fillStyle(active ? C.teal : C.bgMid, active ? 1 : 0.8);
      lBg.fillRoundedRect(lx, ly, lBtnW, lBtnH, 5);
      lBg.lineStyle(1, active ? C.teal : C.ocean);
      lBg.strokeRoundedRect(lx, ly, lBtnW, lBtnH, 5);

      this.add.text(lx + lBtnW / 2, ly + lBtnH / 2, lng.toUpperCase(), {
        fontSize: `${Math.round(10 * localDpr)}px`,
        color: '#ffffff',
        fontFamily: 'Rubik',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(5);

      if (!active) {
        const zone = this.add.zone(lx + lBtnW / 2, ly + lBtnH / 2, lBtnW, lBtnH).setInteractive().setDepth(5);
        zone.on('pointerdown', () => {
          this.sfx('sfx-click');
          this.game.registry.set('lang', lng);
          saveLang(lng);
          this.scene.restart();
        });
      }
    });

    // ── Title ────────────────────────────────────────────────────────────────

    // On mobile CSS viewports (<600px wide) the cap is visual-size-based so DPR=1
    // tests and DPR=2 real devices produce the same proportional appearance.
    const titleMaxSz = cssW < 600 ? 28 * localDpr : 56;
    const titleText = this.add.text(midX, titleY, L.title, {
      fontSize: `${clamp(Math.floor(H * 0.075), 14, titleMaxSz)}px`,
      fontFamily: '"Indira K"',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: '#003250', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(2);

    // Вертикальный градиент: сверху #fdfacd → снизу #f7e089
    const tCtx = titleText.canvas.getContext('2d');
    if (tCtx) {
      const grad = tCtx.createLinearGradient(0, 0, 0, titleText.canvas.height);
      grad.addColorStop(0, '#fdfacd');
      grad.addColorStop(1, '#f7e089');
      titleText.setFill(grad as unknown as string);
    }
    // Scale down uniformly if text overflows canvas width (narrow screens)
    const titleMaxW = W * 0.9;
    if (titleText.width > titleMaxW) {
      titleText.setScale(titleMaxW / titleText.width);
    }

    // Картинка за текстом — центрируется по центру заголовка, ширина подгоняется под текст
    const titleBgImg = this.add.image(titleText.x, titleText.y, 'title-bg')
      .setOrigin(0.5)
      .setDepth(1);
    titleBgImg.setScale(Math.max(titleText.displayWidth * 1.5, Math.min(650, W * 0.85)) / titleBgImg.width);

    const subtitleMaxSz = cssW < 600 ? 14 * localDpr : 28;
    const subtitleText = this.add.text(midX, titleBgImg.y + titleBgImg.displayHeight / 2 + 8, L.subtitle.toUpperCase(), {
      fontSize: `${clamp(Math.floor(H * 0.05), 10, subtitleMaxSz)}px`,
      color: '#01286a',
      fontFamily: '"Indira K"',
    }).setOrigin(0.5);
    // Scale down uniformly if subtitle overflows canvas width (narrow screens)
    const subtitleMaxW = W * 0.88;
    if (subtitleText.width > subtitleMaxW) {
      subtitleText.setScale(subtitleMaxW / subtitleText.width);
    }


    // diffY привязан к subtitle: его нижний край + 50px + отступ под лейбл сложности
    diffY = subtitleText.y + subtitleText.height / 2 + 90 + Math.max(H * 0.05, btnH / 2 + 14);

    // ── Difficulty ───────────────────────────────────────────────────────────
    this.add.text(midX, diffY - btnH / 2 - 32, L.difficulty, {
      fontSize: `${Math.round(18 * localDpr)}px`,
      color: '#F5F5F0',
      fontFamily: 'Rubik',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.9)', blur: 10, fill: true },
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setLetterSpacing(Math.round(18 * 0.3 * localDpr));

    const totalBtnW = btnW * 4 + gap * 3;
    const btnStartX = midX - totalBtnW / 2;

    const hintText = this.add.text(midX, diffY + btnH / 2 + 32, L.diffHint[this.difficulty], {
      fontSize: `${Math.round(16 * localDpr)}px`,
      color: '#ffffffe6',
      fontFamily: 'Rubik',
    }).setOrigin(0.5);

    const diffRedrawFns = new Map<Difficulty, (selected: boolean, hover?: boolean) => void>();
    (['easy', 'medium', 'hard', 'expert'] as Difficulty[]).forEach((diff, i) => {
      const bx = btnStartX + i * (btnW + gap);
      const by = diffY - btnH / 2;
      // fillImg must be added before bg so the gradient renders below the border/ring
      const fillImg = this.add.image(bx + btnW / 2, by + btnH / 2, '__DEFAULT').setOrigin(0.5);
      const bg = this.add.graphics();

      const lblSz = clamp(Math.round(btnW * 0.1), Math.round(7 * localDpr), 16);
      const dscSz = clamp(Math.round(btnW * 0.088), Math.round(6 * localDpr), 14);

      this.add.text(bx + btnW / 2, by + btnH * 0.36, L.diffLabels[diff], {
        fontSize: `${lblSz}px`,
        color: '#F5E6C8',
        fontFamily: 'Rubik',
        fontStyle: 'bold',
      }).setOrigin(0.5).setLetterSpacing(1);

      this.add.text(bx + btnW / 2, by + btnH * 0.36 + lblSz + 8, L.diffDesc[diff], {
        fontSize: `${dscSz}px`,
        color: '#ffffffb3',
        fontFamily: 'Rubik',
      }).setOrigin(0.5);

      const redraw = (selected: boolean, hover = false) => {
        const state = selected ? 'active' : hover ? 'hover' : 'inactive';
        this.drawDeepBtn(bg, bx, by, btnW, btnH, state, diffRadius, false, fillImg);
      };
      diffRedrawFns.set(diff, redraw);
      redraw(this.difficulty === diff);

      const zone = this.add.zone(bx + btnW / 2, by + btnH / 2, btnW, btnH).setInteractive();
      zone.on('pointerover',  () => { if (this.difficulty !== diff) redraw(false, true); });
      zone.on('pointerout',   () => { if (this.difficulty !== diff) redraw(false, false); });
      zone.on('pointerdown',  () => {
        this.sfx('sfx-click');
        this.difficulty = diff;
        diffRedrawFns.forEach((fn, d) => fn(d === diff));
        hintText.setText(L.diffHint[diff]);
      });
    });

    // soundY привязан к hintText: его нижний край + 40px + отступ под лейбл звука
    soundY = hintText.y + hintText.height / 2 + 40 + Math.max(H * 0.04, sH / 2 + 14);

    // playY привязан к soundY; на десктопе оба сдвигаются вниз до H-200
    const pW = clamp(Math.floor(W * 0.5), 180, 280);
    const pH = clamp(Math.floor(H * 0.08), 44, 58);
    playY = soundY + sH / 2 + 40 + pH / 2;
    const minPlayY = H - 200;
    if (playY < minPlayY) {
      const shift = minPlayY - playY;
      soundY += shift;
      playY  += shift;
    }

    // ── Sound toggle ─────────────────────────────────────────────────────────
    const sW = clamp(Math.floor(W * 0.38), 120, 180);
    const soundRadius = 16;
    const sx = midX - sW / 2;
    const sy = soundY - sH / 2;

    this.add.text(midX, soundY - sH / 2 - 28, L.sound, {
      fontSize: `${Math.round(18 * localDpr)}px`,
      color: '#F5F5F0',
      fontFamily: 'Rubik',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.9)', blur: 10, fill: true },
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setLetterSpacing(Math.round(18 * 0.3 * localDpr));

    // fillImg first so it renders below the border/ring Graphics
    const soundFillImg = this.add.image(midX, soundY, '__DEFAULT').setOrigin(0.5);
    const soundBg  = this.add.graphics();
    const soundTxt = this.add.text(midX, soundY, '', {
      fontSize: '16px',
      color: '#F5E6C8',
      fontFamily: 'Rubik',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const redrawSound = (on: boolean, hover = false) => {
      const state = on ? 'active' : hover ? 'hover' : 'inactive';
      this.drawDeepBtn(soundBg, sx, sy, sW, sH, state, soundRadius, false, soundFillImg);
      soundTxt.setText(on ? L.soundOn : L.soundOff);
      soundTxt.setColor(on ? '#F5E6C8' : 'rgba(245,230,200,0.6)');
    };
    redrawSound(this.soundEnabled);

    const soundZone = this.add.zone(midX, soundY, sW, sH).setInteractive();
    soundZone.on('pointerover',  () => redrawSound(this.soundEnabled, true));
    soundZone.on('pointerout',   () => redrawSound(this.soundEnabled, false));
    soundZone.on('pointerdown',  () => {
      this.sfx('sfx-click');
      this.soundEnabled = !this.soundEnabled;
      redrawSound(this.soundEnabled);
      saveSoundEnabled(this.soundEnabled);
      const am: import('../AudioManager').AudioManager | undefined =
        this.game.registry.get('audioManager');
      am?.setMuted(!this.soundEnabled);
    });

    // ── Play button ──────────────────────────────────────────────────────────
    const playRadius = 16;

    // Container at button center: scale tween expands all children symmetrically
    const playContainer = this.add.container(midX, playY);
    const playFillImg = this.add.image(0, 0, '__DEFAULT').setOrigin(0.5);
    const playBg = this.add.graphics();
    const playTxt = this.add.text(0, 0, L.play, {
      fontSize: `${clamp(Math.floor(pH * 0.38), 16, 22)}px`,
      color: '#F5E6C8',
      fontFamily: 'Rubik',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    playContainer.add([playFillImg, playBg, playTxt]);

    // Draw at local coordinates (origin = container center = button center)
    const drawPlay = (hover: boolean) => {
      this.drawDeepBtn(playBg, -pW / 2, -pH / 2, pW, pH, hover ? 'hover' : 'active', playRadius, true, playFillImg);
      // Hover: gradient+border change; gold ring always shown (as in CSS active class)
      if (hover) {
        playBg.lineStyle(2, 0xD4A853, 0.7);
        playBg.strokeRoundedRect(-pW / 2 - 3, -pH / 2 - 3, pW + 6, pH + 6, playRadius + 2);
      }
    };
    drawPlay(false);

    const playZone = this.add.zone(midX, playY, pW, pH).setInteractive();
    playZone.on('pointerover', () => {
      drawPlay(true);
      this.tweens.killTweensOf(playContainer);
      this.tweens.add({ targets: playContainer, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Cubic.easeOut' });
    });
    playZone.on('pointerout', () => {
      drawPlay(false);
      this.tweens.killTweensOf(playContainer);
      this.tweens.add({ targets: playContainer, scaleX: 1, scaleY: 1, duration: 150, ease: 'Cubic.easeOut' });
    });
    playZone.on('pointerdown', () => { this.sfx('sfx-click'); this.startGame(); });

  }

  private sfx(key: string) {
    const am: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
    am?.playSfx(key);
  }

  /**
   * Draw a Deep Sea palette button background.
   * Active state renders the button 5% larger (desktop) / 2% (mobile), centered.
   * When fillImg is provided, gradient is rendered via CanvasTexture (works in WebGL);
   * otherwise a solid-fill fallback is used.
   */
  private drawDeepBtn(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    state: 'inactive' | 'active' | 'hover',
    radius: number,
    noAutoScale = false,
    fillImg?: Phaser.GameObjects.Image,
  ): void {
    g.clear();

    const isMobile = this.scale.width < 768;
    const scale = (!noAutoScale && state === 'active') ? (isMobile ? 1.02 : 1.05) : 1;
    const sw = Math.round(w * scale);
    const sh = Math.round(h * scale);
    const sx = Math.round(x - (sw - w) / 2);
    const sy = Math.round(y - (sh - h) / 2);
    const sr = Math.round(radius * scale);

    if (fillImg) {
      // Gradient via pre-rendered CanvasTexture — works correctly in both WebGL and Canvas
      const texKey = this.getGradTexture(sw, sh, sr, state);
      fillImg.setTexture(texKey).setDisplaySize(sw, sh);
      // Center stays at x + w/2, y + h/2 regardless of scale (scale expands from center)
      fillImg.setPosition(x + w / 2, y + h / 2);
    } else {
      // Solid fill fallback
      if (state === 'active') {
        g.fillStyle(0x0A3D7A, 0.92);
      } else if (state === 'hover') {
        g.fillStyle(0x02347a, 0.87);
      } else {
        g.fillStyle(0x01286a, 0.82);
      }
      g.fillRoundedRect(sx, sy, sw, sh, sr);

      // Inner top highlight (CSS: inset 0 1px 0 rgba(255,255,255,0.1/0.15))
      g.lineStyle(1, 0xffffff, state === 'active' ? 0.15 : 0.1);
      g.beginPath();
      g.moveTo(sx + sr, sy + 1);
      g.lineTo(sx + sw - sr, sy + 1);
      g.strokePath();
    }

    // Gold border (1px)
    const borderAlpha = state === 'active' ? 0.5 : state === 'hover' ? 0.35 : 0.2;
    g.lineStyle(1, 0xD4A853, borderAlpha);
    g.strokeRoundedRect(sx, sy, sw, sh, sr);

    // Gold ring — 2px, 3px outside border (active only)
    if (state === 'active') {
      g.lineStyle(2, 0xD4A853, 0.7);
      g.strokeRoundedRect(sx - 3, sy - 3, sw + 6, sh + 6, sr + 2);
    }
  }

  /**
   * Pre-render gradient + inner highlight into a CanvasTexture, cached by key.
   * The texture is clipped to a rounded rectangle with the specified radius.
   */
  private getGradTexture(w: number, h: number, radius: number, state: 'inactive' | 'active' | 'hover'): string {
    const key = `gbt_${state}_${w}_${h}_${radius}`;
    if (this.textures.exists(key)) return key;

    const canvasTex = this.textures.createCanvas(key, w, h) as Phaser.Textures.CanvasTexture;
    const ctx = canvasTex.getContext();

    // Clip to rounded rectangle path
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(w - radius, 0);
    ctx.arcTo(w, 0, w, radius, radius);
    ctx.lineTo(w, h - radius);
    ctx.arcTo(w, h, w - radius, h, radius);
    ctx.lineTo(radius, h);
    ctx.arcTo(0, h, 0, h - radius, radius);
    ctx.lineTo(0, radius);
    ctx.arcTo(0, 0, radius, 0, radius);
    ctx.closePath();
    ctx.clip();

    // Vertical gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (state === 'active') {
      grad.addColorStop(0, 'rgba(10,61,122,0.92)');
      grad.addColorStop(1, 'rgba(1,40,106,0.95)');
    } else if (state === 'hover') {
      grad.addColorStop(0, 'rgba(2,52,122,0.87)');
      grad.addColorStop(1, 'rgba(1,35,88,0.90)');
    } else {
      grad.addColorStop(0, 'rgba(1,40,106,0.82)');
      grad.addColorStop(1, 'rgba(1,29,74,0.85)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Inner top highlight (inset 0 1px 0 rgba(255,255,255,...))
    ctx.strokeStyle = `rgba(255,255,255,${state === 'active' ? 0.15 : 0.10})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(radius, 1.5);
    ctx.lineTo(w - radius, 1.5);
    ctx.stroke();

    canvasTex.refresh();
    return key;
  }

  private startGame() {
    this.game.registry.set('difficulty',   this.difficulty);
    this.game.registry.set('soundEnabled', this.soundEnabled);
    this.game.registry.set('lang',         this.lang);
    this.cameras.main.fadeOut(300, 7, 21, 40);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
  }
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}