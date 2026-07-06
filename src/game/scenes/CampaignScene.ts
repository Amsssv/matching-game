import Phaser from 'phaser';
import { UI } from '../ui/config';
import { setCampaign, setModal, setTransition } from '../../state/store';
import { bus } from '../../state/eventBus';
import { levelById } from '../../state/campaign';
import { createRenderActivity, type RenderActivity } from '../renderActivity';

const MAP_KEY = 'campaign-map';
const MAP_PATH = 'assets/campaign/world-map.webp';

/**
 * Thin CampaignScene («Путешествие»): draws the world-map art as a full-screen
 * canvas background (exactly like MenuScene draws the sea background), and owns
 * the campaign-scene *state*. The interactive chapter/island/level nodes are
 * rendered by React (`src/widgets/CampaignMap` / `IslandView`) as a transparent
 * overlay gated by `campaign.active` — NOT a modal. Mirrors MenuScene↔MainMenu.
 */
export class CampaignScene extends Phaser.Scene {
  private bgObj?: Phaser.GameObjects.Image;
  private renderActivity?: RenderActivity;
  private starting = false;   // reentrancy latch: double-tap must not double-start

  constructor() {
    super({ key: 'CampaignScene' });
  }

  preload() {
    // Lazy-load the map on first entry so it never penalises the cold-load of
    // players who don't open the journey. Phaser caches it after the first time.
    if (!this.textures.exists(MAP_KEY)) this.load.image(MAP_KEY, MAP_PATH);
  }

  create() {
    this.starting = false;   // Phaser reuses the instance; reset on every (re)entry
    const w = this.scale.width;
    const h = this.scale.height;

    this.drawBackground(w, h);
    setCampaign({ active: true });
    setTransition(true);   // lift the cover once the scene is up

    const offBus = [
      bus.on('cmd:play-campaign-level', ({ levelId }) => this.playCampaignLevel(levelId)),
      bus.on('cmd:exit-campaign', () => this.exitToMenu()),
    ];
    this.events.once('shutdown', () => offBus.forEach((off) => off()));

    // Render-on-demand: the campaign canvas only draws the static map background,
    // so sleep the loop once the cover fade settles.
    this.renderActivity = createRenderActivity(this.game, 'CampaignScene');
    this.renderActivity.enable();
    window.setTimeout(() => this.renderActivity?.scheduleSleep(), UI.animation.fadeScene);

    this.events.once('shutdown', () => { setCampaign({ active: false }); });

    let lastW = w, lastH = h;
    const onResize = (size: Phaser.Structs.Size) => {
      if (Math.abs(size.width - lastW) < 6 && Math.abs(size.height - lastH) < 6) return;
      lastW = size.width; lastH = size.height;
      this.bgObj?.setPosition(size.width / 2, size.height / 2).setDisplaySize(size.width, size.height);
      this.renderActivity?.wake();
      this.renderActivity?.scheduleSleep();
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      this.renderActivity?.disable();
    });
  }

  /** Stretch the world map to fill the viewport (like the menu background). The
   * React nodes use viewport-% coords, so a full-bleed stretch keeps them aligned. */
  private drawBackground(w: number, h: number) {
    this.bgObj = this.add.image(w / 2, h / 2, MAP_KEY).setDisplaySize(w, h);
  }

  /** Launch a campaign level in GameScene (energy already spent by the controller). */
  private playCampaignLevel(levelId: string) {
    if (this.starting) return;
    const found = levelById(levelId);
    if (!found) return;
    this.starting = true;
    this.renderActivity?.disable();   // loop must run through the cover fade + scene swap
    this.game.registry.set('gameMode',      found.level.mode);
    this.game.registry.set('difficulty',    found.level.difficulty);
    this.game.registry.set('campaignLevel', levelId);
    this.game.registry.set('campaignSeaSkin', found.chapter.seaSkin);   // biome background for the journey
    setTransition(false);   // opaque cover fades in over the canvas
    window.setTimeout(() => this.scene.start('GameScene'), UI.animation.fadeScene);
  }

  /** Leave the journey and return to the main menu. */
  private exitToMenu() {
    if (this.starting) return;
    this.starting = true;
    this.renderActivity?.disable();
    setModal({ island: null, levelResult: null });   // don't carry campaign sub-views into the menu
    setTransition(false);
    window.setTimeout(() => this.scene.start('MenuScene'), UI.animation.fadeScene);
  }
}
