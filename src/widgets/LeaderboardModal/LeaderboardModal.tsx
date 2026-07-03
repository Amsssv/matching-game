import { useEffect } from 'react';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { Button } from '@ui/Button';
import { LeaderboardTabs } from '@features/leaderboard/LeaderboardTabs';
import { LeaderboardTable } from '@features/leaderboard/LeaderboardTable';
import { closeLeaderboard, switchLeaderboardDifficulty, switchLeaderboardMode, leaderboardLogin } from '@state/leaderboardController';
import { MODE_ORDER, MODE_EMOJI } from '../../game/modes';
import styles from './LeaderboardModal.module.scss';

export function LeaderboardModal() {
  const leaderboard = useUi(s => s.modal.leaderboard);
  const lang = useUi(s => s.menu.lang);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLeaderboard(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!leaderboard) return null;
  const L = LOCALES[lang];
  return (
    <div className={styles.backdrop} data-testid="leaderboard" onClick={closeLeaderboard}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏆 {L.lbTitle}</h2>
        <div className={styles.modeTabs} data-testid="lb-mode-tabs">
          {MODE_ORDER.map((m) => (
            <Button key={m} testId={`lb-mode-${m}`} type="secondary" size="small"
                    active={m === leaderboard.mode} onClick={() => switchLeaderboardMode(m)}>
              {MODE_EMOJI[m]} {L.modeLabels[m]}
            </Button>
          ))}
        </div>
        <LeaderboardTabs L={L} current={leaderboard.difficulty} onPick={switchLeaderboardDifficulty} />
        <hr className={styles.separator} />
        <LeaderboardTable L={L} data={leaderboard.data} />
        {leaderboard.isGuest && (
          <Button testId="lb-login" type="secondary" size="large" onClick={leaderboardLogin}>{L.loginToSave}</Button>
        )}
        <Button testId="lb-close" type="secondary" size="large" onClick={closeLeaderboard}>{L.lbClose}</Button>
      </div>
    </div>
  );
}
