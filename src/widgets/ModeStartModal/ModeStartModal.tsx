import { useEffect, useState } from 'react';
import { useUi } from '@hooks/useUiStore';
import { bus } from '@state/eventBus';
import { closeModeStart } from '@state/modeStartController';
import { cx } from '@ui/cx';
import { ModeIcon } from '@ui/ModeIcon';
import { LOCALES } from '../../game/i18n';
import { TIME_ATTACK, PREVIEW_SEC } from '../../game/modes';
import type { Difficulty } from '../../game/layout';
import styles from './ModeStartModal.module.scss';

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
// Filled bars per difficulty — a 4-step severity indicator (easy 1 … expert 4).
const BARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l11-7z" /></svg>;
}

export function ModeStartModal() {
  const mode = useUi((s) => s.modal.modeStart);
  const lang = useUi((s) => s.menu.lang);
  // Local selection; defaults to Easy every time the modal opens (it remounts per open).
  const [selected, setSelected] = useState<Difficulty>('easy');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModeStart(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!mode) return null;
  const L = LOCALES[lang];
  // Per-mode difficulty caption (pairs·cards for classic/survival; timeAttack/noMistakes
  // show their own params). No "average time" yet — pending real data.
  const caption = (d: Difficulty) =>
    mode === 'timeAttack' ? L.taParams(TIME_ATTACK[d].startSec, TIME_ATTACK[d].bonusSec)
    : mode === 'noMistakes' ? L.previewParams(PREVIEW_SEC[d])
    : L.diffDesc[d];

  return (
    <div className={styles.backdrop} data-testid="mode-start" onClick={closeModeStart}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={L.modeLabels[mode]}>
        <header className={styles.head}>
          <div className={styles.titleWrap}>
            <p className={styles.eyebrow}>{L.modesTitle}</p>
            <div className={styles.titleRow}>
              <span className={styles.modeIco}><ModeIcon mode={mode} /></span>
              <h2 className={styles.title}>{L.modeLabels[mode]}</h2>
            </div>
          </div>
          <button type="button" data-testid="mode-start-close" className={styles.close} aria-label={L.lbClose} onClick={closeModeStart}>×</button>
        </header>

        <p className={styles.desc}>{L.modeDesc[mode]}</p>

        <div className={styles.sect}><hr /><span>{L.difficulty}</span><hr /></div>

        <div className={styles.grid}>
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              data-testid={`mode-diff-${d}`}
              aria-pressed={d === selected}
              className={cx(styles.tile, styles[d], d === selected && styles.sel)}
              onClick={() => setSelected(d)}
            >
              {d === 'easy' && <span className={styles.ribbon}>{L.modeBeginner}</span>}
              <span className={styles.check}><CheckIcon /></span>
              <span className={styles.tname}>{L.diffLabels[d]}</span>
              <span className={styles.bars} aria-hidden="true">
                {[0, 1, 2, 3].map((i) => <i key={i} className={i < BARS[d] ? styles.on : undefined} />)}
              </span>
              <span className={styles.tcap}>{caption(d)}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          data-testid="mode-start-play"
          className={styles.cta}
          onClick={() => bus.emit('cmd:play', { mode, difficulty: selected })}
        >
          <span className={styles.play}><PlayIcon /></span>
          {L.playCta} · {L.diffLabels[selected]}
        </button>
      </div>
    </div>
  );
}
