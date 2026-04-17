import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { UI } from './ui/config';

// In test environments (Playwright adds ?canvas=1) force Canvas renderer for
// deterministic pixel output. WebGL sub-pixel rounding varies between frames.
const isTestEnv = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('canvas');

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: isTestEnv ? Phaser.CANVAS : Phaser.AUTO,
  backgroundColor: UI.colors.bgDark,
  scene: [BootScene, MenuScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  input: {
    activePointers: 2, // support multi-touch
  },
  render: {
    // Keep the last rendered frame in the WebGL drawing buffer so that
    // screenshot tools (Playwright) always read a complete, consistent frame
    // rather than a partially-cleared back-buffer.
    preserveDrawingBuffer: true,
  },
};