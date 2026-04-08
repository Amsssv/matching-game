import Phaser from 'phaser';
import { CUSTOM_ASSETS, SYMBOLS } from '../assets-config';
import { AudioManager } from '../AudioManager';

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

    if (CUSTOM_ASSETS.bg) {
      this.load.image('bg', 'assets/bg.webp');
      this.load.image('bg-game', 'assets/bg-game.webp');
    }
    if (CUSTOM_ASSETS.cardBack) {
      this.load.image('card-back', 'assets/cards/back.webp');
    }
    if (CUSTOM_ASSETS.cardFaces) {
      SYMBOLS.forEach((sym) => this.load.image(`card-${sym}`, `assets/cards/${sym}.png`));
    }
  }

  create() {
    const soundEnabled: boolean = this.game.registry.get('soundEnabled') ?? true;
    const audioManager = new AudioManager(!soundEnabled);
    audioManager.init(this);
    this.game.registry.set('audioManager', audioManager);

    this.scene.start('MenuScene');
  }
}