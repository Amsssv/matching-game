import { useProgress } from '@hooks/useProgress';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { levelFromXp } from '@state/progress';
import { openProfile } from '@state/profileController';
import styles from './ProfileButton.module.scss';

export function ProfileButton() {
  const xp = useProgress((s) => s.stats.xp);
  const lang = useUi((s) => s.menu.lang);
  const { level } = levelFromXp(xp);
  return (
    <button type="button" data-testid="profile-open" className={styles.btn} aria-label={LOCALES[lang].profile} onClick={openProfile}>
      <span className={styles.lv}>Lv</span>{level}
    </button>
  );
}
