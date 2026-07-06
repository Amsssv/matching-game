import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { closeHelp } from '@state/helpController';
import { Modal } from '@ui/Modal';
import styles from './HelpModal.module.scss';

// One icon per help section (sections are in the same order across all locales):
// goal · difficulties · modes · features · pearl accrual · XP/level.
const SECTION_ICONS = ['🎯', '🎚️', '🕹️', '🗺️', '🎮', '🦪', '⭐'];

export function HelpModal() {
  const open = useUi((s) => s.modal.help);
  const lang = useUi((s) => s.menu.lang);
  if (!open) return null;
  const L = LOCALES[lang];
  return (
    <Modal testId="help" onClose={closeHelp} width="min(94vw, 480px)">
      <header className={styles.head}>
        <h2 className={styles.title}>{L.help.title}</h2>
        <button type="button" data-testid="help-close" className={styles.close} aria-label={L.lbClose} onClick={closeHelp}>×</button>
      </header>
      <div className={styles.body}>
        {L.help.sections.map((sec, i) => (
          <section key={i} className={styles.section}>
            <h3 className={styles.sectionTitle}>{SECTION_ICONS[i] ? `${SECTION_ICONS[i]} ` : ''}{sec.h}</h3>
            <ul className={styles.lines}>
              {sec.lines.map((line, j) => <li key={j}>{line}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
