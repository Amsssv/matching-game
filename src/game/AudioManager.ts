import Phaser from 'phaser';

export class AudioManager {
  private music: Phaser.Sound.BaseSound | null = null;
  private muted: boolean;
  private started = false;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  init(scene: Phaser.Scene): void {
    if (this.music) return;
    this.music = scene.sound.add('music', { loop: true, volume: 0.3 });
    (this.music as unknown as { setMute: (v: boolean) => void }).setMute(this.muted);
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