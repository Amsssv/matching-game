import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';

const dpr = Math.min(window.devicePixelRatio || 1, 2);

export function Game() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;
    const game = new Phaser.Game({ ...gameConfig, parent: 'game-container' });
    gameRef.current = game;

    if (import.meta.env.DEV) {
      (window as any).__game = game;
    }

    if (dpr > 1) {
      // Phaser reads getBoundingClientRect() — no transform on container so it sees DPR size.
      // Scale the canvas visually back to CSS viewport size.
      // Fix input coords via displayScale (Scale Manager overwrites it on each resize).
      const applyDpr = () => {
        game.canvas.style.transform = `scale(${1 / dpr})`;
        game.canvas.style.transformOrigin = 'top left';
        game.scale.displayScale.set(dpr, dpr);
      };
      game.events.once('ready', applyDpr);
      game.scale.on('resize', () => game.scale.displayScale.set(dpr, dpr));
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      id="game-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${dpr * 100}vw`,
        height: `${dpr * 100}vh`,
        padding: 0,
      }}
    />
  );
}