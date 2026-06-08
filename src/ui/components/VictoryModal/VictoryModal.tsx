import { useUi } from '../../hooks/useUiStore';
import { bus } from '../../../state/eventBus';
import { LOCALES } from '../../../game/i18n';
import { formatTime } from '../../../game/leaderboard';
import { Button } from '../Button';
import { CompactLeaderboard } from '../CompactLeaderboard';
import styles from './VictoryModal.module.scss';

export function VictoryModal() {
  const victory = useUi(s => s.modal.victory);
  const lang = useUi(s => s.menu.lang);
  if (!victory) return null;
  const L = LOCALES[lang];
  return (
    <div className={styles.backdrop} data-testid="victory">
      <div className={styles.panel}>
        <h2 className={styles.title}>{L.victory}</h2>
        <hr className={styles.separator} />
        <p className={styles.subtitle}>{L.allPairsFound}</p>
        <div className={styles.stats}>
          <div><span className={styles.statLabel}>{L.movesLabel}</span><span className={styles.statValue}>{victory.moves}</span></div>
          <div><span className={styles.statLabel}>{L.timeLabel}</span><span className={styles.statValue}>{formatTime(victory.seconds)}</span></div>
        </div>
        <div className={styles.actions}>
          <Button testId="victory-restart" label={L.restart} variant="primary" onClick={() => bus.emit('cmd:victory-restart')} />
          <Button testId="victory-menu" label={L.toMenu} variant="ghost" onClick={() => bus.emit('cmd:victory-to-menu')} />
          <Button testId="victory-lb" label={`🏆 ${L.leaderboard}`} variant="ghost" onClick={() => bus.emit('cmd:open-leaderboard', { source: 'victory' })} />
        </div>
        {victory.compact && <CompactLeaderboard data={victory.compact} />}
        {victory.showAuthCta && (
          <Button testId="victory-login" label={L.loginToSave} variant="ghost" onClick={() => bus.emit('cmd:login-and-save')} />
        )}
      </div>
    </div>
  );
}
