import styles from './Subtitle.module.scss';

export function Subtitle({ text }: { text: string }) {
  return <p className={styles.root}>{text.toUpperCase()}</p>;
}
