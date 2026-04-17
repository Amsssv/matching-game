// ── Helpers ───────────────────────────────────────────────────────────────────

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

// ── Raw palette — internal, not exported directly ─────────────────────────────

const palette = {
  navy:     0x001428,  // deepest background
  navyMid:  0x002244,  // panels, unselected buttons
  blue:     0x0d47a1,  // active state, primary action
  blueMid:  0x1565c0,  // borders, hover state
  white:    0xffffff,
  textDim:  0xb8d4dc,  // secondary text
  gold:     0xf7d077,  // scores, accent
  goldRing: 0xd4a853,  // deep-button gold ring / border
  coral:    0xff6b6b,
} as const;

// ── Design tokens ─────────────────────────────────────────────────────────────

const _dpr = Math.min(window.devicePixelRatio || 1, 2);

export const UI = {

  // ── Semantic colors ─────────────────────────────────────────────────────────
  colors: {
    bgDark:    palette.navy,
    bgMid:     palette.navyMid,
    primary:   palette.blue,
    border:    palette.blueMid,
    text:      palette.white,
    textDim:   palette.textDim,
    accent:    palette.gold,
    accentDim: palette.goldRing,
  },

  // ── Typography ──────────────────────────────────────────────────────────────
  font: {
    body:    'Rubik, sans-serif',
    display: '"Indira K", sans-serif',
    shadow: { offsetX: 0, offsetY: 2, color: '#003250', blur: 10, fill: true },
  },

  // ── Text styles ─────────────────────────────────────────────────────────────
  text: {
    /**
     * Section label — bold header above UI blocks ("DIFFICULTY", "SOUND", etc.).
     * baseFontSize is multiplied by localDpr at render time.
     */
    sectionLabel: {
      fontFamily:         'Rubik, sans-serif',
      fontStyle:          'bold' as const,
      color:              '#F5F5F0',
      shadow:             { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.9)', blur: 10, fill: true },
      padding:            { x: 16, y: 10 },
      baseFontSize:       18,
      letterSpacingRatio: 0.3,
    },
    /** Hint / caption — small dimmed text under buttons. */
    hint: {
      fontFamily:   'Rubik, sans-serif',
      fontStyle:    'normal' as const,
      color:        '#ffffffe6',
      baseFontSize: 16,
    },
    /** Dimmed stat text — header moves/pairs, victory subtitles. */
    stat: {
      fontFamily:   'Rubik, sans-serif',
      fontStyle:    'normal' as const,
      color:        '#B8D4DC',
      baseFontSize: 14,
    },
    /** Bold primary text — timer, emphasis values. */
    timer: {
      fontFamily:   'Rubik, sans-serif',
      fontStyle:    'bold' as const,
      color:        '#ffffff',
      baseFontSize: 18,
    },
    /**
     * Display title — gold gradient, drop shadow, depth 2.
     * baseFontSize is intentionally 0: callers (createTitle) compute the
     * responsive size and pass it via the fontSize override.
     */
    title: {
      fontFamily:    '"Indira K", sans-serif',
      fontStyle:     'bold' as const,
      color:         '#f7e089',
      shadow:        { offsetX: 0, offsetY: 2, color: '#003250', blur: 10, fill: true },
      gradient:      ['#fdfacd', '#f7e089'] as [string, string],
      depth:         2,
      maxWidthRatio: 0.9,
      baseFontSize:  0,
    },
    /** Display subtitle — dark indigo, no shadow. */
    subtitle: {
      fontFamily:    '"Indira K", sans-serif',
      fontStyle:     'normal' as const,
      color:         '#01286a',
      maxWidthRatio: 0.88,
      baseFontSize:  0,
    },
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  button: {
    /** Horizontal padding between label edge and button border */
    paddingX: 28,
    /** Vertical padding between label edge and button border */
    paddingY: 14,
    radius:   16,
    minWidth: 120,

    variants: {
      /**
       * Primary — deep ocean gradient, gold ring.
       * Use for: difficulty select, sound toggle, play / main-action buttons.
       */
      primary: {
        style:       'deep' as const,
        text:        '#F5E6C8',
        gradActive:  ['rgba(10,61,122,0.92)', 'rgba(1,40,106,0.95)'] as [string, string],
        gradHover:   ['rgba(2,52,122,0.87)',  'rgba(1,35,88,0.90)']  as [string, string],
        gradInact:   ['rgba(1,40,106,0.82)',  'rgba(1,29,74,0.85)']  as [string, string],
        borderColor: palette.goldRing as number,
      },

      /**
       * Secondary — flat teal fill.
       * Use for: victory "Restart" button.
       */
      secondary: {
        style:   'flat' as const,
        text:    '#ffffff',
        bg:      palette.blue     as number,
        bgHover: palette.blueMid  as number,
        border:  palette.blue     as number,
      },

      /**
       * Ghost — flat dark fill, dimmed text.
       * Use for: header "Menu" button, victory "To Menu" button.
       */
      ghost: {
        style:   'flat' as const,
        text:    '#b8d4dc',
        bg:      palette.navyMid  as number,
        bgHover: palette.blue     as number,
        border:  palette.blueMid  as number,
      },
    },
  },

  // ── Layout ───────────────────────────────────────────────────────────────────
  layout: {
    /** Header bar height in game pixels (= 56 CSS px × DPR). */
    headerH: Math.round(56 * _dpr),
  },

  // ── Animation durations (ms) ─────────────────────────────────────────────────
  animation: {
    /** Camera fadeIn / fadeOut between scenes */
    fadeScene:      300,
    /** Delay between flipping 2nd card and running match check */
    cardFlipDelay:  800,
    /** Delay between last pair found and game-complete event */
    cardMatchDelay: 600,
    /** Alpha yoyo duration for matched-pair flash */
    cardMatchFlash: 180,
  },

  // ── Panel ────────────────────────────────────────────────────────────────────
  panel: {
    radius:      14,
    bg:          palette.navyMid  as number,
    border:      palette.blue     as number,
    borderAlpha: 0.7,
    borderWidth: 2,
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    radius:        12,
    aspectRatio:   4 / 3,
    hoverScale:    1.06,
    hoverDuration: 100,
    matchedAlpha:  0.45,
    flipDuration:  140,
  },

};