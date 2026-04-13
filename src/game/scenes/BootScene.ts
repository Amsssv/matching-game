import Phaser from 'phaser';
import { CUSTOM_ASSETS, SYMBOLS } from '../assets-config';
import { AudioManager } from '../AudioManager';
import { resolveLang, readSoundEnabled } from '../settings';
import { getYSDK } from '../../ysdk';

export class BootScene extends Phaser.Scene {
  private failedKeys = new Set<string>();

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.failedKeys.add(file.key);
    });

    this.load.audio('music', ['assets/music.mp3', 'assets/music.ogg']);
    this.load.image('title-bg', 'assets/title-bg.webp');

    // ── SFX — раскомментируй когда добавишь файлы в public/assets/sfx/ ──────
    this.load.audio('sfx-click', 'assets/sfx/click.mp3');   // клик по кнопкам
    this.load.audio('sfx-flip',  'assets/sfx/flip.mp3');    // переворот карточки
    this.load.audio('sfx-match', 'assets/sfx/match.mp3');   // найдена пара
    // this.load.audio('sfx-win',   'assets/sfx/win.mp3');     // победа
    // ─────────────────────────────────────────────────────────────────────────

    if (CUSTOM_ASSETS.bg) {
      this.load.image('bg', 'assets/bg.webp');
      this.load.image('bg-game', 'assets/bg-game.webp');
    }
    if (CUSTOM_ASSETS.cardBack) {
      this.load.image('card-back', 'assets/cards/back.webp');
    }
    if (CUSTOM_ASSETS.cardFaces) {
      SYMBOLS.forEach((sym) => this.load.image(`card-${sym}`, `assets/cards/${sym}.webp`));
    }
  }

  create() {
    const soundEnabled: boolean = this.game.registry.get('soundEnabled') ?? readSoundEnabled();
    this.game.registry.set('soundEnabled', soundEnabled);
    const audioManager = new AudioManager(!soundEnabled);
    audioManager.init(this);
    this.game.registry.set('audioManager', audioManager);

    resolveLang()
      .then(lang => {
        this.game.registry.set('lang', lang);
        // Wait for Rubik WOFF2 to load before rendering canvas text.
        // The second argument tells the browser which unicode subsets to fetch.
        // Without Cyrillic/Arabic sample chars, only the Latin subset is loaded
        // and Phaser draws Russian/Arabic text with the fallback font.
        const testChars = 'ABCабвاب'; // Latin + Cyrillic + Arabic
        return Promise.all([
          document.fonts.load('400 14px Rubik', testChars),
          document.fonts.load('700 14px Rubik', testChars),
          document.fonts.load('800 14px Rubik', testChars),
          document.fonts.load('bold 14px "Indira K"'),
        ]);
      })
      .then(() => {
        // Signal to Yandex SDK that the game is fully loaded and ready to play.
        // Without this call the SDK loading overlay never dismisses (times out ~90s).
        getYSDK()?.features.LoadingAPI?.ready();
        this.scene.start('MenuScene');
      })
      .catch(err => {
        console.error('[BootScene] startup failed, starting menu with defaults', err);
        getYSDK()?.features.LoadingAPI?.ready();
        this.scene.start('MenuScene');
      });
  }
}