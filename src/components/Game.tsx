import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';

export function Game() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 2));

  // Update dpr state when DevTools device switch changes devicePixelRatio
  useEffect(() => {
    const update = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      setDpr(prev => prev !== d ? d : prev);
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Initialize Phaser once
  useEffect(() => {
    if (gameRef.current) return;
    const game = new Phaser.Game({ ...gameConfig, parent: 'game-container' });
    gameRef.current = game;
    if (import.meta.env.DEV) {
      (window as any).__game = game;
    }
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Apply canvas DPR transform — re-runs whenever dpr state changes
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const apply = () => {
      const cur = Math.min(window.devicePixelRatio || 1, 2);
      if (cur > 1) {
        game.canvas.style.marginLeft = '0';
        game.canvas.style.marginTop = '0';
        game.canvas.style.transform = `scale(${1 / cur})`;
        game.canvas.style.transformOrigin = 'top left';
        game.scale.displayScale.set(cur, cur);
      } else {
        game.canvas.style.transform = '';
        game.canvas.style.transformOrigin = '';
        game.scale.displayScale.set(1, 1);
      }
    };
    if (game.canvas) apply(); else game.events.once('ready', apply);
    game.scale.on('resize', apply);
    return () => { game.scale.off('resize', apply); };
  }, [dpr]);

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