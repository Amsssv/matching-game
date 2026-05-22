import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';
import { getYSDK } from '../ysdk';

declare global {
  interface Window {
    __game?: Phaser.Game;
  }
}

type ScaleManagerInternal = Phaser.Scale.ScaleManager & {
  updateBounds: () => void;
  displayScale: { set: (x: number, y: number) => void };
};

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

  // Yandex Games rule 1.6.2.7: suppress the native context menu on long-press
  // and right-click over the game canvas/container. CSS `-webkit-touch-callout: none`
  // covers iOS Safari, but we still need this for desktop right-click and
  // Android Chrome long-press, which fire `contextmenu` regardless of CSS.
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, []);

  // Yandex Games rule 1.10.1: the sticky banner on iOS overlaps the canvas and
  // clips game elements. Yandex SDK does not report banner height directly, so
  // we poll getBannerAdvStatus() and use a conservative reserve (54px) when the
  // banner is showing. The root container reads --banner-h via CSS padding,
  // which makes ResizeObserver shrink the Phaser canvas accordingly.
  useEffect(() => {
    const STICKY_BANNER_H = 54; // measured on iOS Safari Yandex sticky banner
    let cancelled = false;
    let timer: number | undefined;
    let lastShowing: boolean | null = null;

    const apply = (showing: boolean) => {
      if (showing === lastShowing) return;
      lastShowing = showing;
      document.documentElement.style.setProperty(
        '--banner-h',
        showing ? `${STICKY_BANNER_H}px` : '0px',
      );
    };

    const tick = async () => {
      if (cancelled) return;
      const ysdk = getYSDK();
      if (ysdk?.adv?.getBannerAdvStatus) {
        try {
          const status = await ysdk.adv.getBannerAdvStatus();
          apply(!!status?.stickyAdvIsShowing);
        } catch {
          apply(false);
        }
      } else {
        apply(false);
      }
      if (!cancelled) timer = window.setTimeout(tick, 800);
    };

    timer = window.setTimeout(tick, 400);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      document.documentElement.style.setProperty('--banner-h', '0px');
    };
  }, []);

  // Initialize Phaser once
  useEffect(() => {
    if (gameRef.current) return;
    const game = new Phaser.Game({ ...gameConfig, parent: 'game-container' });
    gameRef.current = game;
    if (import.meta.env.DEV) {
      window.__game = game;
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
      const sm = game.scale as ScaleManagerInternal;
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
      // updateBounds() re-reads getBoundingClientRect() for the canvas LEFT/TOP offset.
      // displayScale must equal `cur` so that touch coords (CSS px) map 1:1 to game
      // coords (DPR-scaled).  Computing it as baseSize/canvasBounds is fragile: on some
      // Samsung/Android WebViews, getBoundingClientRect().width returns the parent
      // container's width (dpr * viewport) instead of canvas.style.width (viewport),
      // giving displayScale = 1 instead of dpr and shrinking the tap area by dpr².
      sm.updateBounds();
      sm.displayScale.set(cur, cur);
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
        // Reserve room for the Yandex sticky banner so it doesn't overlap the
        // canvas (rule 1.10.1). Other paddings are zero to keep the existing
        // DPR-aware sizing intact — Phaser's ResizeObserver reads the inner box.
        padding: '0 0 var(--banner-h, 0px) 0',
      }}
    />
  );
}