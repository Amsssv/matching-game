import Phaser from 'phaser';
import { C, DPR, HEADER_H } from '../constants';
import { CUSTOM_ASSETS } from '../assets-config';
import { LOCALES } from '../i18n';
import type { Lang } from '../i18n';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export class MenuScene extends Phaser.Scene {
  private difficulty: Difficulty = 'medium';
  private soundEnabled = true;
  private lang: Lang = 'ru';

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.difficulty   = this.game.registry.get('difficulty')   ?? 'medium';
    this.soundEnabled = this.game.registry.get('soundEnabled') ?? true;
    this.lang         = this.game.registry.get('lang')         ?? 'ru';

    const W = this.scale.width;
    const H = this.scale.height;

    this.drawBackground(W, H);
    this.createUI(W, H);
    this.cameras.main.fadeIn(300, 7, 21, 40);

    let resizeTimer: Phaser.Time.TimerEvent | null = null;
    this.scale.on('resize', () => {
      if (resizeTimer) resizeTimer.remove();
      resizeTimer = this.time.delayedCall(150, () => this.scene.restart());
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
    const L    = LOCALES[this.lang];
    const midX = W / 2;

    const titleY = H * 0.16;
    const diffY  = H * 0.38;
    const soundY = H * 0.62;
    const playY  = H * 0.8;

    // ── Language toggle (top-right) ───────────────────────────────────────────
    const langs: Lang[] = ['ru', 'en'];
    const lBtnW = Math.round(36 * DPR), lBtnH = Math.round(24 * DPR), lGap = Math.round(6 * DPR);
    const lStartX = W - lBtnW * 2 - lGap - 12;
    const lY = 14;

    langs.forEach((lng, i) => {
      const lx = lStartX + i * (lBtnW + lGap);
      const active = lng === this.lang;
      const lBg = this.add.graphics();
      lBg.fillStyle(active ? C.teal : C.bgMid, active ? 1 : 0.8);
      lBg.fillRoundedRect(lx, lY, lBtnW, lBtnH, 5);
      lBg.lineStyle(1, active ? C.teal : C.ocean);
      lBg.strokeRoundedRect(lx, lY, lBtnW, lBtnH, 5);

      this.add.text(lx + lBtnW / 2, lY + lBtnH / 2, lng.toUpperCase(), {
        fontSize: `${Math.round(10 * DPR)}px`,
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      if (!active) {
        const zone = this.add.zone(lx + lBtnW / 2, lY + lBtnH / 2, lBtnW, lBtnH).setInteractive();
        zone.on('pointerdown', () => {
          this.game.registry.set('lang', lng);
          this.scene.restart();
        });
      }
    });

    // ── Title ────────────────────────────────────────────────────────────────
    this.add.text(midX, titleY, L.title, {
      fontSize: `${clamp(Math.floor(H * 0.075), 28, 56)}px`,
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(midX, titleY + clamp(Math.floor(H * 0.055), 22, 40), L.subtitle, {
      fontSize: `${clamp(Math.floor(H * 0.025), 12, 18)}px`,
      color: '#e0f0ff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const sepY = titleY + clamp(Math.floor(H * 0.09), 36, 60);
    const sepW = Math.min(W * 0.55, 320);
    const gSep = this.add.graphics();
    gSep.lineStyle(1, C.teal, 0.25);
    gSep.lineBetween(midX - sepW / 2, sepY, midX + sepW / 2, sepY);

    const btnW = clamp(Math.floor(W * 0.18), 70, 120);
    const btnH = clamp(Math.floor(H * 0.09), 44, 64);

    // ── Difficulty ───────────────────────────────────────────────────────────
    this.add.text(midX, diffY - Math.max(H * 0.05, btnH / 2 + 14), L.difficulty, {
      fontSize: `${Math.round(12 * DPR)}px`,
      color: '#e0f0ff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setLetterSpacing(3);
    const gap  = clamp(Math.floor(W * 0.015), 6, 12);
    const totalBtnW = btnW * 4 + gap * 3;
    const btnStartX = midX - totalBtnW / 2;

    const hintText = this.add.text(midX, diffY + btnH * 0.55 + 14, L.diffHint[this.difficulty], {
      fontSize: `${Math.round(12 * DPR)}px`,
      color: '#e0f0ff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const diffRedrawFns = new Map<Difficulty, (selected: boolean) => void>();
    (['easy', 'medium', 'hard', 'expert'] as Difficulty[]).forEach((diff, i) => {
      const bx = btnStartX + i * (btnW + gap);
      const by = diffY - btnH / 2;
      const bg = this.add.graphics();

      const labelText = this.add.text(bx + btnW / 2, by + btnH * 0.38, L.diffLabels[diff], {
        fontSize: `${clamp(Math.floor(btnH * 0.27), 12, 16)}px`,
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(bx + btnW / 2, by + btnH * 0.7, L.diffDesc[diff], {
        fontSize: `${clamp(Math.floor(btnH * 0.18), 9, 12)}px`,
        color: '#b8d8f0',
        fontFamily: 'Arial',
      }).setOrigin(0.5);

      const redraw = (selected: boolean) => {
        bg.clear();
        if (selected) {
          bg.fillStyle(C.teal, 0.15);
          bg.fillRoundedRect(bx, by, btnW, btnH, 8);
          bg.lineStyle(2, C.teal);
          bg.strokeRoundedRect(bx, by, btnW, btnH, 8);
          labelText.setColor('#ffffff');
        } else {
          bg.fillStyle(C.bgMid, 0.8);
          bg.fillRoundedRect(bx, by, btnW, btnH, 8);
          bg.lineStyle(1, C.ocean);
          bg.strokeRoundedRect(bx, by, btnW, btnH, 8);
          labelText.setColor('#e0f0ff');
        }
      };
      diffRedrawFns.set(diff, redraw);
      redraw(this.difficulty === diff);

      const zone = this.add.zone(bx + btnW / 2, by + btnH / 2, btnW, btnH).setInteractive();
      zone.on('pointerdown', () => {
        this.difficulty = diff;
        diffRedrawFns.forEach((fn, d) => fn(d === diff));
        hintText.setText(L.diffHint[diff]);
      });
    });

    // ── Sound toggle ─────────────────────────────────────────────────────────
    const sW = clamp(Math.floor(W * 0.38), 120, 180);
    const sH = clamp(Math.floor(H * 0.065), 36, 48);
    const sx = midX - sW / 2;
    const sy = soundY - sH / 2;

    this.add.text(midX, soundY - Math.max(H * 0.04, sH / 2 + 14), L.sound, {
      fontSize: `${Math.round(12 * DPR)}px`,
      color: '#e0f0ff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setLetterSpacing(3);

    const soundBg  = this.add.graphics();
    const soundTxt = this.add.text(midX, soundY, '', {
      fontSize: `${clamp(Math.floor(sH * 0.33), 12, 16)}px`,
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const redrawSound = (on: boolean) => {
      soundBg.clear();
      if (on) {
        soundBg.fillStyle(C.teal, 0.15);
        soundBg.fillRoundedRect(sx, sy, sW, sH, 8);
        soundBg.lineStyle(2, C.teal);
        soundBg.strokeRoundedRect(sx, sy, sW, sH, 8);
        soundTxt.setText(L.soundOn).setColor('#ffffff');
      } else {
        soundBg.fillStyle(C.bgMid, 0.8);
        soundBg.fillRoundedRect(sx, sy, sW, sH, 8);
        soundBg.lineStyle(1, C.ocean);
        soundBg.strokeRoundedRect(sx, sy, sW, sH, 8);
        soundTxt.setText(L.soundOff).setColor('#e0f0ff');
      }
    };
    redrawSound(this.soundEnabled);

    const soundZone = this.add.zone(midX, soundY, sW, sH).setInteractive();
    soundZone.on('pointerdown', () => {
      this.soundEnabled = !this.soundEnabled;
      redrawSound(this.soundEnabled);
    });

    // ── Play button ──────────────────────────────────────────────────────────
    const pW = clamp(Math.floor(W * 0.5), 180, 280);
    const pH = clamp(Math.floor(H * 0.08), 44, 58);
    const px = midX - pW / 2;
    const py = playY - pH / 2;

    const playBg  = this.add.graphics();
    const playTxt = this.add.text(midX, playY, L.play, {
      fontSize: `${clamp(Math.floor(pH * 0.38), 16, 22)}px`,
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const drawPlay = (hover: boolean) => {
      playBg.clear();
      playBg.fillStyle(hover ? C.coral : C.teal);
      playBg.fillRoundedRect(px, py, pW, pH, 10);
    };
    drawPlay(false);

    const playZone = this.add.zone(midX, playY, pW, pH).setInteractive();
    playZone.on('pointerover', () => {
      drawPlay(true);
      this.tweens.add({ targets: playTxt, scaleX: 1.04, scaleY: 1.04, duration: 100 });
    });
    playZone.on('pointerout', () => {
      drawPlay(false);
      this.tweens.add({ targets: playTxt, scaleX: 1, scaleY: 1, duration: 100 });
    });
    playZone.on('pointerdown', () => this.startGame());

    void HEADER_H;
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