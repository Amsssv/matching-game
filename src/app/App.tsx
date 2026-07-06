import { useEffect } from 'react';
import { GameMount } from './GameMount';
import { useUi } from '@hooks/useUiStore';
import { bus } from '@state/eventBus';
import { MainMenu } from '@widgets/MainMenu';
import { Header } from '@widgets/Header';
import { VictoryModal } from '@widgets/VictoryModal';
import { DefeatModal } from '@widgets/DefeatModal';
import { LeaderboardModal } from '@widgets/LeaderboardModal';
import { ShopModal } from '@widgets/ShopModal';
import { DailyRewardModal } from '@widgets/DailyRewardModal';
import { TasksModal } from '@widgets/TasksModal';
import { ProfileModal } from '@widgets/ProfileModal';
import { HelpModal } from '@widgets/HelpModal';
import { StoreModal } from '@widgets/StoreModal';
import { ModeStartModal } from '@widgets/ModeStartModal';
import { LevelUpModal } from '@widgets/LevelUpModal';
import { CampaignMap } from '@widgets/CampaignMap';
import { IslandView } from '@widgets/IslandView';
import { LevelStartSheet } from '@widgets/LevelStartSheet';
import { LevelResultModal } from '@widgets/LevelResultModal';

export function App() {
  const menuActive = useUi(s => s.menu.active);
  const hudActive = useUi(s => s.hud.active);
  const victory = useUi(s => s.modal.victory);
  const defeat = useUi(s => s.modal.defeat);
  const leaderboard = useUi(s => s.modal.leaderboard);
  const shop = useUi(s => s.modal.shop);
  const daily = useUi(s => s.modal.daily);
  const tasks = useUi(s => s.modal.tasks);
  const profile = useUi(s => s.modal.profile);
  const help = useUi(s => s.modal.help);
  const store = useUi(s => s.modal.store);
  const modeStart = useUi(s => s.modal.modeStart);
  const levelUp = useUi(s => s.modal.levelUp);
  const campaignMap = useUi(s => s.modal.campaignMap);
  const island = useUi(s => s.modal.island);
  const levelStart = useUi(s => s.modal.levelStart);
  const levelResult = useUi(s => s.modal.levelResult);
  const visible = useUi(s => s.transition.visible);

  // Click feedback for every overlay button (menu, HUD, all modals) via one
  // delegated listener — new buttons get the sound for free. Plays through the
  // Phaser AudioManager (mute-aware) on the command bus. Capture phase so it fires
  // even when a handler stops propagation; skips disabled buttons.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('button:not([disabled]), [role="button"]:not([aria-disabled="true"])')) {
        bus.emit('cmd:ui-click');
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Dismiss the cold-load screen once the real menu is on screen (covers the blank
  // #root during boot awaits AND the Phaser asset preload). Idempotent: hide() no-ops
  // after the first call, so a later menu toggle won't try to re-hide a removed node.
  useEffect(() => {
    if (menuActive) window.__appLoader?.hide();
  }, [menuActive]);

  return (
    <GameMount>
      <div
        className={visible ? 'overlay-root' : 'overlay-root overlay-frozen'}
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
        {defeat && <DefeatModal />}
        {leaderboard && <LeaderboardModal />}
        {shop && <ShopModal />}
        {daily && <DailyRewardModal />}
        {tasks && <TasksModal />}
        {profile && <ProfileModal />}
        {help && <HelpModal />}
        {store && <StoreModal />}
        {modeStart && <ModeStartModal />}
        {levelUp && <LevelUpModal />}
        {campaignMap && <CampaignMap />}
        {island && <IslandView />}
        {levelStart && <LevelStartSheet />}
        {levelResult && <LevelResultModal />}
      </div>

      {/* Scene-transition cover. Replaces the per-frame Phaser camera fade (which
          re-filled the whole DPR canvas every frame — fill-rate jank on mobile) with
          one GPU-composited opaque layer. Opaque while transitioning (visible:false):
          it hides the instant scene swap AND lets the next scene's layout settle
          behind it, so the menu no longer visibly "jumps" into place. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none',
          background: '#071528',   // matches the old camera fade colour rgb(7,21,40)
          transform: 'translateZ(0)',
          opacity: visible ? 0 : 1,
          transition: 'opacity 300ms linear',
        }}
      />
    </GameMount>
  );
}
