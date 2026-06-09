import { useProgress } from '@hooks/useProgress';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { QUEST_BY_ID } from '@state/quests';
import { ACHIEVEMENTS } from '@state/achievements';
import { openTasks } from '@state/tasksController';
import { cx } from '@ui/cx';
import styles from './TasksButton.module.scss';

export function TasksButton() {
  const lang = useUi((s) => s.menu.lang);
  // Subscribe to every slice that feeds availability so the badge stays live.
  const quests = useProgress((s) => s.quests);
  const claimed = useProgress((s) => s.achievements.claimed);
  const stats = useProgress((s) => s.stats);
  const streakBest = useProgress((s) => s.streak.best);
  const unlockedCount = useProgress((s) => s.unlocked.length);
  const signals = {
    gamesWon: stats.gamesWon,
    pairsMatched: stats.pairsMatched,
    winsByDifficulty: stats.winsByDifficulty,
    perfectWins: stats.perfectWins,
    fastWins: stats.fastWins,
    pearlsEarnedTotal: stats.pearlsEarnedTotal,
    streakBest,
    unlockedCount,
  };
  const claimable =
    quests.active.some((s) => { const d = QUEST_BY_ID[s.id]; return d && !s.claimed && s.progress >= d.target; })
    || ACHIEVEMENTS.some((a) => a.done(signals) && !claimed.includes(a.id));
  return (
    <button
      type="button"
      data-testid="tasks-open"
      aria-label={LOCALES[lang].tasks}
      className={cx(styles.btn, claimable && styles.available)}
      onClick={() => openTasks()}
    >
      📋
      {claimable && <span className={styles.badge} aria-hidden />}
    </button>
  );
}
