# Карточные дуэты

Браузерная карточная игра на память в морской тематике. Переворачивай карточки и находи совпадающие пары — 14 морских существ от осьминога до акулы.

## Геймплей

- Поле состоит из карточек, перевёрнутых лицом вниз
- За один ход открываются две карточки
- Если символы совпадают — пара найдена, карточки остаются открытыми
- Цель — найти все пары, совершив как можно меньше ходов за как можно меньшее время
- На победном экране показываются ходы, время и место в лидерборде

## Уровни сложности

| Уровень | Карточек | Пар |
|---------|----------|-----|
| Лёгкий   | 12 | 6  |
| Средний  | 20 | 10 |
| Сложный  | 24 | 12 |
| Эксперт  | 28 | 14 |

Раскладка карточек на каждом уровне — фигурная (не прямоугольная сетка), описана в `src/game/layout.ts`.

## Локализация

Поддерживаются 5 языков: русский, английский, испанский, португальский, турецкий. Перевод определяется автоматически по `navigator.language`, строки — в `src/game/i18n.ts`.

## Запуск

```bash
npm install
npm run dev       # режим разработки (http://localhost:5173)
npm run build     # сборка для продакшена + game.zip для Яндекс.Игр
npm run preview   # предпросмотр собранной версии
```

## Тесты

```bash
npm test                    # unit-тесты (Vitest)
npm run test:coverage       # с покрытием
npm run test:e2e            # e2e (Playwright): desktop, mobile, mobile-dpr2
npm run test:e2e:update     # обновить скриншот-эталоны
```

## Промо-скриншоты

Для размещения игры на Яндекс.Играх и других площадках есть скрипт автогенерации промо-кадров на всех языках.

```bash
npm run screenshots:promo
```

Что делает:
1. Поднимает dev-сервер и Playwright (`promo-mobile` 1080×1920 и `promo-desktop` 1920×1080)
2. Прогоняет сценарий из `e2e/promo-screenshots.spec.ts`: меню → доска → совпадение → середина игры → победный экран — на каждом из 5 языков
3. Сохраняет 60 PNG-кадров в `screenshots/promo/promo-desktop/` и `screenshots/promo/promo-mobile/`
4. Упаковывает всё в `screenshots/promo/promo.zip` (zip игнорируется git'ом, исходные PNG — нет)

## Ассеты

Изображения и звуки лежат в `public/assets/`:

```
public/assets/
  bg.webp              ← основной фон
  title-bg.webp        ← фон главного меню
  iland.webp           ← остров (декор)
  music.mp3            ← фоновая музыка
  cards/
    back.webp          ← рубашка
    octopus.webp, crab.webp, clownfish.webp, ...  ← 15 морских существ
  sfx/
    flip.mp3, match.mp3, click.mp3, cancel.mp3, win.wav
```

Список ключей символов — в `src/game/assets-config.ts` (`SYMBOLS`).

## Цветовая схема

Палитра темы (`C`) — в `src/game/config.ts`:

```typescript
export const C = {
  bgDark:  0x071528, // основной фон
  bgMid:   0x0d2137, // панели, рубашки карточек
  ocean:   0x1b4965, // неактивные кнопки, границы
  teal:    0x00b4d8, // выделение, акценты
  foam:    0xade8f4, // текст заголовков
  coral:   0xff6b6b, // главный акцент
  gold:    0xffd166, // счёт, победный экран
  dim:     0x4d6680, // вспомогательный текст
};
```

## Структура проекта

Слоёная архитектура: **состояние и связь** (`state/`) отделены от **React-слоя** (`ui/`) и **Phaser-слоя** (`game/`). Раскладка построена по образцу проекта Merge.

```
src/
  main.tsx               ← точка входа: Яндекс SDK, язык, рендер <App/>
  index.css              ← глобальные шрифты + reset
  ysdk.ts · YSDKContext.tsx · yandex-sdk.d.ts   ← интеграция с Яндекс.Играми

  state/                 ← слой состояния и связи (без React/Phaser)
    store.ts             ← единый uiStore (слайсы menu/hud/modal/transition) + сеттеры
    createStore.ts       ← мини-стор на useSyncExternalStore + useStore(store, selector)
    eventBus.ts          ← типизированная командная шина: bus.emit('cmd:*')
    types.ts             ← общие типы UI
    leaderboardController.ts  ← логика модалки лидерборда (React-сторона)
    __tests__/           ← unit-тесты стора и шины

  ui/                    ← React-слой (DOM-оверлей поверх канваса)
    App.tsx              ← корневой компонент: композиция оверлея внутри GameMount
    GameMount.tsx        ← монтирование Phaser + сайзинг канваса (DPR / баннер)
    hooks/
      useUiStore.ts      ← useUi(selector) — чтение среза стора
      useBusEvent.ts     ← подписка на командную шину
    components/          ← все компоненты плоско: меню, HUD, модалки, кнопки (16 шт.)

  styles/                ← SCSS: _tokens, _mixins, menu, hud, modals, button

  game/                  ← Phaser-слой (игровая логика + канвас)
    main.ts              ← createGame(parent)
    config.ts            ← конфигурация Phaser + палитра C
    assets-config.ts     ← список символов (морские существа)
    layout.ts            ← раскладки карточек по уровням
    i18n.ts              ← локализация (5 языков)
    settings.ts          ← пользовательские настройки
    AudioManager.ts      ← музыка и звуки
    device.ts            ← определение устройства / DPR
    leaderboard.ts       ← топ результатов (Яндекс)
    scenes/
      BootScene.ts       ← генерация текстур, загрузка ассетов
      MenuScene.ts       ← меню: настройки + старт игры (на канвасе рисует только фон)
      GameScene.ts       ← игровая логика + карточки на канвасе
      UIScene.ts         ← часы/счёт/победа, проксирует события игры в стор
    ui/
      config.ts          ← UI-токены канваса (зеркалятся в styles/_tokens.scss)
      factory.ts         ← вспомогательные функции отрисовки

public/assets/           ← изображения и звуки
e2e/                     ← Playwright-тесты + промо-скриншоты
screenshots/promo/       ← готовые промо-кадры
```

### Связь слоёв

- **Источник истины** настроек — `game.registry` (Phaser).
- **React → Phaser** (команды): клик в DOM → `bus.emit('cmd:…')` → активная сцена, подписанная в `create()` (отписка в `shutdown`), выполняет действие. Прямых ссылок React↔сцена нет.
- **Phaser → React** (состояние): сцены пишут в `uiStore` через `setMenu/setHud/setModal/setTransition`; компоненты читают срез через `useUi(s => …)` и перерисовываются только при изменении своего среза.
- Канвас рисует фон + остров + карточки; меню, HUD и модалки — React-DOM поверх канваса (`pointer-events:none` на контейнере, интерактивные виджеты включают ввод сами).
