import { useUi } from '@hooks/useUiStore';
import { bus } from '@state/eventBus';
import { LOCALES } from '../../game/i18n';
import { formatTime } from '../../game/leaderboard';
import { Button } from '@ui/Button';
import { CompactLeaderboard } from '@features/leaderboard/CompactLeaderboard';
import { doubleVictoryReward } from '@state/victoryController';
import { getYSDK } from '../../ysdk';
import styles from './VictoryModal.module.scss';

export function VictoryModal() {
  const victory = useUi(s => s.modal.victory);
  const lang = useUi(s => s.menu.lang);
  if (!victory) return null;
  const L = LOCALES[lang];
  const { moves, seconds, pearlsEarned, isRecord, prevBest, doubled, compact, showAuthCta, firstWinOfDay } = victory;
  const shownPearls = doubled ? pearlsEarned * 2 : pearlsEarned;
  const canDouble = pearlsEarned > 0 && !doubled && !!getYSDK()?.adv?.showRewardedVideo;
  const delta = prevBest != null ? seconds - prevBest : null; // <0 = faster than the old best

  return (
    <div className={styles.backdrop} data-testid="victory">
      <div className={styles.panel}>
        {isRecord && <div className={styles.record} data-testid="victory-record">🏆 {L.vRecord}</div>}
        <h2 className={styles.title}>{L.victory}</h2>
        <p className={styles.subtitle}>{L.allPairsFound}</p>

        {pearlsEarned > 0 && (
          <p className={styles.reward} data-testid="victory-pearls">+{shownPearls} 🦪</p>
        )}
        {firstWinOfDay && <p className={styles.firstWin} data-testid="victory-firstwin">🎁 {L.vFirstWin}</p>}
        {canDouble && (
          <Button testId="victory-double" type="primary" size="large" className={styles.doubleCta} onClick={doubleVictoryReward}>{`▶ ${L.dailyDouble}`}</Button>
        )}

        <div className={styles.stats}>
          <div className={styles.tile}>
            <span className={styles.statLabel}>{L.movesLabel}</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.statLabel}>{L.timeLabel}</span>
            <span className={styles.statValue}>{formatTime(seconds)}</span>
            {delta != null && delta !== 0 && (
              <span className={delta < 0 ? styles.deltaGood : styles.deltaBad}>
                🏆 {delta < 0 ? '−' : '+'}{formatTime(Math.abs(delta))}
              </span>
            )}
          </div>
        </div>

        {compact && <CompactLeaderboard data={compact} />}

        <div className={styles.actions}>
          <Button testId="victory-restart" type="primary" size="large" className={styles.restartCta} onClick={() => bus.emit('cmd:victory-restart')}>{L.restart}</Button>
          <Button testId="victory-menu" type="secondary" size="large" onClick={() => bus.emit('cmd:victory-to-menu')}>{L.toMenu}</Button>
          <Button testId="victory-lb" type="secondary" size="large" onClick={() => bus.emit('cmd:open-leaderboard', { source: 'victory' })}>{`🏆 ${L.leaderboard}`}</Button>
          {showAuthCta && (
            <Button testId="victory-login" type="secondary" size="large" onClick={() => bus.emit('cmd:login-and-save')}>{L.loginToSave}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
