import Phaser from 'phaser';
import { LOCALES, type Lang } from '../i18n';
import { fetchLeaderboard, formatTime, type LeaderboardRow } from '../leaderboard';
import { type Difficulty } from '../layout';
import { createButton, createText, type ButtonHandle } from './factory';
import { isMobileDevice, getLocalDpr } from '../device';
import { UI } from './config';
import { getYSDK } from '../../ysdk';

export interface OpenLeaderboardModalOptions {
  W: number;
  H: number;
  lang: Lang;
  difficulty: Difficulty;
  backdropDepth: number;
  modalDepth: number;
  /** Optional hook invoked before the modal is rendered (e.g. authentication prompt). */
  onBeforeOpen?: () => Promise<void>;
}

export async function openLeaderboardModal(
  scene: Phaser.Scene,
  opts: OpenLeaderboardModalOptions,
): Promise<void> {
  if (opts.onBeforeOpen) await opts.onBeforeOpen();

  const { W, H, lang, difficulty, backdropDepth, modalDepth } = opts;

  const sfx = (key: string) => {
    const am: import('../AudioManager').AudioManager | undefined =
      scene.game.registry.get('audioManager');
    am?.playSfx(key);
  };

  const localDpr  = getLocalDpr();
  const L         = LOCALES[lang];
  const cx        = W / 2;
  const cy        = H / 2;
  const isMobile  = isMobileDevice();
  const pW        = Math.min(W * 0.92, isMobile ? 729 : 486);
  const pH        = isMobile ? Math.min(H * 0.80, 800) : Math.min(H * 0.70, 600);
  const accentHex = '#' + UI.colors.accent.toString(16).padStart(6, '0');

  const backdrop = scene.add.graphics().setDepth(backdropDepth);
  backdrop.fillStyle(UI.colors.bgDark);
  backdrop.fillRect(0, 0, W, H);
  backdrop.setAlpha(0);
  scene.tweens.add({ targets: backdrop, alpha: 0.78, duration: UI.animation.fadeScene, ease: 'Sine.easeOut' });

  const modal = scene.add.container(cx, cy).setDepth(modalDepth).setAlpha(0).setScale(0.9);
  scene.tweens.add({ targets: modal, alpha: 1, scale: 1, duration: UI.animation.fadeScene, ease: 'Back.easeOut' });

  const closeModal = () => {
    sfx('sfx-click');
    backdrop.destroy();
    modal.destroy(true);
  };

  // Panel
  const panelGfx = scene.add.graphics();
  panelGfx.fillStyle(UI.panel.bg);
  panelGfx.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, UI.panel.radius);
  panelGfx.lineStyle(UI.panel.borderWidth, UI.panel.border, UI.panel.borderAlpha);
  panelGfx.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, UI.panel.radius);

  // Title
  const titleFontSize = Math.min(26, Math.floor(pW * 0.11));
  const titleY        = -pH / 2 + 28 + titleFontSize / 2;
  const titleText     = createText(scene, {
    x: 0, y: titleY, text: '🏆 ' + L.lbTitle, variant: 'title', localDpr, fontSize: titleFontSize,
  });

  // Difficulty tabs
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
  let currentDiff: Difficulty = difficulty;

  const tabH   = Math.round(32 * (localDpr / 2 + 0.5));
  const tabGap = Math.round(4 * localDpr) + 12;
  const tabW   = Math.floor((pW - tabGap * 3 - 40) / 4);
  const tabsY  = titleY + titleFontSize / 2 + 20 + tabH / 2;

  const tabHandles = new Map<Difficulty, ButtonHandle>();

  // Separator + table area
  const sepY        = tabsY + tabH / 2 + 10;
  const tableStartY = sepY + 20;
  const rowH        = Math.round(28 * (localDpr / 2 + 0.5));
  const rowGap      = 10;
  const nameFontSz  = Math.max(10, Math.floor(pW * 0.04));
  const tablePadX   = Math.round(pW * 0.07);
  const closeBtnH   = Math.max(36, Math.round(40 * (localDpr / 2 + 0.5)));
  const closeBtnW   = Math.min(pW * 0.55, 180);
  const closeBtnY   = pH / 2 - closeBtnH / 2 - 14;

  // Determine guest state up-front so the login CTA reserves space before rows render.
  // Per Yandex rule 1.2.1, auth dialog only opens via this explicit button.
  let isGuest = false;
  try {
    const sdk = getYSDK();
    if (sdk) {
      const player = await sdk.getPlayer({ scopes: false });
      isGuest = !player.isAuthorized();
    }
  } catch {
    isGuest = false;
  }

  const loginBtnH = isGuest ? Math.max(32, Math.round(34 * (localDpr / 2 + 0.5))) : 0;
  const loginBtnGap = isGuest ? 10 : 0;
  const loginBtnY = isGuest ? closeBtnY - closeBtnH / 2 - loginBtnGap - loginBtnH / 2 : 0;
  const tableBottomLimit = isGuest ? loginBtnY - loginBtnH / 2 - 8 : closeBtnY - closeBtnH / 2 - 12;
  const tableAvailH = tableBottomLimit - tableStartY;
  const maxRows     = Math.max(1, Math.min(10, Math.floor(tableAvailH / (rowH + rowGap))));

  const sep = scene.add.graphics();
  sep.lineStyle(1, UI.colors.accent, 0.35);
  sep.lineBetween(-pW * 0.4, sepY, pW * 0.4, sepY);

  const loadingText = createText(scene, { x: 0, y: tableStartY + rowH, text: L.lbLoading, variant: 'stat', localDpr });
  const tableContainer = scene.add.container(0, 0);

  // Close button
  const closeBtn  = createButton(scene, {
    x: 0, y: closeBtnY, label: L.lbClose, onClick: closeModal,
    variant: 'ghost', fixedWidth: closeBtnW, fixedHeight: closeBtnH,
    fontSize: Math.round(11 * localDpr),
  });

  modal.add([panelGfx, titleText, sep, loadingText, tableContainer, closeBtn.container]);

  if (isGuest) {
    const loginBtnW = Math.min(pW * 0.7, 240);
    const loginBtn = createButton(scene, {
      x: 0, y: loginBtnY, label: L.loginToSave,
      onClick: () => {
        sfx('sfx-click');
        const sdk = getYSDK();
        if (!sdk) return;
        sdk.auth.openAuthDialog().then(result => {
          if (result.action !== 'login' || !modal.active) return;
          renderTable(currentDiff);
        }).catch(() => {});
      },
      variant: 'ghost',
      fixedWidth: loginBtnW,
      fixedHeight: loginBtnH,
      fontSize: Math.round(10 * localDpr),
    });
    modal.add(loginBtn.container);
  }

  const renderTable = async (diff: Difficulty) => {
    tableContainer.removeAll(true);
    loadingText.setVisible(true);
    const data = await fetchLeaderboard(diff);
    if (!modal.active) return;
    loadingText.setVisible(false);
    if (!data || data.rows.length === 0) {
      tableContainer.add(createText(scene, { x: 0, y: tableStartY + rowH, text: '—', variant: 'stat', localDpr }));
      return;
    }

    const playerIdx     = data.rows.findIndex(r => r.isPlayer);
    const playerOutside = playerIdx !== -1 && playerIdx >= maxRows;
    type DisplayRow = LeaderboardRow | 'separator';
    const displayRows: DisplayRow[] = playerOutside
      ? [...data.rows.slice(0, Math.max(0, maxRows - 2)), 'separator', data.rows[playerIdx]]
      : data.rows.slice(0, maxRows);

    const safeBottomY = isGuest ? loginBtnY - loginBtnH / 2 - 6 : closeBtnY - closeBtnH / 2 - 6;
    const rowTexts: Phaser.GameObjects.Text[] = [];
    for (let i = 0; i < displayRows.length; i++) {
      const row  = displayRows[i];
      const rowY = tableStartY + i * (rowH + rowGap) + rowH / 2;
      if (rowY + rowH / 2 > safeBottomY) break;
      if (row === 'separator') {
        rowTexts.push(
          createText(scene, { x: 0, y: rowY, text: '· · ·', variant: 'stat', localDpr, fontSize: nameFontSz - 2, color: '#b8d4dc' }),
        );
        continue;
      }
      const color = row.isPlayer ? accentHex : undefined;
      rowTexts.push(
        createText(scene, { x: -(pW / 2 - tablePadX), y: rowY, text: `#${row.rank}`,       variant: 'timer', localDpr, fontSize: nameFontSz, color }),
        createText(scene, { x:  0,                    y: rowY, text: row.name,              variant: 'stat',  localDpr, fontSize: nameFontSz, color }),
        createText(scene, { x:  pW / 2 - tablePadX,  y: rowY, text: formatTime(row.score), variant: 'timer', localDpr, fontSize: nameFontSz, color }),
      );
    }
    tableContainer.add(rowTexts);
  };

  const switchDiff = (diff: Difficulty) => {
    currentDiff = diff;
    tabHandles.forEach((handle, d) => handle.setActive(d === diff));
    renderTable(diff);
  };

  difficulties.forEach((diff, i) => {
    const tx     = -pW / 2 + 20 + i * (tabW + tabGap) + tabW / 2;
    const handle = createButton(scene, {
      x: tx, y: tabsY,
      label:       L.diffLabels[diff],
      onClick:     () => { sfx('sfx-click'); switchDiff(diff); },
      variant:     'primary',
      active:      diff === currentDiff,
      noAutoScale: true,
      fixedWidth:  tabW,
      fixedHeight: tabH,
      fontSize:    Math.round(11 * localDpr),
    });
    tabHandles.set(diff, handle);
    modal.add(handle.container);
  });

  await renderTable(currentDiff);
}
