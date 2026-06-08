import { useLayoutEffect, useRef, useState } from 'react';
import styles from './Title.module.scss';

export function Title({ text }: { text: string }) {
  const textRef = useRef<HTMLHeadingElement>(null);
  const [width, setWidth] = useState<number>();

  // Size the ornate frame to the (localized) title, mirroring the original
  // canvas rule: width = max(textWidth × 1.5, min(650, 85vw)). A Range measures
  // the real glyph run regardless of the <h1>'s absolute box.
  useLayoutEffect(() => {
    const measure = () => {
      const el = textRef.current;
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const textWidth = range.getBoundingClientRect().width;
      if (!textWidth) return;
      const floor = Math.min(650, window.innerWidth * 0.85);
      setWidth(Math.round(Math.max(textWidth * 1.5, floor)));
    };
    measure();
    const fonts = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
    fonts?.ready.then(measure).catch(() => {});
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  return (
    <div className={styles.root} style={width ? { width: `${width}px` } : undefined}>
      <img className={styles.background} src="/assets/title-bg.webp" alt="" aria-hidden />
      <h1 className={styles.text} ref={textRef}>{text}</h1>
    </div>
  );
}
