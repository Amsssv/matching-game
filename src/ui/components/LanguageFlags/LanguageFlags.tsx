import { Button } from '../Button';
import styles from './LanguageFlags.module.scss';
import { SUPPORTED } from '../../../game/settings';
import type { Lang } from '../../../game/i18n';

export function LanguageFlags({ current, onPick }: { current: Lang; onPick: (l: Lang) => void }) {
  return (
    <div className={styles.root} data-testid="langs">
      {SUPPORTED.map((lng) => (
        <Button
          key={lng}
          testId={`lang-${lng}`}
          type="secondary"
          shape="icon"
          active={lng === current}
          disabled={lng === current}
          onClick={() => onPick(lng)}
        >{lng}</Button>
      ))}
    </div>
  );
}
