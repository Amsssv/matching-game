import { GameMount } from './GameMount';
import { useUi } from '@hooks/useUiStore';
import { MainMenu } from '@widgets/MainMenu';
import { Header } from '@widgets/Header';
import { VictoryModal } from '@widgets/VictoryModal';
import { LeaderboardModal } from '@widgets/LeaderboardModal';
import { ShopModal } from '@widgets/ShopModal';
import { DailyRewardModal } from '@widgets/DailyRewardModal';
import { TasksModal } from '@widgets/TasksModal';
import { ProfileModal } from '@widgets/ProfileModal';
import { HelpModal } from '@widgets/HelpModal';
import { StoreModal } from '@widgets/StoreModal';

export function App() {
  const menuActive = useUi(s => s.menu.active);
  const hudActive = useUi(s => s.hud.active);
  const victory = useUi(s => s.modal.victory);
  const leaderboard = useUi(s => s.modal.leaderboard);
  const shop = useUi(s => s.modal.shop);
  const daily = useUi(s => s.modal.daily);
  const tasks = useUi(s => s.modal.tasks);
  const profile = useUi(s => s.modal.profile);
  const help = useUi(s => s.modal.help);
  const store = useUi(s => s.modal.store);
  const visible = useUi(s => s.transition.visible);

  return (
    <GameMount>
      <div
        className="overlay-root"
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10,
          // Promote the overlay to its own GPU layer so each Phaser canvas frame only
          // composites it (cheap) instead of repainting the DOM + its shadows (mobile perf).
          transform: 'translateZ(0)',
          // Cross-fade the whole overlay in lockstep with Phaser's 300ms camera
          // fade between scenes so DOM UI never pops over a fading canvas.
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms linear',
        }}
      >
        {menuActive && <MainMenu />}
        {hudActive && <Header />}
        {victory && <VictoryModal />}
        {leaderboard && <LeaderboardModal />}
        {shop && <ShopModal />}
        {daily && <DailyRewardModal />}
        {tasks && <TasksModal />}
        {profile && <ProfileModal />}
        {help && <HelpModal />}
        {store && <StoreModal />}
      </div>
    </GameMount>
  );
}
