import Phaser from 'phaser';

export class AudioManager {
  private music: Phaser.Sound.BaseSound | null = null;
  private muted: boolean;
  private started = false;
  private game: Phaser.Game | null = null;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  init(scene: Phaser.Scene): void {
    this.game = scene.game;
    if (this.music) return;
    this.music = scene.sound.add('music', { loop: true, volume: 0.3 });
    (this.music as unknown as { setMute: (v: boolean) => void }).setMute(this.muted);
  }

  /**
   * Воспроизводит звуковой эффект.
   * Тихо пропускает если файл не загружен или звук выключен.
   */
  playSfx(key: string, volume = 0.6): void {
    if (this.muted || !this.game) return;
    if (!this.game.cache.audio.exists(key)) return;
    this.game.sound.play(key, { volume });
  }

  play(): void {
    if (this.started || !this.music) return;
    this.started = true;
    this.music.play();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.music) return;
    (this.music as unknown as { setMute: (v: boolean) => void }).setMute(muted);
  }
}