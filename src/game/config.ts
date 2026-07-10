import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CampaignScene } from './scenes/CampaignScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { UI } from './ui/config';

// Playwright adds ?canvas=1 to flag a screenshot run. We still use WebGL
// (Canvas can't render NineSlice, used for the game-island), but enable
// preserveDrawingBuffer so screenshots see a stable last frame.
const isTestEnv = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('canvas');

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: UI.colors.bgDark,
  scene: [BootScene, MenuScene, CampaignScene, GameScene, UIScene],
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
    // Playwright needs the last frame preserved to read a consistent screenshot.
    // In production this must be false — mobile tile-based GPUs (Mali, Adreno)
    // copy the entire framebuffer every frame when this is true, causing severe drops.
    preserveDrawingBuffer: isTestEnv,
  },
};