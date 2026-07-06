import Phaser from 'phaser';
import { LOCALES } from '../i18n';
import type { Lang } from '../i18n';
import { getYSDK } from '../../ysdk';
import { saveLang, saveSoundEnabled } from '../settings';
import { type Difficulty } from '../layout';
import { isMobileDevice } from '../device';
import { UI } from '../ui/config';
import { setMenu, setModal, setTransition } from '../../state/store';
import { bus } from '../../state/eventBus';
import { openLeaderboard } from '../../state/leaderboardController';
import { progressStore, levelFromXp } from '../../state/progress';
import { levelById } from '../../state/campaign';
import { createRenderActivity, type RenderActivity } from '../renderActivity';
import { MODE_UNLOCK, type GameMode } from '../modes';
import { skinFor } from '../seaSkins';

/**
 * Thin MenuScene: owns menu *state* + imperative actions, draws only the
 * background image on the canvas. All visible menu UI (title, buttons, flags,
 * leaderboard) is rendered by React (`src/widgets`), which reads the UI
 * store and drives these actions via `cmd:*` events on the command bus.
 */
export class MenuScene extends Phaser.Scene {
  private difficulty: Difficulty = 'medium';
  private soundEnabled = true;
  private lang: Lang = 'ru';
  private lastMode: GameMode = 'classic';
  private starting = false;   // reentrancy latch: double-tap must not double-start
  private bgObj?: Phaser.GameObjects.Image;
  private renderActivity?: RenderActivity;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.difficulty   = this.game.registry.get('difficulty')   ?? 'medium';
    this.soundEnabled = this.game.registry.get('soundEnabled') ?? true;
    this.lang         = this.game.registry.get('lang')         ?? 'ru';
    this.lastMode = this.game.registry.get('gameMode') ?? 'classic';
    this.starting = false;   // Phaser reuses this scene instance; reset the latch on every (re)entry

    const canvasWidth = this.scale.width;
    const canvasHeight = this.scale.height;

    this.drawBackground(canvasWidth, canvasHeight);

    document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    this.publish();
    setMenu({ active: true });
    setTransition(true);   // fade the menu in with the canvas

    // React overlay emits commands on the bus; the active scene handles them and
    // unsubscribes on shutdown (so a restarted / inactive MenuScene never
    // double-fires). Replaces the old direct-scene-access bridge.
    const offBus = [
      bus.on('cmd:toggle-sound', () => this.toggleSound()),
      bus.on('cmd:set-lang', ({ lang }) => this.setLang(lang)),
      bus.on('cmd:play', ({ mode, difficulty }) => this.play(mode, difficulty)),
      bus.on('cmd:play-campaign-level', ({ levelId }) => this.playCampaignLevel(levelId)),
      bus.on('cmd:open-leaderboard', ({ source }) => { if (source === 'menu') this.openLeaderboard(); }),
      bus.on('cmd:equip-changed', () => this.applySeaSkin()),
      bus.on('cmd:set-muted', (muted) => {
        const am: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
        am?.setMuted(muted);
      }),
    ];
    this.events.once('shutdown', () => offBus.forEach((off) => off()));

    // Start music on first user interaction (autoplay policy). The DOM overlay
    // (menu buttons/cards) now captures pointer events, so Phaser's scene-level
    // `pointerdown` usually never fires — listen on the window so ANY first gesture
    // (DOM or canvas) starts it. play() is idempotent (guarded by AudioManager.started).
    const audioManager: import('../AudioManager').AudioManager | undefined =
      this.game.registry.get('audioManager');
    if (audioManager) {
      const startMusic = () => audioManager.play();
      window.addEventListener('pointerdown', startMusic, { once: true });
      this.events.once('shutdown', () => window.removeEventListener('pointerdown', startMusic));
    }

    // Render-on-demand: sleep the menu loop while static (it only draws the bg).
    // Stay awake through the cover fade-out, then allow sleeping once it settles.
    this.renderActivity = createRenderActivity(this.game, 'MenuScene');
    this.renderActivity.enable();
    window.setTimeout(() => this.renderActivity?.scheduleSleep(), UI.animation.fadeScene);

