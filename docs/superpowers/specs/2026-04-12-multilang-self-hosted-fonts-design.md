# Design: Multilanguage Support + Self-Hosted Fonts

**Date:** 2026-04-12  
**Branch:** added-sounds  

---

## Summary

Add Turkish (tr), Spanish (es), Portuguese (pt), and Arabic (ar) to the existing Russian/English game. Replace Google Fonts dependency with self-hosted WOFF2 files. Replace Nunito with Rubik (supports Latin, Cyrillic, Arabic in a single family). Cinzel stays for the game title only.

---

## 1. Fonts

### Replace Google Fonts with self-hosted WOFF2

Remove the `<link>` to `fonts.googleapis.com` in `index.html`. Download and commit WOFF2 files to `public/fonts/`.

**Rubik** (replaces Nunito everywhere):
- Weights: 400, 700, 800
- Subsets: latin, latin-ext, cyrillic, arabic
- Files: `rubik-latin-400.woff2`, `rubik-latin-700.woff2`, `rubik-latin-800.woff2`, `rubik-cyrillic-400.woff2`, etc.

**Cinzel** (victory screen header in UIScene, unchanged visually):
- Weights: 700, 900
- Subset: latin
- Files: `cinzel-latin-700.woff2`, `cinzel-latin-900.woff2`

**Indira K** (game title and subtitle in MenuScene):
- Already self-hosted in `public/fonts/IndiraK.woff2` — no changes needed.

Font-face declarations go in `src/style.css` (or equivalent global CSS file). Each `@font-face` block specifies `font-display: swap` for performance.

### Phaser scene changes

All `fontFamily: 'Nunito'` occurrences in `MenuScene.ts` and `UIScene.ts` → `'Rubik'`. `fontFamily: 'Cinzel'` in `UIScene.ts` stays as Cinzel (self-hosted). `GameScene.ts` has no font references.

---

## 2. Locales (`src/game/i18n.ts`)

### Type change

```ts
export type Lang = 'ru' | 'en' | 'tr' | 'es' | 'pt' | 'ar';
```

### New locale objects

Four new entries added to `LOCALES`: `tr`, `es`, `pt`, `ar`. Each covers all `Locale` interface fields:

- `title`, `subtitle`
- `difficulty`, `diffLabels`, `diffDesc`, `diffHint`
- `sound`, `soundOn`, `soundOff`
- `play`, `menu`
- `moves(n)`, `pairs(n, total)`
- `victory`, `allPairsFound`, `movesResult(n)`, `timeResult(t)`
- `restart`, `toMenu`

Arabic strings are written in Arabic script. No RTL layout changes — Canvas renders Unicode Arabic correctly with Rubik Arabic subset loaded (Option A: text-only Arabic support).

---

## 3. Language Switcher UI (`MenuScene.ts`)

### Layout: 3 columns × 2 rows grid

Replace the current hardcoded 2-button row with a dynamic 3×2 grid:

```
[ RU ] [ EN ] [ TR ]
[ ES ] [ PT ] [ AR ]
```

Positioned in the top-right corner. Button dimensions scale with DPR (same as current buttons). Active language highlighted with `C.teal`. Inactive buttons are interactive and trigger `scene.restart()` after setting `lang` in registry.

### Code changes

- `const langs: Lang[] = ['ru', 'en']` → `['ru', 'en', 'tr', 'es', 'pt', 'ar']`
- `lStartX` calculation updated for 3 columns
- Loop renders buttons in a 3×2 grid using `Math.floor(i / 3)` for row and `i % 3` for column

---

## 4. Arabic Text Rendering

No layout changes. Phaser Canvas natively renders Arabic Unicode correctly when Rubik Arabic WOFF2 is loaded. The CSS `@font-face` declaration with the arabic unicode range ensures the Arabic glyphs are available to the Canvas context.

---

## 5. Files Changed

| File | Change |
|------|--------|
| `index.html` | Remove Google Fonts `<link>`, add no external font deps |
| `src/style.css` | Add `@font-face` blocks for Rubik + Cinzel |
| `public/fonts/` | Add WOFF2 files (Rubik latin/latin-ext/cyrillic/arabic + Cinzel latin) |
| `src/game/i18n.ts` | Add `tr`, `es`, `pt`, `ar` to `Lang` type and `LOCALES` |
| `src/game/scenes/MenuScene.ts` | Update lang switcher to 3×2 grid; `Nunito` → `Rubik` |
| `src/game/scenes/UIScene.ts` | `Nunito` → `Rubik` |
| `src/game/scenes/GameScene.ts` | No font changes needed |

---

## Out of Scope

- RTL layout mirroring for Arabic
- Language auto-detection from browser/Yandex SDK
- Persisting language selection to localStorage (existing registry behavior unchanged)