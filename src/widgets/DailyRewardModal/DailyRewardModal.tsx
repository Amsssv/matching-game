import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { Button } from '@ui/Button';
import { Modal } from '@ui/Modal';
import { cx } from '@ui/cx';
import { DAILY_REWARDS } from '@state/daily';
import { claim, watchDoubleAd, closeDaily } from '@state/dailyController';
import { getYSDK } from '../../ysdk';
import styles from './DailyRewardModal.module.scss';

export function DailyRewardModal() {
  const daily = useUi((s) => s.modal.daily);
  const lang = useUi((s) => s.menu.lang);
  if (!daily) return null;
  const L = LOCALES[lang];
  const { day, reward, claimed, doubled } = daily;
  const cyclePos = ((day - 1) % DAILY_REWARDS.length) + 1;   // 1..7 position in the cycle
  const shown = doubled ? reward * 2 : reward;
  // Only offer ×2 when a rewarded ad is actually available (mirror VictoryModal) —
  // otherwise the button is dead: watchDoubleAd no-ops when there's no ad to show.
  const canDouble = !doubled && !!getYSDK()?.adv?.showRewardedVideo;
  return (
    <Modal testId="daily" onClose={closeDaily} width="min(92vw, 420px)">
      <h2 className={styles.title}>{L.dailyTitle}</h2>

      <div className={styles.ladder}>
        {DAILY_REWARDS.map((r, i) => {
          const n = i + 1;
          const got = n < cyclePos || (n === cyclePos && claimed); // claimed days
          const today = n === cyclePos && !claimed;                 // claimable now
          const special = n === DAILY_REWARDS.length;               // day 7 = big reward
          return (
            <div key={n} className={cx(styles.cell, got && styles.got, today && styles.today, !got && !today && styles.locked, special && styles.special)}>
              {special && <span className={styles.crown} aria-hidden>🎁</span>}
              <span className={styles.amt}>{r}</span>
              {got && <span className={styles.check} aria-hidden>✓</span>}
            </div>
          );
        })}
      </div>

      <div className={styles.reward}>{`+${shown} 🦪`}</div>

      <div className={styles.actions}>
        {!claimed ? (
          <Button testId="daily-claim" type="primary" size="large" className={styles.claimCta} onClick={claim}>{L.dailyClaim}</Button>
        ) : (
          <>
            {canDouble && <Button testId="daily-double" type="primary" size="large" className={styles.claimCta} onClick={watchDoubleAd}>{`▶ ${L.dailyDouble}`}</Button>}
            {doubled && <p className={styles.comeBack}>{L.dailyComeBack}</p>}
            <Button testId="daily-close" type="secondary" size="large" onClick={closeDaily}>{L.lbClose}</Button>
          </>
        )}
      </div>
    </Modal>
  );
}
