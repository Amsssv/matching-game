import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { openHelp } from '@state/helpController';
import styles from './HelpButton.module.scss';

export function HelpButton() {
  const lang = useUi((s) => s.menu.lang);
  return (
    <button type="button" data-testid="help-open" className={styles.btn} aria-label={LOCALES[lang].help.title} onClick={openHelp}>
      ?
    </button>
  );
}
