import Phaser from 'phaser';
import { gameConfig } from './config';

/**
 * Single entry point that constructs the Phaser game. `ui/GameMount` owns the
 * lifecycle (create on mount, destroy on unmount) and the DPR / banner sizing of
 * the host element; this keeps the React layer free of Phaser config details.
 */
export function createGame(parent: string | HTMLElement): Phaser.Game {
  return new Phaser.Game({ ...gameConfig, parent });
}
