import { Button } from '../Button';
import styles from './SoundToggle.module.scss';
import type { Locale } from '../../../game/i18n';

export function SoundToggle({
  L, enabled, onToggle,
}: { L: Locale; enabled: boolean; onToggle: () => void }) {
  return (
    <div>
      <p className={styles.label}>{L.sound}</p>
      <Button
        testId="sound-toggle"
        label={enabled ? L.soundOn : L.soundOff}
        variant="primary"
        active={enabled}
        onClick={onToggle}
      />
    </div>
  );
}
