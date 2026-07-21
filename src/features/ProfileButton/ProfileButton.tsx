import type { CSSProperties } from 'react';
import { useProgress } from '@hooks/useProgress';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { levelFromXp } from '@state/progress';
import { openProfile } from '@state/profileController';
import styles from './ProfileButton.module.scss';

export function ProfileButton() {
  const xp = useProgress((s) => s.stats.xp);
  const lang = useUi((s) => s.menu.lang);
  const { level, into, span } = levelFromXp(xp);
  // Fraction of the way to the next level — drives the desktop bar / mobile ring via CSS.
  const progress = span > 0 ? Math.min(1, into / span) : 0;
  return (
    <button
      type="button"
      data-testid="profile-open"
      className={styles.btn}
      style={{ '--level-progress': progress } as CSSProperties}
      aria-label={LOCALES[lang].profile}
      onClick={openProfile}
    >
      <span className={styles.lv}>Lv</span>{level}
      <span className={styles.bar} aria-hidden><span className={styles.fill} /></span>
    </button>
  );
}
