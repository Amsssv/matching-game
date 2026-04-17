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

  // Apply canvas DPR sizing — re-runs whenever dpr state changes
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const apply = () => {
      const cur = Math.min(window.devicePixelRatio || 1, 2);
      const sm = game.scale as any;
      if (cur > 1) {
        // Phaser RESIZE mode sets canvas.width/height but never sets style.width/height.
        // We set style.width/height to shrink the rendered canvas back to CSS-pixel size.
        // CSS transform: scale() would also shrink visually, but it does NOT trigger
        // Phaser's ResizeObserver (which watches the parent div, not the canvas element),
        // so displayScale would never update and all touch input would be off by DPR.
        // style.width/height IS read by getBoundingClientRect, so updateBounds() below
        // gives the correct visual size → displayScale = canvas.width / visual.width = DPR.
        game.canvas.style.width = `${Math.round(game.canvas.width / cur)}px`;
        game.canvas.style.height = `${Math.round(game.canvas.height / cur)}px`;
        game.canvas.style.marginLeft = '0';
        game.canvas.style.marginTop = '0';
        game.canvas.style.transform = '';
        game.canvas.style.transformOrigin = '';
      } else {
        game.canvas.style.width = '';
        game.canvas.style.height = '';
        game.canvas.style.transform = '';
        game.canvas.style.transformOrigin = '';
      }
      // Sync Phaser's input transform with the new visual canvas size.
      // updateBounds() re-reads getBoundingClientRect(); displayScale.set() updates
      // the multiplier used in transformX/transformY without emitting a RESIZE event
      // (which would cause an infinite loop if we called refresh() instead).
      sm.updateBounds();
      sm.displayScale.set(
        sm.baseSize.width / sm.canvasBounds.width,
        sm.baseSize.height / sm.canvasBounds.height,
      );
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