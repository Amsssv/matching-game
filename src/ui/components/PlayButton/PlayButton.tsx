import { Button } from '../Button';
import styles from './PlayButton.module.scss';
export function PlayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button testId="play" className={styles.playButton} label={label} variant="primary" active onClick={onClick} />
  );
}
