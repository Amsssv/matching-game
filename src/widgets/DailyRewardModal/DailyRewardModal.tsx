import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { Button } from '@ui/Button';
import { cx } from '@ui/cx';
import { DAILY_REWARDS } from '@state/daily';
import { claim, watchDoubleAd, closeDaily } from '@state/dailyController';
import styles from './DailyRewardModal.module.scss';

export function DailyRewardModal() {
  const daily = useUi((s) => s.modal.daily);
  const lang = useUi((s) => s.menu.lang);
  if (!daily) return null;
  const L = LOCALES[lang];
  const { day, reward, claimed, doubled } = daily;
  const cyclePos = ((day - 1) % DAILY_REWARDS.length) + 1;   // 1..7 highlight
  const shown = doubled ? reward * 2 : reward;
  return (
    <div className={styles.backdrop} data-testid="daily" onClick={closeDaily}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{L.dailyTitle}</h2>
        <div className={styles.dots}>
          {DAILY_REWARDS.map((r, i) => {
            const n = i + 1;
            const cls = n < cyclePos ? styles.past : n === cyclePos ? styles.current : styles.future;
            return <span key={n} className={cx(styles.dot, cls)}>{r}</span>;
          })}
        </div>
        <div className={styles.reward}>{`+${shown} 🦪`}</div>
        {!claimed ? (
          <Button testId="daily-claim" type="primary" size="large" onClick={claim}>{L.dailyClaim}</Button>
        ) : (
          <>
            {!doubled && <Button testId="daily-double" type="primary" size="large" onClick={watchDoubleAd}>{`▶ ${L.dailyDouble}`}</Button>}
            {doubled && <p className={styles.comeBack}>{L.dailyComeBack}</p>}
            <Button testId="daily-close" type="secondary" size="large" onClick={closeDaily}>{L.lbClose}</Button>
          </>
        )}
      </div>
    </div>
  );
}
