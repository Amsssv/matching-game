import { useEffect } from 'react';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { closeHelp } from '@state/helpController';
import styles from './HelpModal.module.scss';

export function HelpModal() {
  const open = useUi((s) => s.modal.help);
  const lang = useUi((s) => s.menu.lang);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeHelp(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!open) return null;
  const L = LOCALES[lang];
  return (
    <div className={styles.backdrop} data-testid="help" onClick={closeHelp}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <h2 className={styles.title}>{L.help.title}</h2>
          <button type="button" data-testid="help-close" className={styles.close} aria-label={L.lbClose} onClick={closeHelp}>×</button>
        </header>
        <div className={styles.body}>
          {L.help.sections.map((sec, i) => (
            <section key={i} className={styles.section}>
              <h3 className={styles.sectionTitle}>{sec.h}</h3>
              <ul className={styles.lines}>
                {sec.lines.map((line, j) => <li key={j}>{line}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
