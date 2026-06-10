import { useEffect } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { LOCALES } from '../../game/i18n';
import { Button } from '@ui/Button';
import { ACHIEVEMENTS } from '@state/achievements';
import { QUEST_BY_ID } from '@state/quests';
import { closeTasks, switchTasksTab } from '@state/tasksController';
import { QuestRow } from '@features/tasks/QuestRow';
import { AchievementRow } from '@features/tasks/AchievementRow';
import styles from './TasksModal.module.scss';

export function TasksModal() {
  const tasks = useUi((s) => s.modal.tasks);
  const lang = useUi((s) => s.menu.lang);
  // Reactive progress reads — re-render when any feeds availability so claim state is live.
  const quests = useProgress((s) => s.quests);
  const claimed = useProgress((s) => s.achievements.claimed);
  const stats = useProgress((s) => s.stats);
  const streakBest = useProgress((s) => s.streak.best);
  const unlockedCount = useProgress((s) => s.unlocked.length);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTasks(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!tasks) return null;
  const L = LOCALES[lang];
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
  // Per-tab "has something to claim" badges.
  const questClaimable = quests.active.filter((s) => { const d = QUEST_BY_ID[s.id]; return !!d && !s.claimed && s.progress >= d.target; }).length;
  const achClaimable = ACHIEVEMENTS.filter((a) => a.done(signals) && !claimed.includes(a.id)).length;
  return (
    <div className={styles.backdrop} data-testid="tasks" onClick={closeTasks}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{L.tasks}</h2>
        <div className={styles.tabs} data-testid="tasks-tabs">
          <Button testId="tasks-tab-quests" type="primary" size="small" className={styles.tab}
                  active={tasks.tab === 'quests'} onClick={() => switchTasksTab('quests')}>
            {L.tasksTabQuests}{questClaimable > 0 && <span className={styles.tabBadge} aria-hidden>{questClaimable}</span>}
          </Button>
          <Button testId="tasks-tab-achievements" type="primary" size="small" className={styles.tab}
                  active={tasks.tab === 'achievements'} onClick={() => switchTasksTab('achievements')}>
            {L.tasksTabAch}{achClaimable > 0 && <span className={styles.tabBadge} aria-hidden>{achClaimable}</span>}
          </Button>
        </div>
        <div className={styles.list}>
          {tasks.tab === 'quests'
            ? quests.active.map((slot, i) => <QuestRow key={slot.id} slot={slot} index={i} L={L} />)
            : ACHIEVEMENTS.map((def) => (
                <AchievementRow key={def.id} def={def} done={def.done(signals)} progress={def.progress(signals)} claimed={claimed.includes(def.id)} L={L} />
              ))}
        </div>
        <Button testId="tasks-close" type="secondary" size="large" onClick={closeTasks}>{L.lbClose}</Button>
      </div>
    </div>
  );
}
