import { useEffect, useState } from 'react';
import { useProgress } from '@hooks/useProgress';
import { msToNextEnergy, regenEnergy } from '@state/energy';
import { formatCountdown } from './format';
import styles from './EnergyMeter.module.scss';

export function EnergyMeter() {
  const energy = useProgress((p) => p.energy);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const live = regenEnergy(energy, now);
  const countdown = live.current >= live.max ? '' : formatCountdown(msToNextEnergy(live, now));
  return (
    <div className={styles.meter} data-testid="energy-meter">
      <span className={styles.icon} aria-hidden>❤</span>
      <span className={styles.count}>{live.current}/{live.max}</span>
      {countdown && <span className={styles.timer}>{countdown}</span>}
    </div>
  );
}
