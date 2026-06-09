import Phaser from 'phaser';
import { LOCALES } from '../i18n';
import type { Lang } from '../i18n';
import { getYSDK } from '../../ysdk';
import { saveLang, saveSoundEnabled } from '../settings';
import { type Difficulty } from '../layout';
import { isMobileDevice } from '../device';
import { UI } from '../ui/config';
import { setMenu, setTransition } from '../../state/store';
import { bus } from '../../state/eventBus';
import { openLeaderboard } from '../../state/leaderboardController';
import { progressStore } from '../../state/progress';
import { tintOf } from '../../state/catalog';

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
  private fromResize = false;
  private bgObj?: Phaser.GameObjects.Image;

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
      bus.on('cmd:set-difficulty', ({ difficulty }) => this.setDifficulty(difficulty)),
      bus.on('cmd:toggle-sound', () => this.toggleSound()),
      bus.on('cmd:set-lang', ({ lang }) => this.setLang(lang)),
      bus.on('cmd:play', () => this.play()),
      bus.on('cmd:open-leaderboard', ({ source }) => { if (source === 'menu') this.openLeaderboard(); }),
      bus.on('cmd:equip-changed', () => this.applySeaTint()),
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

    if (!this.fromResize) {
      this.cameras.main.fadeIn(UI.animation.fadeScene, 7, 21, 40);
    }

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
      getYSDK()?.adv.hideBannerAdv();
    });

    // GameMount tracks window.resize and updates the container div when DPR changes,
    // which triggers Phaser's ScaleManager (via ResizeObserver) to resize the canvas
    // and emit 'resize'. Yandex rule 1.14: iOS Safari emits a storm of resize events
    // during orientation changes — wait 400ms and ignore micro-changes (< 6px) to
    // avoid spurious restarts from the iOS address bar / soft keyboard.
    let resizeTimer: Phaser.Time.TimerEvent | null = null;
    let lastSeenW = canvasWidth;
    let lastSeenH = canvasHeight;
    const onResize = (gameSize: Phaser.Structs.Size) => {
      const newWidth = gameSize.width;
      const newHeight = gameSize.height;
      if (Math.abs(newWidth - lastSeenW) < 6 && Math.abs(newHeight - lastSeenH) < 6) return;
      lastSeenW = newWidth;
      lastSeenH = newHeight;
      if (resizeTimer) resizeTimer.remove();
      resizeTimer = this.time.delayedCall(400, () => this.scene.restart({ fromResize: true }));
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      resizeTimer?.remove();
    });
  }

  private drawBackground(canvasWidth: number, canvasHeight: number) {
    this.bgObj = this.add.image(canvasWidth / 2, canvasHeight / 2, 'bg').setDisplaySize(canvasWidth, canvasHeight);
    this.applySeaTint();
  }

  private applySeaTint() {
    this.bgObj?.setTint(tintOf(progressStore.get().equipped.seaTheme));
  }

  private publish() {
    setMenu({
      difficulty:   this.difficulty,
      soundEnabled: this.soundEnabled,
      lang:         this.lang,
    });
  }

  // ── Actions invoked from the command bus ─────────────────────────────────────
  setDifficulty(d: Difficulty) {
    this.sfx('sfx-click');
    this.difficulty = d;
    this.publish();
  }

  toggleSound() {
    this.sfx('sfx-click');
    this.soundEnabled = !this.soundEnabled;
    saveSoundEnabled(this.soundEnabled);
    const audioManager: import('../AudioManager').AudioManager | undefined =
      this.game.registry.get('audioManager');
    audioManager?.setMuted(!this.soundEnabled);
    this.publish();
  }

  setLang(lng: Lang) {
    this.sfx('sfx-click');
    this.game.registry.set('lang', lng);
    saveLang(lng);
    document.title = LOCALES[lng].title;
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute('content', LOCALES[lng].description);
    this.scene.restart();
  }

  play() {
    this.sfx('sfx-click');
    this.startGame();
  }

  openLeaderboard() {
    this.sfx('sfx-click');
    openLeaderboard('menu');
  }

  private sfx(key: string) {
    const audioManager: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
    audioManager?.playSfx(key);
  }

  private startGame() {
    this.game.registry.set('difficulty',   this.difficulty);
    this.game.registry.set('soundEnabled', this.soundEnabled);
    this.game.registry.set('lang',         this.lang);
    setTransition(false);   // fade the menu out with the canvas
    this.cameras.main.fadeOut(UI.animation.fadeScene, 7, 21, 40);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
  }
}
