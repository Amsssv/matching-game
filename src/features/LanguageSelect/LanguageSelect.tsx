import { useEffect, useRef, useState } from 'react';
import { SUPPORTED } from '../../game/settings';
import type { Lang } from '../../game/i18n';
import { cx } from '@ui/cx';
import styles from './LanguageSelect.module.scss';

// Flag per language.
const FLAGS: Record<Lang, string> = {
  ru: '🇷🇺', en: '🇬🇧', tr: '🇹🇷', es: '🇪🇸', pt: '🇵🇹',
};

/**
 * Compact language picker for the top bar: a pill trigger (globe + current code +
 * chevron) that opens a themed popover of flag + code rows. Replaces the old flag
 * grid so the whole top bar stays on one row. On touch devices (phones/tablets) the
 * trigger is just the globe icon. Click-outside and Escape close it.
 *
 * Keeps `lang-<lng>` test ids on each option, `lang-trigger` on the button, and
 * `data-testid="langs"` on the root so existing language wiring/tests keep working.
 */
export function LanguageSelect({ current, onPick }: { current: Lang; onPick: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.root} data-testid="langs" ref={ref}>
      <button
        type="button"
        data-testid="lang-trigger"
        className={cx(styles.trigger, open && styles.triggerOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg className={styles.globe} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={1.7} />
          <path d="M3 12h18M12 3c2.6 2.4 2.6 15.6 0 18M12 3c-2.6 2.4-2.6 15.6 0 18" fill="none" stroke="currentColor" strokeWidth={1.4} />
        </svg>
        <span className={styles.code}>{current.toUpperCase()}</span>
        <svg className={cx(styles.chevron, open && styles.chevronOpen)} viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className={styles.pop} role="listbox">
          {SUPPORTED.map((lng) => (
            <li key={lng} role="option" aria-selected={lng === current}>
              <button
                type="button"
                data-testid={`lang-${lng}`}
                className={cx(styles.option, lng === current && styles.optionActive)}
                onClick={() => { onPick(lng); setOpen(false); }}
              >
                <span className={styles.flag} aria-hidden>{FLAGS[lng]}</span>
                <span className={styles.optCode}>{lng.toUpperCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
