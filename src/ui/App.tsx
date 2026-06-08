import { GameMount } from './GameMount';
import { useUi } from './hooks/useUiStore';
import { MainMenu } from './components/MainMenu';
import { Header } from './components/Header';
import { VictoryModal } from './components/VictoryModal';
import { LeaderboardModal } from './components/LeaderboardModal';

export function App() {
  const menuActive = useUi(s => s.menu.active);
  const hudActive = useUi(s => s.hud.active);
  const victory = useUi(s => s.modal.victory);
  const leaderboard = useUi(s => s.modal.leaderboard);
  const visible = useUi(s => s.transition.visible);

  return (
    <GameMount>
      <div
        className="overlay-root"
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10,
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
      </div>
    </GameMount>
  );
}
