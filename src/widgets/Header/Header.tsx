import { useUi } from '@hooks/useUiStore';
import { bus } from '@state/eventBus';
import { LOCALES } from '../../game/i18n';
import { Button } from '@ui/Button';
import styles from './Header.module.scss';

export function Header() {
  const { timer, moves, pairs, movesCount, pairsFound, pairsTotal } = useUi(s => s.hud);
  const lang = useUi(s => s.menu.lang);
  const L = LOCALES[lang];
  const pct = pairsTotal ? Math.round((pairsFound / pairsTotal) * 100) : 0;
  return (
    <header className={styles.header} data-testid="hud">
      {/* Moves — icon + raw count (full localized string as the a11y label) */}
      <div className={styles.stat} data-testid="hud-moves" aria-label={moves}>
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 2.6-6.4" /><path d="M3 4v4h4" />
        </svg>
        <span className={styles.value}>{movesCount}</span>
      </div>

      <span className={styles.timer} data-testid="hud-timer">{timer}</span>

      <div className={styles.rightCluster}>
        <div className={styles.stat} data-testid="hud-pairs" aria-label={pairs}>
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="11" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
          </svg>
          <span className={styles.value}>{pairsFound}/{pairsTotal}</span>
        </div>
        <Button testId="hud-menu" type="secondary" size="small" onClick={() => bus.emit('cmd:exit-to-menu')}>{L.menu}</Button>
      </div>

      {/* Pairs progress along the header's bottom edge */}
      <div className={styles.progress} aria-hidden="true"><div className={styles.progressFill} style={{ width: `${pct}%` }} /></div>
    </header>
  );
}
