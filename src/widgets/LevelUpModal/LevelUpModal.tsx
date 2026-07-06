import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { Button } from '@ui/Button';
import { Modal } from '@ui/Modal';
import { closeLevelUp } from '@state/levelUpController';
import styles from './LevelUpModal.module.scss';

export function LevelUpModal() {
  const levelUp = useUi((s) => s.modal.levelUp);
  const lang = useUi((s) => s.menu.lang);
  if (!levelUp) return null;
  const L = LOCALES[lang];
  return (
    <Modal testId="levelup" onClose={closeLevelUp} width="min(88vw, 360px)">
      <div className={styles.badge} aria-hidden>🎉</div>
      <h2 className={styles.title}>{L.levelUpTitle}</h2>
      <div className={styles.level} data-testid="levelup-level">{L.level} {levelUp.level}</div>
      <div className={styles.reward}>+{levelUp.reward} 🦪</div>
      <Button testId="levelup-close" type="primary" size="large" onClick={closeLevelUp}>{L.levelUpCta}</Button>
    </Modal>
  );
}
