import { useUi } from '@hooks/useUiStore';
import { bus } from '@state/eventBus';
import { LOCALES } from '../../game/i18n';
import { Button } from '@ui/Button';
import { Modal } from '@ui/Modal';
import styles from './DefeatModal.module.scss';

export function DefeatModal() {
  const defeat = useUi(s => s.modal.defeat);
  const lang = useUi(s => s.menu.lang);
  if (!defeat) return null;
  const L = LOCALES[lang];
  return (
    // Deliberately NOT dismissible (no onClose) — closing would strand the player
    // on a finished board.
    <Modal testId="defeat">
      <h2 className={styles.title}>{defeat.reason === 'timeout' ? L.defeatTimeout : L.defeatMistake}</h2>
      <p className={styles.subtitle}>{L.defeatPairs(defeat.pairsFound, defeat.totalPairs)}</p>
      {(defeat.pearlsEarned > 0 || defeat.xpGained > 0) && (
        <p className={styles.reward} data-testid="defeat-reward">
          +{defeat.pearlsEarned} 🦪<span className={styles.xpInline}> · +{defeat.xpGained} XP</span>
        </p>
      )}
      {defeat.leveledUp && <p className={styles.levelUp}>🎉 {L.level} {defeat.newLevel}</p>}
      <div className={styles.actions}>
        <Button testId="defeat-restart" type="primary" size="large" className={styles.restartCta} onClick={() => bus.emit('cmd:victory-restart')}>{L.restart}</Button>
        <Button testId="defeat-menu" type="secondary" size="large" onClick={() => bus.emit('cmd:victory-to-menu')}>{L.toMenu}</Button>
      </div>
    </Modal>
  );
}