    // Show sticky banner while in menu, but hide it in mobile landscape where it
    // would crop game elements (Yandex rules 1.10.1 + 1.6.2.3). Hidden when scene
    // leaves either way.
    const sdk = getYSDK();
    const isMobileLandscape = isMobileDevice() && canvasWidth > canvasHeight;
    if (!isMobileLandscape) {
      sdk?.adv.showBannerAdv();
    } else {
      sdk?.adv.hideBannerAdv();
    }
    this.events.once('shutdown', () => {
      setMenu({ active: false });
      setModal({ modeStart: null });   // defensive: never leave the modal over the game HUD
      getYSDK()?.adv.hideBannerAdv();
    });

    // The menu is React; the only canvas object is the background. Re-fit it in place
    // on resize — NO scene.restart. This removes the visible "jump" when the Yandex
    // banner appears (it changes --banner-height → a canvas resize) and the iOS
    // resize-storm freeze (rule 1.14), since there's no heavy rebuild to run.
    let lastSeenW = canvasWidth;
    let lastSeenH = canvasHeight;
    const onResize = (gameSize: Phaser.Structs.Size) => {
      const w = gameSize.width, h = gameSize.height;
      if (Math.abs(w - lastSeenW) < 6 && Math.abs(h - lastSeenH) < 6) return;
      lastSeenW = w; lastSeenH = h;
      this.bgObj?.setPosition(w / 2, h / 2).setDisplaySize(w, h);
      this.renderActivity?.wake();
      this.renderActivity?.scheduleSleep();
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      this.renderActivity?.disable();
    });
  }

  private drawBackground(canvasWidth: number, canvasHeight: number) {
    const skin = skinFor(progressStore.get().equipped.seaTheme);
    this.bgObj = this.add.image(canvasWidth / 2, canvasHeight / 2, skin.bgKey).setDisplaySize(canvasWidth, canvasHeight);
  }

  private applySeaSkin() {
    // Real art is already colored — swap the texture, no tint.
    this.bgObj?.setTexture(skinFor(progressStore.get().equipped.seaTheme).bgKey)
      .clearTint()
      .setDisplaySize(this.scale.width, this.scale.height);
    this.renderActivity?.wake();          // render the new skin, then settle back to sleep
    this.renderActivity?.scheduleSleep();
  }

  private publish() {
    setMenu({
      difficulty:   this.difficulty,
      mode:         this.lastMode,
      soundEnabled: this.soundEnabled,
      lang:         this.lang,
    });
  }

  // ── Actions invoked from the command bus ─────────────────────────────────────
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    saveSoundEnabled(this.soundEnabled);
    const audioManager: import('../AudioManager').AudioManager | undefined =
      this.game.registry.get('audioManager');
    audioManager?.setMuted(!this.soundEnabled);
    this.publish();
  }

  setLang(lng: Lang) {
    this.game.registry.set('lang', lng);
    saveLang(lng);
    document.title = LOCALES[lng].title;
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute('content', LOCALES[lng].description);
    this.renderActivity?.disable();   // loop must run through the restart
    this.scene.restart();
  }

  play(mode: GameMode, difficulty: Difficulty) {
    if (this.starting) return;   // double-tap during the cover fade must not double-start
    // Defense in depth: the picker disables locked modes, but a raw bus emit must not bypass the gate.
    const level = levelFromXp(progressStore.get().stats.xp).level;
    if (level < MODE_UNLOCK[mode]) return;
    this.starting = true;
    this.difficulty = difficulty;
    this.lastMode = mode;
    this.publish();
    setModal({ modeStart: null });   // close the difficulty modal BEFORE the cover fades in
    this.startGame(mode);
  }

  openLeaderboard() {
    openLeaderboard('menu');
  }

  private playCampaignLevel(levelId: string) {
    if (this.starting) return;   // double-tap during the cover fade must not double-start
    const found = levelById(levelId);
    if (!found) return;
    this.starting = true;
    this.difficulty = found.level.difficulty;
    this.lastMode = found.level.mode;
    this.publish();
    this.startGame(found.level.mode, levelId);
  }

  private startGame(mode: GameMode, campaignLevel: string | null = null) {
    this.renderActivity?.disable();   // loop must run through the cover fade + scene swap
    this.game.registry.set('gameMode',     mode);
    this.game.registry.set('difficulty',   this.difficulty);
    this.game.registry.set('campaignLevel', campaignLevel);
    this.game.registry.set('soundEnabled', this.soundEnabled);
    this.game.registry.set('lang',         this.lang);
    setTransition(false);   // opaque cover fades in over the canvas
    window.setTimeout(() => this.scene.start('GameScene'), UI.animation.fadeScene);
  }
}
