import { useLayoutEffect, useRef } from 'react';
import styles from './Subtitle.module.scss';

export function Subtitle({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  // Keep the subtitle on a SINGLE line at any width: it renders with white-space:nowrap
  // (so it never wraps); here we measure the natural run and, if it would overflow its
  // column, scale the font down so it always fits. Mirrors the Title's fit logic.
  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      el.style.fontSize = ''; // reset to the CSS clamp before measuring
      const avail = el.clientWidth; // width:100% → the column's content width
      const range = document.createRange();
      range.selectNodeContents(el);
      const textWidth = range.getBoundingClientRect().width;
      if (!avail || !textWidth) return;
      if (textWidth > avail) {
        const cur = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = `${cur * (avail / textWidth)}px`;
      }
    };
    fit();
    const fonts = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
    fonts?.ready.then(fit).catch(() => {});
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [text]);

  return <p ref={ref} className={styles.root}>{text.toUpperCase()}</p>;
}
