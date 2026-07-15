import type { GameMode } from './modes';
import type { BiomeId } from '../state/campaign';

export type Lang = 'ru' | 'en' | 'tr' | 'es' | 'pt';

export interface Locale {
  title: string;
  description: string;
  subtitle: string;
  difficulty: string;
  diffLabels: Record<'easy' | 'medium' | 'hard' | 'expert', string>;
  diffDesc:   Record<'easy' | 'medium' | 'hard' | 'expert', string>;
  diffHint:   Record<'easy' | 'medium' | 'hard' | 'expert', string>;
  modesTitle: string;                              // menu section header above the mode picker
  modeRecommended: string;                         // ribbon on the recommended (classic) mode card
  modeBeginner: string;                            // ribbon on the "easy" difficulty tile (mode-start modal)
  playCta: string;                                 // mode-start CTA verb, e.g. "Play · Easy"
  modeLabels: Record<GameMode, string>;            // short card labels (must fit ~144px cards)
  modeDesc:   Record<GameMode, string>;            // 1-line rules (mode-start modal + help)
  modeLockedLv: (n: number) => string;             // locked-card sub-line, e.g. "Unlocks at level N"
  taParams: (start: number, bonus: number) => string;   // timeAttack difficulty sub-line
  previewParams: (sec: number) => string;               // noMistakes preview sub-line
  memorize: string;                                // preview overlay "Memorize!"
  defeatTimeout: string;                           // defeat modal title (timeout)
  defeatMistake: string;                           // defeat modal title (mistake)
  defeatPairs: (n: number, total: number) => string;    // "Pairs found: n of total"
  sound: string;
  soundOn: string;
  soundOff: string;
  play: string;
  journeyTitle: string;
  journeySubtitle: string;  // world-map screen: small tracked subtitle under the title
  menu: string;
  moves: (n: number) => string;
  pairs: (n: number, total: number) => string;
  victory: string;
  allPairsFound: string;
  vRecord: string;        // victory "new record" banner
  vFirstWin: string;      // victory "first win of the day ×2" chip
  profile: string;        // profile modal title + button
  level: string;          // "Level" label
  levelUpTitle: string;   // level-up modal title
  levelUpCta: string;     // level-up modal continue button
  statGames: string; statWins: string; statPairs: string;   // profile lifetime-stat labels
  movesResult: (n: number) => string;
  timeResult: (t: string) => string;
  restart: string;
  toMenu: string;
  movesLabel: string;
  timeLabel: string;
  leaderboard: string;
  loginToSave: string;
  lbTitle:     string;
  lbLoading:   string;
  lbClose:     string;
  lbPlayer:    string;       // leaderboard column header (player)
  lbEmpty:     string;       // leaderboard empty state
  shop: string;            // menu button + modal title, e.g. "Коллекция"
  shopBuy: string;
  shopEquip: string;
  shopEquipped: string;
  shopTabSea: string;
  shopTabBack: string;
  shopTabPalette: string;
  shopCollected: string;       // collection progress label, e.g. "Собрано 2/4"
  comingSoon: string;          // placeholder for a temporarily disabled collection
  shopItems: Record<string, string>;   // nameKey → localized item name
  dailyTitle: string;
  dailyClaim: string;
  dailyDouble: string;
  dailyComeBack: string;
  tasks: string;
  tasksTabQuests: string;
  tasksTabAch: string;
  taskClaim: string;
  taskClaimed: string;
  taskReroll: string;
  quests: Record<string, string>;
  achievements: Record<string, string>;
  help: { title: string; sections: { h: string; lines: string[] }[] };
  storeTitle: string;   // premium store modal title
  iapBuy: string;       // generic money-buy button label (fallback when SDK price is unknown)
  storePacks: string;   // store section header: pearl packs
  storeBundles: string; // store section header: bundles
  shopTabExclusive: string;   // store section header: exclusives
  bundleIncludes: string;     // "Includes:" prefix on a bundle card
  bundleOwned: string;        // bundle fully-owned state label
  levelWord: string;       // "Level" label (campaign level-start sheet title, e.g. "Level 3")
  goalComplete: string;    // campaign level goal: complete the level
  goalMoves: string;       // campaign level goal: within {n} moves
  goalTime: string;        // campaign level goal: within {n} seconds
  refillFor: string;       // energy refill button label, e.g. "Refill for {n}"
  levelCleared: string;    // level-result modal title (win)
  levelFailed: string;     // level-result modal title (loss)
  skinUnlocked: string;    // level-result modal: new skin unlocked line
  continue: string;        // level-result modal continue button
  mapBack: string;         // island-view header back button label, e.g. "Map"
  biomeNames: Record<BiomeId, string>;   // island-view header gold title per chapter
  levelHint: string;       // island-view mobile hint; "{n}" → current level index
  levelHintDone: string;   // island-view mobile hint when all levels cleared
}

export const LOCALES: Record<Lang, Locale> = {
  ru: {
    title:       'КАРТОЧНЫЕ ДУЭТЫ',
    description: 'Карточные дуэты — весёлая игра на память: открывай карточки, находи пары морских обитателей, проходи режимы и уровни, собирай коллекцию!',
    subtitle: 'Карточная игра на память',
    difficulty: 'СЛОЖНОСТЬ',
    diffLabels: { easy: 'ЛЕГКО', medium: 'СРЕДНЕ', hard: 'СЛОЖНО', expert: 'ЭКСПЕРТ' },
    diffDesc:   {
      easy:   '6 пар · 12 карточек',
      medium: '10 пар · 20 карточек',
      hard:   '12 пар · 24 карточки',
      expert: '14 пар · 28 карточек',
    },
    diffHint: {
      easy:   'Идеально для начинающих',
      medium: 'Классическая игра',
      hard:   'Для настоящих мастеров',
      expert: 'Все 14 существ!',
    },
    modesTitle: 'РЕЖИМ ИГРЫ',
    modeRecommended: 'Рекомендуем',
    modeBeginner: 'Для новичков', playCta: 'Играть',
    modeLabels: { classic: 'КЛАССИКА', timeAttack: 'НА ВРЕМЯ', survival: 'ВЫЖИВАНИЕ', noMistakes: 'БЕЗ ОШИБОК' },
    modeDesc: {
      classic:    'Находи пары в своём темпе — без ограничений.',
      timeAttack: 'Успей до конца времени! Каждая найденная пара добавляет секунды.',
      survival:   'Ошибся — все найденные пары закрываются. Собери всё без промаха!',
      noMistakes: 'Запомни карты за время показа. Одна ошибка — поражение!',
    },
    modeLockedLv: (n) => `Откроется на ур. ${n}`,
    taParams: (start, bonus) => `${start} сек, +${bonus} за пару`,
    previewParams: (sec) => `показ ${sec} сек`,
    memorize: 'Запоминай!',
    defeatTimeout: 'ВРЕМЯ ВЫШЛО!',
    defeatMistake: 'ОШИБКА!',
    defeatPairs: (n, total) => `Найдено пар: ${n} из ${total}`,
    sound:   'ЗВУК',
    soundOn: 'ВКЛЮЧЁН',
    soundOff: 'ВЫКЛЮЧЕН',
    play:    'НАЧАТЬ ИГРУ',
    journeyTitle: 'Путешествие',
    journeySubtitle: 'ВЫБЕРИТЕ МИР',
    menu:    'МЕНЮ',
    moves:   (n) => `Ходов: ${n}`,
    pairs:   (n, total) => `Пар: ${n} / ${total}`,
    victory: 'ПОБЕДА!',
    allPairsFound: 'Все пары найдены!',
    vRecord: 'Новый рекорд!',
    vFirstWin: 'Первая победа ×2',
    profile: 'Профиль', level: 'Уровень', levelUpTitle: 'Новый уровень!', levelUpCta: 'Продолжить', statGames: 'Игры', statWins: 'Победы', statPairs: 'Пары',
    movesResult: (n) => `Ходов: ${n}`,
    timeResult:  (t) => `Время: ${t}`,
    restart: 'ЗАНОВО',
    toMenu:  'В МЕНЮ',
    movesLabel: 'ХОДОВ',
    timeLabel:  'ВРЕМЯ',
    leaderboard: 'РЕКОРДЫ',
    loginToSave: 'Войти и сохранить рекорд',
    lbTitle:     'Таблица рекордов',
    lbLoading:   'Загрузка...',
    lbClose:     'ЗАКРЫТЬ',
    lbPlayer: 'Игрок', lbEmpty: 'Пока нет рекордов',
    shop: 'Коллекция', shopBuy: 'Купить', shopEquip: 'Надеть', shopEquipped: 'Активно',
    shopTabSea: 'Море', shopTabBack: 'Рубашка', shopTabPalette: 'Палитра', shopCollected: 'Собрано', comingSoon: 'Скоро',
    shopItems: { seaLagoon:'Лагуна', seaReef:'Риф', seaAbyss:'Бездна', seaArctic:'Арктика', seaLava:'Лава',
      backClassic:'Классика', backGold:'Золото', backCoral:'Коралл', backDeep:'Глубина', backSilver:'Серебро', backJade:'Нефрит', backOnyx:'Оникс',
      uiOcean:'Океан', uiSunset:'Закат', uiEmerald:'Изумруд', uiAmethyst:'Аметист', uiCrimson:'Багрянец', uiSlate:'Графит', uiSand:'Песок', uiAurora:'Аврора', backPrism:'Призма', bundleFounder:'Набор основателя', bundlePremium:'Премиум-набор' },
    dailyTitle: 'Ежедневная награда', dailyClaim: 'Забрать', dailyDouble: 'Удвоить за рекламу', dailyComeBack: 'Возвращайтесь завтра!',
    storeTitle: 'Магазин', iapBuy: 'Купить', storePacks: 'Жемчуг', storeBundles: 'Наборы',
    shopTabExclusive: 'Эксклюзив', bundleIncludes: 'В наборе:', bundleOwned: 'Получено',
    levelWord: 'Уровень', goalComplete: 'Пройти уровень', goalMoves: 'За {n} ходов', goalTime: 'За {n} сек',
    refillFor: 'Пополнить за {n}', levelCleared: 'Уровень пройден!', levelFailed: 'Не пройден',
    skinUnlocked: 'Открыт новый скин!', continue: 'Продолжить',
    mapBack: 'Карта',
    biomeNames: { lagoon: 'ПЕСЧАНАЯ БУХТА', volcano: 'ОГНЕННЫЙ КРАТЕР', reef: 'КОРАЛЛОВЫЙ РИФ', arctic: 'ЛЕДЯНОЙ БЕРЕГ', abyss: 'КРИСТАЛЬНЫЙ ГРОТ' },
    levelHint: 'Ваш ход — уровень {n}. Тропа показывает путь.',
    levelHintDone: 'Мир пройден!',
    tasks:'Задания', tasksTabQuests:'Квесты', tasksTabAch:'Достижения', taskClaim:'Забрать', taskClaimed:'Получено', taskReroll:'Обновить',
    quests: { qWinGames:'Выиграй 3 игры', qMatchPairs:'Собери 20 пар', qPlayGames:'Сыграй 5 игр', qWinHard:'Победа на сложном', qPerfectWin:'Идеальная игра', qFastWin:'Быстрая победа', qWinMedium:'2 победы на среднем', qMatchPairsBig:'Собери 40 пар' },
    achievements: { aFirstWin:'Первая победа', aWin10:'10 побед', aWin50:'50 побед', aPairs100:'100 пар', aPairs500:'500 пар', aExpertWin:'Победа на эксперте', aAllDifficulties:'Все сложности', aStreak7:'Стрик 7 дней', aCollector:'5 предметов в коллекции', aRich:'1000 жемчуга всего', aPerfectionist:'10 идеальных игр', aSpeedrunner:'10 быстрых побед', aWin25:'25 побед', aPlay25:'Сыграй 25 игр', aPlay100:'Сыграй 100 игр', aPairs1000:'1000 пар', aHardMaster:'10 побед на сложном', aExpertMaster:'10 побед на эксперте', aStreak30:'Стрик 30 дней', aCollector15:'15 предметов в коллекции', aLevel5:'Уровень 5', aLevel10:'Уровень 10', aTaWin:'Победа в режиме "На время"', aTaWin10:'10 побед в режиме "На время"', aSurvWin:'Победа в режиме "Выживание"', aSurvWin10:'10 побед в режиме "Выживание"', aNmWin:'Победа в режиме "Без ошибок"', aNmWin10:'10 побед в режиме "Без ошибок"', aAllModes:'Победа во всех режимах', aWin100:'100 побед', aPlay250:'Сыграй 250 игр', aPairs2500:'2500 пар', aPerfect25:'25 идеальных игр', aFast25:'25 быстрых побед', aStreak14:'Стрик 14 дней', aRich5000:'5000 жемчуга всего', aCampFirst:'Первый уровень путешествия', aCampChapter:'Пройди главу путешествия', aCampLevels30:'30 уровней путешествия', aCampStars50:'50 звёзд путешествия', aCampStars120:'120 звёзд путешествия', aCampAllChapters:'Все главы путешествия', aSeaAll:'Все морские темы', aBacksAll:'Все рубашки карт', aPalettesAll:'Все палитры интерфейса' },
    help: {
      title: 'Как играть',
      sections: [
        { h: 'Цель игры', lines: [
          'Переворачивай по две карточки за ход.',
          'Совпали — пара остаётся открытой. Нет — карточки закрываются обратно.',
          'Открой все пары, чтобы победить. Меньше ходов и быстрее время — лучше результат.',
        ] },
        { h: 'Сложности', lines: [
          'Лёгкий — 6 пар, средний — 10, сложный — 12, эксперт — 14.',
          'Чем выше сложность, тем больше карточек и награда.',
        ] },
        { h: 'Режимы игры', lines: [
          'Классика — обычная игра без ограничений.',
          'На время (со 2 уровня) — успей до конца таймера; каждая пара добавляет секунды.',
          'Выживание (с 3 уровня) — ошибка закрывает все найденные пары.',
          'Без ошибок (с 5 уровня) — запомни карты за время показа; одна ошибка — поражение.',
        ] },
        { h: 'Путешествие', lines: [
          'Карта из островов-глав, в каждой 12 уровней со своими целями.',
          'Звёзды: 1 за победу и по звезде за цели (мало ходов, быстрое время, без ошибок) — до 3 за уровень.',
          'Энергия: запуск уровня тратит 1 жизнь (макс 5); жизнь восстанавливается за 25 минут или пополни за жемчуг.',
          'Новые острова открываются, когда наберёшь достаточно звёзд.',
        ] },
        { h: 'Что есть в игре', lines: [
          'Коллекция — открывай оформление моря, рубашки и палитры за жемчуг.',
          'Ежедневная награда — заходи каждый день и забирай жемчуг.',
          'Задания — квесты и достижения с наградами.',
          'Рекорды — таблица лучших результатов.',
          'Магазин — паки жемчуга, наборы и эксклюзивные предметы за деньги.',
        ] },
        { h: 'Как заработать жемчуг', lines: [
          'Базовая награда за каждую победу.',
          'Бонусы: идеальная игра без ошибок, быстрое время и новый личный рекорд.',
          'Первая победа за день — награда ×2.',
          'Частые победы подряд приносят меньше (защита от фарма).',
          'Дополнительно: ежедневный стрик, квесты, достижения и удвоение за рекламу.',
        ] },
        { h: 'Опыт и уровень', lines: [
          'За каждую победу начисляется опыт (XP).',
          'Заполни полосу опыта, чтобы поднять уровень.',
          'Каждый новый уровень приносит жемчуг.',
        ] },
      ],
    },
  },

  en: {
    title:       'CARD DUETS',
    description: 'Card Duets — a fun memory game: flip cards, match pairs of sea creatures, play four modes, clear a journey map and collect skins. Great for all ages!',
    subtitle: 'A memory card game',
    difficulty: 'DIFFICULTY',
    diffLabels: { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD', expert: 'EXPERT' },
    diffDesc:   {
      easy:   '6 pairs · 12 cards',
      medium: '10 pairs · 20 cards',
      hard:   '12 pairs · 24 cards',
      expert: '14 pairs · 28 cards',
    },
    diffHint: {
      easy:   'Perfect for beginners',
      medium: 'Classic gameplay',
      hard:   'For true masters',
      expert: 'All 14 creatures!',
    },
    modesTitle: 'GAME MODE',
    modeRecommended: 'Recommended',
    modeBeginner: 'For beginners', playCta: 'Play',
    modeLabels: { classic: 'CLASSIC', timeAttack: 'TIME ATTACK', survival: 'SURVIVAL', noMistakes: 'NO MISTAKES' },
    modeDesc: {
      classic:    'Find pairs at your own pace — no limits.',
      timeAttack: 'Beat the clock! Every pair you find adds seconds.',
      survival:   'One miss flips all found pairs back. Clear the board without a slip!',
      noMistakes: 'Memorize the cards during the preview. One mistake and you lose!',
    },
    modeLockedLv: (n) => `Unlocks at level ${n}`,
    taParams: (start, bonus) => `${start} sec, +${bonus} per pair`,
    previewParams: (sec) => `${sec} sec preview`,
    memorize: 'Memorize!',
    defeatTimeout: "TIME'S UP!",
    defeatMistake: 'A MISTAKE!',
    defeatPairs: (n, total) => `Pairs found: ${n} of ${total}`,
    sound:   'SOUND',
    soundOn: 'ON',
    soundOff: 'OFF',
    play:    'START GAME',
    journeyTitle: 'Journey',
    journeySubtitle: 'CHOOSE A WORLD',
    menu:    'MENU',
    moves:   (n) => `Moves: ${n}`,
    pairs:   (n, total) => `Pairs: ${n} / ${total}`,
    victory: 'VICTORY!',
    allPairsFound: 'All pairs found!',
    vRecord: 'New record!',
    vFirstWin: 'First win ×2',
    profile: 'Profile', level: 'Level', levelUpTitle: 'New level!', levelUpCta: 'Continue', statGames: 'Games', statWins: 'Wins', statPairs: 'Pairs',
    movesResult: (n) => `Moves: ${n}`,
    timeResult:  (t) => `Time: ${t}`,
    restart: 'RESTART',
    toMenu:  'TO MENU',
    movesLabel: 'MOVES',
    timeLabel:  'TIME',
    leaderboard: 'RECORDS',
    loginToSave: 'Log in to save score',
    lbTitle:     'Leaderboard',
    lbLoading:   'Loading...',
    lbClose:     'CLOSE',
    lbPlayer: 'Player', lbEmpty: 'No records yet',
    shop: 'Collection', shopBuy: 'Buy', shopEquip: 'Equip', shopEquipped: 'Equipped',
    shopTabSea: 'Sea', shopTabBack: 'Card back', shopTabPalette: 'Palette', shopCollected: 'Collected', comingSoon: 'Coming soon',
    shopItems: { seaLagoon:'Lagoon', seaReef:'Reef', seaAbyss:'Abyss', seaArctic:'Arctic', seaLava:'Lava',
      backClassic:'Classic', backGold:'Gold', backCoral:'Coral', backDeep:'Deep', backSilver:'Silver', backJade:'Jade', backOnyx:'Onyx',
      uiOcean:'Ocean', uiSunset:'Sunset', uiEmerald:'Emerald', uiAmethyst:'Amethyst', uiCrimson:'Crimson', uiSlate:'Slate', uiSand:'Sand', uiAurora:'Aurora', backPrism:'Prism', bundleFounder:"Founder's Pack", bundlePremium:'Premium Pack' },
    dailyTitle: 'Daily reward', dailyClaim: 'Claim', dailyDouble: 'Double via ad', dailyComeBack: 'Come back tomorrow!',
    storeTitle: 'Store', iapBuy: 'Buy', storePacks: 'Pearls', storeBundles: 'Bundles',
    shopTabExclusive: 'Exclusive', bundleIncludes: 'Includes:', bundleOwned: 'Owned',
    levelWord: 'Level', goalComplete: 'Complete the level', goalMoves: 'Within {n} moves', goalTime: 'Within {n}s',
    refillFor: 'Refill for {n}', levelCleared: 'Level cleared!', levelFailed: 'Level failed',
    skinUnlocked: 'New skin unlocked!', continue: 'Continue',
    mapBack: 'Map',
    biomeNames: { lagoon: 'SANDY BAY', volcano: 'FIRE CRATER', reef: 'CORAL REEF', arctic: 'ICY SHORE', abyss: 'CRYSTAL GROTTO' },
    levelHint: 'Your turn — level {n}. The trail shows the way.',
    levelHintDone: 'World complete!',
    tasks:'Tasks', tasksTabQuests:'Quests', tasksTabAch:'Achievements', taskClaim:'Claim', taskClaimed:'Claimed', taskReroll:'Reroll',
    quests: { qWinGames:'Win 3 games', qMatchPairs:'Match 20 pairs', qPlayGames:'Play 5 games', qWinHard:'Win on hard', qPerfectWin:'A perfect game', qFastWin:'A fast win', qWinMedium:'Win 2 on medium', qMatchPairsBig:'Match 40 pairs' },
    achievements: { aFirstWin:'First win', aWin10:'10 wins', aWin50:'50 wins', aPairs100:'100 pairs', aPairs500:'500 pairs', aExpertWin:'Win on expert', aAllDifficulties:'All difficulties', aStreak7:'7-day streak', aCollector:'5 cosmetics owned', aRich:'1000 pearls earned', aPerfectionist:'10 perfect games', aSpeedrunner:'10 fast wins', aWin25:'25 wins', aPlay25:'Play 25 games', aPlay100:'Play 100 games', aPairs1000:'1000 pairs', aHardMaster:'10 wins on hard', aExpertMaster:'10 wins on expert', aStreak30:'30-day streak', aCollector15:'15 cosmetics owned', aLevel5:'Level 5', aLevel10:'Level 10', aTaWin:'Win in Time Attack', aTaWin10:'10 wins in Time Attack', aSurvWin:'Win in Survival', aSurvWin10:'10 wins in Survival', aNmWin:'Win in No Mistakes', aNmWin10:'10 wins in No Mistakes', aAllModes:'Win in every mode', aWin100:'100 wins', aPlay250:'Play 250 games', aPairs2500:'2500 pairs', aPerfect25:'25 perfect games', aFast25:'25 fast wins', aStreak14:'14-day streak', aRich5000:'5000 pearls earned', aCampFirst:'First journey level', aCampChapter:'Clear a journey chapter', aCampLevels30:'30 journey levels', aCampStars50:'50 journey stars', aCampStars120:'120 journey stars', aCampAllChapters:'All journey chapters', aSeaAll:'All sea themes', aBacksAll:'All card backs', aPalettesAll:'All UI palettes' },
    help: {
      title: 'How to play',
      sections: [
        { h: 'Goal', lines: [
          'Flip two cards on each turn.',
          'A match stays face-up; otherwise both cards flip back.',
          'Clear every pair to win. Fewer moves and a faster time mean a better result.',
        ] },
        { h: 'Difficulties', lines: [
          'Easy — 6 pairs, medium — 10, hard — 12, expert — 14.',
          'Higher difficulty means more cards and a bigger reward.',
        ] },
        { h: 'Game modes', lines: [
          'Classic — the regular game, no limits.',
          'Time attack (from level 2) — beat the timer; every pair adds seconds.',
          'Survival (from level 3) — one miss flips all found pairs back.',
          'No mistakes (from level 5) — memorize the preview; one mistake loses the game.',
        ] },
        { h: "What's in the game", lines: [
          'Collection — unlock sea themes, card backs and palettes for pearls.',
          'Daily reward — come back each day to claim pearls.',
          'Tasks — quests and achievements with rewards.',
          'Records — the leaderboard of best results.',
          'Store — pearl packs, bundles and exclusive items for real money.',
        ] },
        { h: 'Journey', lines: [
          'A map of island chapters, each with 12 levels and their own goals.',
          'Stars: 1 for winning plus a star per goal met (few moves, fast time, no mistakes) — up to 3 per level.',
          'Energy: starting a level costs 1 life (max 5); a life refills every 25 minutes, or top up with pearls.',
          'New islands unlock once you earn enough stars.',
        ] },
        { h: 'How to earn pearls', lines: [
          'A base reward for every win.',
          'Bonuses: a perfect game with no mistakes, a fast time and a new personal record.',
          'The first win of the day pays ×2.',
          'Repeated wins in a row pay less (anti-farming).',
          'Plus: daily streak, quests, achievements and doubling via an ad.',
        ] },
        { h: 'XP and level', lines: [
          'Every win grants experience (XP).',
          'Fill the XP bar to gain a level.',
          'Each new level rewards pearls.',
        ] },
      ],
    },
  },

  tr: {
    title:       'KART DÜETLERİ',
    description: 'Kart Düetleri — eğlenceli hafıza oyunu: kartları çevir, deniz canlılarının çiftlerini bul, dört modda oyna, yolculuk haritasını keşfet ve koleksiyon yap!',
    subtitle: 'Hafıza kartı oyunu',
    difficulty: 'ZORLUK',
    diffLabels: { easy: 'KOLAY', medium: 'ORTA', hard: 'ZOR', expert: 'UZMAN' },
    diffDesc:   {
      easy:   '6 çift · 12 kart',
      medium: '10 çift · 20 kart',
      hard:   '12 çift · 24 kart',
      expert: '14 çift · 28 kart',
    },
    diffHint:   {
      easy:   'Yeni başlayanlar için',
      medium: 'Klasik oyun',
      hard:   'Gerçek ustalar için',
      expert: 'Tüm 14 yaratık!',
    },
    modesTitle: 'OYUN MODU',
    modeRecommended: 'Önerilen',
    modeBeginner: 'Yeni başlayanlar', playCta: 'Oyna',
    modeLabels: { classic: 'KLASİK', timeAttack: 'ZAMANA KARŞI', survival: 'HAYATTA KALMA', noMistakes: 'HATASIZ' },
    modeDesc: {
      classic:    'Çiftleri kendi hızında bul — sınır yok.',
      timeAttack: 'Süre dolmadan yetiş! Bulduğun her çift saniye ekler.',
      survival:   'Bir hata — bulunan tüm çiftler kapanır. Hatasız tamamla!',
      noMistakes: 'Kartları gösterim sırasında ezberle. Tek hata — kaybedersin!',
    },
    modeLockedLv: (n) => `${n}. seviyede açılır`,
    taParams: (start, bonus) => `${start} sn, çift başına +${bonus}`,
    previewParams: (sec) => `${sec} sn gösterim`,
    memorize: 'Ezberle!',
    defeatTimeout: 'SÜRE DOLDU!',
    defeatMistake: 'HATA!',
    defeatPairs: (n, total) => `Bulunan çift: ${n} / ${total}`,
    sound:   'SES',
    soundOn: 'AÇIK',
    soundOff: 'KAPALI',
    play:    'OYUNA BAŞLA',
    journeyTitle: 'Yolculuk',
    journeySubtitle: 'BİR DÜNYA SEÇ',
    menu:    'MENÜ',
    moves:   (n) => `Hamle: ${n}`,
    pairs:   (n, total) => `Çift: ${n} / ${total}`,
    victory: 'ZAFER!',
    allPairsFound: 'Tüm çiftler bulundu!',
    vRecord: 'Yeni rekor!',
    vFirstWin: 'İlk galibiyet ×2',
    profile: 'Profil', level: 'Seviye', levelUpTitle: 'Yeni seviye!', levelUpCta: 'Devam', statGames: 'Oyunlar', statWins: 'Galibiyet', statPairs: 'Çiftler',
    movesResult: (n) => `Hamle: ${n}`,
    timeResult:  (t) => `Süre: ${t}`,
    restart: 'YENİDEN',
    toMenu:  'MENÜYE',
    movesLabel: 'HAMLE',
    timeLabel:  'SÜRE',
    leaderboard: 'REKORDLAR',
    loginToSave: 'Puanı kaydetmek için giriş yap',
    lbTitle:     'Liderlik Tablosu',
    lbLoading:   'Yükleniyor...',
    lbClose:     'KAPAT',
    lbPlayer: 'Oyuncu', lbEmpty: 'Henüz rekor yok',
    shop: 'Koleksiyon', shopBuy: 'SATIN AL', shopEquip: 'TAK', shopEquipped: 'TAKILI',
    shopTabSea: 'Deniz', shopTabBack: 'Kart Arkası', shopTabPalette: 'Palet', shopCollected: 'Toplandı', comingSoon: 'Yakında',
    shopItems: { seaLagoon:'Lagün', seaReef:'Resif', seaAbyss:'Uçurum', seaArctic:'Kutup', seaLava:'Lav',
      backClassic:'Klasik', backGold:'Altın', backCoral:'Mercan', backDeep:'Derinlik', backSilver:'Gümüş', backJade:'Yeşim', backOnyx:'Oniks',
      uiOcean:'Okyanus', uiSunset:'Gün Batımı', uiEmerald:'Zümrüt', uiAmethyst:'Ametist', uiCrimson:'Kızıl', uiSlate:'Arduvaz', uiSand:'Kum', uiAurora:'Aurora', backPrism:'Prizma', bundleFounder:'Kurucu Paketi', bundlePremium:'Premium Paket' },
    dailyTitle: 'Günlük ödül', dailyClaim: 'AL', dailyDouble: 'REKLAMLA İKİYE KATLA', dailyComeBack: 'Yarın tekrar gel!',
    storeTitle: 'Mağaza', iapBuy: 'Satın al', storePacks: 'İnci', storeBundles: 'Paketler',
    shopTabExclusive: 'Özel', bundleIncludes: 'İçindekiler:', bundleOwned: 'Alındı',
    levelWord: 'Seviye', goalComplete: 'Seviyeyi tamamla', goalMoves: '{n} hamlede', goalTime: '{n} sn içinde',
    refillFor: '{n} karşılığında doldur', levelCleared: 'Seviye geçildi!', levelFailed: 'Başarısız',
    skinUnlocked: 'Yeni görünüm açıldı!', continue: 'Devam',
    mapBack: 'Harita',
    biomeNames: { lagoon: 'KUMSAL KOYU', volcano: 'ATEŞ KRATERİ', reef: 'MERCAN RESİFİ', arctic: 'BUZLU KIYI', abyss: 'KRİSTAL MAĞARA' },
    levelHint: 'Sıra sende — bölüm {n}. İz yolu gösterir.',
    levelHintDone: 'Dünya tamamlandı!',
    tasks:'Görevler', tasksTabQuests:'Görevler', tasksTabAch:'Başarılar', taskClaim:'AL', taskClaimed:'ALINDI', taskReroll:'YENİLE',
    quests: { qWinGames:'3 oyun kazan', qMatchPairs:'20 çift eşleştir', qPlayGames:'5 oyun oyna', qWinHard:'Zorda kazan', qPerfectWin:'Kusursuz oyun', qFastWin:'Hızlı zafer', qWinMedium:'Ortada 2 kez kazan', qMatchPairsBig:'40 çift eşleştir' },
    achievements: { aFirstWin:'İlk zafer', aWin10:'10 zafer', aWin50:'50 zafer', aPairs100:'100 çift', aPairs500:'500 çift', aExpertWin:'Uzmanda kazan', aAllDifficulties:'Tüm zorluklar', aStreak7:'7 günlük seri', aCollector:'5 kozmetik sahibi', aRich:'Toplam 1000 inci', aPerfectionist:'10 kusursuz oyun', aSpeedrunner:'10 hızlı zafer', aWin25:'25 zafer', aPlay25:'25 oyun oyna', aPlay100:'100 oyun oyna', aPairs1000:'1000 çift', aHardMaster:'Zorda 10 zafer', aExpertMaster:'Uzmanda 10 zafer', aStreak30:'30 günlük seri', aCollector15:'15 kozmetik sahibi', aLevel5:'5. seviye', aLevel10:'10. seviye', aTaWin:"Zamana Karşı'da kazan", aTaWin10:"Zamana Karşı'da 10 zafer", aSurvWin:"Hayatta Kalma'da kazan", aSurvWin10:"Hayatta Kalma'da 10 zafer", aNmWin:'Hatasız modunda kazan', aNmWin10:'Hatasız modunda 10 zafer', aAllModes:'Her modda kazan', aWin100:'100 zafer', aPlay250:'250 oyun oyna', aPairs2500:'2500 çift', aPerfect25:'25 kusursuz oyun', aFast25:'25 hızlı zafer', aStreak14:'14 günlük seri', aRich5000:'Toplam 5000 inci', aCampFirst:'İlk yolculuk seviyesi', aCampChapter:'Bir yolculuk bölümünü tamamla', aCampLevels30:'30 yolculuk seviyesi', aCampStars50:'50 yolculuk yıldızı', aCampStars120:'120 yolculuk yıldızı', aCampAllChapters:'Tüm yolculuk bölümleri', aSeaAll:'Tüm deniz temaları', aBacksAll:'Tüm kart arkaları', aPalettesAll:'Tüm paletler' },
    help: {
      title: 'Nasıl oynanır',
      sections: [
        { h: 'Amaç', lines: [
          'Her turda iki kart çevir.',
          'Eşleşirlerse açık kalır; yoksa iki kart da kapanır.',
          'Kazanmak için tüm çiftleri aç. Daha az hamle ve daha hızlı süre daha iyi sonuç demektir.',
        ] },
        { h: 'Zorluklar', lines: [
          'Kolay — 6 çift, orta — 10, zor — 12, uzman — 14.',
          'Zorluk arttıkça kart sayısı ve ödül artar.',
        ] },
        { h: 'Oyun modları', lines: [
          'Klasik — sınırsız normal oyun.',
          'Zamana karşı (2. seviyeden) — süre dolmadan bitir; her çift saniye ekler.',
          'Hayatta kalma (3. seviyeden) — bir hata bulunan tüm çiftleri kapatır.',
          'Hatasız (5. seviyeden) — gösterimde kartları ezberle; tek hata kaybettirir.',
        ] },
        { h: 'Yolculuk', lines: [
          'Ada-bölümlerden oluşan bir harita; her birinde kendi hedefli 12 seviye.',
          'Yıldızlar: galibiyet için 1, her hedef için birer yıldız (az hamle, hızlı süre, hatasız) — seviye başına 3’e kadar.',
          'Enerji: bir seviyeyi başlatmak 1 can harcar (en fazla 5); bir can 25 dakikada dolar veya inciyle doldur.',
          'Yeterince yıldız topladıkça yeni adalar açılır.',
        ] },
        { h: 'Oyunda neler var', lines: [
          'Koleksiyon — inci ile deniz temaları, kart arkaları ve paletler aç.',
          'Günlük ödül — her gün gel ve inci al.',
          'Görevler — ödüllü görevler ve başarılar.',
          'Rekorlar — en iyi sonuçların listesi.',
          'Mağaza — inci paketleri, paketler ve özel öğeler (gerçek para).',
        ] },
        { h: 'İnci nasıl kazanılır', lines: [
          'Her galibiyet için temel ödül.',
          'Bonuslar: hatasız kusursuz oyun, hızlı süre ve yeni kişisel rekor.',
          'Günün ilk galibiyeti ×2 öder.',
          'Üst üste sık galibiyetler daha az öder (çiftlik koruması).',
          'Ayrıca: günlük seri, görevler, başarılar ve reklamla ikiye katlama.',
        ] },
        { h: 'Tecrübe ve seviye', lines: [
          'Her galibiyet tecrübe (XP) kazandırır.',
          'Seviye atlamak için XP çubuğunu doldur.',
          'Her yeni seviye inci ödülü verir.',
        ] },
      ],
    },
  },

  es: {
    title:       'DÚOS DE CARTAS',
    description: 'Dúos de Cartas — divertido juego de memoria: voltea cartas, empareja criaturas marinas, prueba cuatro modos, supera un mapa de aventura y colecciona.',
    subtitle: 'Juego de memoria con cartas',
    difficulty: 'DIFICULTAD',
    diffLabels: { easy: 'FÁCIL', medium: 'MEDIO', hard: 'DIFÍCIL', expert: 'EXPERTO' },
    diffDesc:   {
      easy:   '6 pares · 12 cartas',
      medium: '10 pares · 20 cartas',
      hard:   '12 pares · 24 cartas',
      expert: '14 pares · 28 cartas',
    },
    diffHint:   {
      easy:   'Perfecto para principiantes',
      medium: 'Juego clásico',
      hard:   'Para los verdaderos maestros',
      expert: '¡Las 14 criaturas!',
    },
    modesTitle: 'MODO DE JUEGO',
    modeRecommended: 'Recomendado',
    modeBeginner: 'Para principiantes', playCta: 'Jugar',
    modeLabels: { classic: 'CLÁSICO', timeAttack: 'CONTRARRELOJ', survival: 'SUPERVIVENCIA', noMistakes: 'SIN ERRORES' },
    modeDesc: {
      classic:    'Encuentra los pares a tu ritmo — sin límites.',
      timeAttack: '¡Gana al reloj! Cada par encontrado añade segundos.',
      survival:   'Un fallo y todos los pares encontrados se cierran. ¡Completa sin fallar!',
      noMistakes: 'Memoriza las cartas durante la vista previa. ¡Un error y pierdes!',
    },
    modeLockedLv: (n) => `Se abre en el nivel ${n}`,
    taParams: (start, bonus) => `${start} s, +${bonus} por par`,
    previewParams: (sec) => `vista previa ${sec} s`,
    memorize: '¡Memoriza!',
    defeatTimeout: '¡SE ACABÓ EL TIEMPO!',
    defeatMistake: '¡ERROR!',
    defeatPairs: (n, total) => `Pares encontrados: ${n} de ${total}`,
    sound:   'SONIDO',
    soundOn: 'ACTIVADO',
    soundOff: 'DESACTIVADO',
    play:    'INICIAR JUEGO',
    journeyTitle: 'Aventura',
    journeySubtitle: 'ELIGE UN MUNDO',
    menu:    'MENÚ',
    moves:   (n) => `Movimientos: ${n}`,
    pairs:   (n, total) => `Pares: ${n} / ${total}`,
    victory: '¡VICTORIA!',
    allPairsFound: '¡Todos los pares encontrados!',
    vRecord: '¡Nuevo récord!',
    vFirstWin: 'Primera victoria ×2',
    profile: 'Perfil', level: 'Nivel', levelUpTitle: '¡Nuevo nivel!', levelUpCta: 'Continuar', statGames: 'Partidas', statWins: 'Victorias', statPairs: 'Pares',
    movesResult: (n) => `Movimientos: ${n}`,
    timeResult:  (t) => `Tiempo: ${t}`,
    restart: 'REINICIAR',
    toMenu:  'AL MENÚ',
    movesLabel: 'JUGADAS',
    timeLabel:  'TIEMPO',
    leaderboard: 'RÉCORDS',
    loginToSave: 'Inicia sesión para guardar',
    lbTitle:     'Tabla de líderes',
    lbLoading:   'Cargando...',
    lbClose:     'CERRAR',
    lbPlayer: 'Jugador', lbEmpty: 'Aún no hay récords',
    shop: 'Colección', shopBuy: 'COMPRAR', shopEquip: 'EQUIPAR', shopEquipped: 'EQUIPADO',
    shopTabSea: 'Mar', shopTabBack: 'Reverso', shopTabPalette: 'Paleta', shopCollected: 'Coleccionados', comingSoon: 'Próximamente',
    shopItems: { seaLagoon:'Laguna', seaReef:'Arrecife', seaAbyss:'Abismo', seaArctic:'Ártico', seaLava:'Lava',
      backClassic:'Clásico', backGold:'Oro', backCoral:'Coral', backDeep:'Profundo', backSilver:'Plata', backJade:'Jade', backOnyx:'Ónix',
      uiOcean:'Océano', uiSunset:'Atardecer', uiEmerald:'Esmeralda', uiAmethyst:'Amatista', uiCrimson:'Carmesí', uiSlate:'Pizarra', uiSand:'Arena', uiAurora:'Aurora', backPrism:'Prisma', bundleFounder:'Pack de fundador', bundlePremium:'Pack premium' },
    dailyTitle: 'Recompensa diaria', dailyClaim: 'RECLAMAR', dailyDouble: 'DUPLICAR CON ANUNCIO', dailyComeBack: '¡Vuelve mañana!',
    storeTitle: 'Tienda', iapBuy: 'Comprar', storePacks: 'Perlas', storeBundles: 'Packs',
    shopTabExclusive: 'Exclusivo', bundleIncludes: 'Incluye:', bundleOwned: 'Obtenido',
    levelWord: 'Nivel', goalComplete: 'Completa el nivel', goalMoves: 'En {n} movimientos', goalTime: 'En {n}s',
    refillFor: 'Rellenar por {n}', levelCleared: '¡Nivel superado!', levelFailed: 'Nivel fallido',
    skinUnlocked: '¡Nuevo aspecto desbloqueado!', continue: 'Continuar',
    mapBack: 'Mapa',
    biomeNames: { lagoon: 'BAHÍA DE ARENA', volcano: 'CRÁTER DE FUEGO', reef: 'ARRECIFE DE CORAL', arctic: 'COSTA HELADA', abyss: 'GRUTA DE CRISTAL' },
    levelHint: 'Tu turno — nivel {n}. El sendero muestra el camino.',
    levelHintDone: '¡Mundo completado!',
    tasks:'Tareas', tasksTabQuests:'Misiones', tasksTabAch:'Logros', taskClaim:'RECLAMAR', taskClaimed:'OBTENIDO', taskReroll:'CAMBIAR',
    quests: { qWinGames:'Gana 3 partidas', qMatchPairs:'Empareja 20 pares', qPlayGames:'Juega 5 partidas', qWinHard:'Gana en difícil', qPerfectWin:'Partida perfecta', qFastWin:'Victoria rápida', qWinMedium:'Gana 2 en medio', qMatchPairsBig:'Empareja 40 pares' },
    achievements: { aFirstWin:'Primera victoria', aWin10:'10 victorias', aWin50:'50 victorias', aPairs100:'100 pares', aPairs500:'500 pares', aExpertWin:'Gana en experto', aAllDifficulties:'Todas las dificultades', aStreak7:'Racha de 7 días', aCollector:'5 cosméticos', aRich:'1000 perlas en total', aPerfectionist:'10 partidas perfectas', aSpeedrunner:'10 victorias rápidas', aWin25:'25 victorias', aPlay25:'Juega 25 partidas', aPlay100:'Juega 100 partidas', aPairs1000:'1000 pares', aHardMaster:'10 victorias en difícil', aExpertMaster:'10 victorias en experto', aStreak30:'Racha de 30 días', aCollector15:'15 cosméticos', aLevel5:'Nivel 5', aLevel10:'Nivel 10', aTaWin:'Gana en Contrarreloj', aTaWin10:'10 victorias en Contrarreloj', aSurvWin:'Gana en Supervivencia', aSurvWin10:'10 victorias en Supervivencia', aNmWin:'Gana en Sin Errores', aNmWin10:'10 victorias en Sin Errores', aAllModes:'Gana en todos los modos', aWin100:'100 victorias', aPlay250:'Juega 250 partidas', aPairs2500:'2500 pares', aPerfect25:'25 partidas perfectas', aFast25:'25 victorias rápidas', aStreak14:'Racha de 14 días', aRich5000:'5000 perlas en total', aCampFirst:'Primer nivel del viaje', aCampChapter:'Completa un capítulo del viaje', aCampLevels30:'30 niveles del viaje', aCampStars50:'50 estrellas del viaje', aCampStars120:'120 estrellas del viaje', aCampAllChapters:'Todos los capítulos del viaje', aSeaAll:'Todos los temas de mar', aBacksAll:'Todos los reversos', aPalettesAll:'Todas las paletas' },
    help: {
      title: 'Cómo jugar',
      sections: [
        { h: 'Objetivo', lines: [
          'Voltea dos cartas por turno.',
          'Si coinciden, quedan descubiertas; si no, ambas se voltean de nuevo.',
          'Descubre todas las parejas para ganar. Menos movimientos y menos tiempo dan mejor resultado.',
        ] },
        { h: 'Dificultades', lines: [
          'Fácil — 6 pares, medio — 10, difícil — 12, experto — 14.',
          'A mayor dificultad, más cartas y mayor recompensa.',
        ] },
        { h: 'Modos de juego', lines: [
          'Clásico — el juego normal, sin límites.',
          'Contrarreloj (desde nivel 2) — gana al temporizador; cada par añade segundos.',
          'Supervivencia (desde nivel 3) — un fallo cierra todos los pares encontrados.',
          'Sin errores (desde nivel 5) — memoriza la vista previa; un error pierde la partida.',
        ] },
        { h: 'Aventura', lines: [
          'Un mapa de islas-capítulos, cada una con 12 niveles y sus propios objetivos.',
          'Estrellas: 1 por ganar y una estrella por cada objetivo (pocos movimientos, tiempo rápido, sin errores) — hasta 3 por nivel.',
          'Energía: iniciar un nivel cuesta 1 vida (máx. 5); una vida se recupera cada 25 minutos o recárgala con perlas.',
          'Se desbloquean nuevas islas cuando consigues suficientes estrellas.',
        ] },
        { h: 'Qué hay en el juego', lines: [
          'Colección — desbloquea mares, reversos y paletas con perlas.',
          'Recompensa diaria — vuelve cada día para reclamar perlas.',
          'Tareas — misiones y logros con recompensas.',
          'Récords — la tabla de los mejores resultados.',
          'Tienda — packs de perlas, lotes y objetos exclusivos por dinero real.',
        ] },
        { h: 'Cómo ganar perlas', lines: [
          'Una recompensa base por cada victoria.',
          'Bonos: partida perfecta sin errores, tiempo rápido y nuevo récord personal.',
          'La primera victoria del día paga ×2.',
          'Las victorias seguidas pagan menos (anti-farmeo).',
          'Además: racha diaria, misiones, logros y duplicar con un anuncio.',
        ] },
        { h: 'Experiencia y nivel', lines: [
          'Cada victoria otorga experiencia (XP).',
          'Llena la barra de XP para subir de nivel.',
          'Cada nivel nuevo recompensa con perlas.',
        ] },
      ],
    },
  },

  pt: {
    title:       'DUPLAS DE CARTAS',
    description: 'Duplas de Cartas — divertido jogo de memória: vire cartas, combine pares de criaturas marinhas, jogue em quatro modos, explore o mapa e colecione.',
    subtitle: 'Jogo de memória com cartas',
    difficulty: 'DIFICULDADE',
    diffLabels: { easy: 'FÁCIL', medium: 'MÉDIO', hard: 'DIFÍCIL', expert: 'ESPECIALISTA' },
    diffDesc:   {
      easy:   '6 pares · 12 cartas',
      medium: '10 pares · 20 cartas',
      hard:   '12 pares · 24 cartas',
      expert: '14 pares · 28 cartas',
    },
    diffHint:   {
      easy:   'Perfeito para iniciantes',
      medium: 'Jogo clássico',
      hard:   'Para os verdadeiros mestres',
      expert: 'Todas as 14 criaturas!',
    },
    modesTitle: 'MODO DE JOGO',
    modeRecommended: 'Recomendado',
    modeBeginner: 'Para iniciantes', playCta: 'Jogar',
    modeLabels: { classic: 'CLÁSSICO', timeAttack: 'CONTRA O TEMPO', survival: 'SOBREVIVÊNCIA', noMistakes: 'SEM ERROS' },
    modeDesc: {
      classic:    'Encontre os pares no seu ritmo — sem limites.',
      timeAttack: 'Vença o relógio! Cada par encontrado adiciona segundos.',
      survival:   'Um erro e todos os pares encontrados se fecham. Complete sem falhar!',
      noMistakes: 'Memorize as cartas durante a prévia. Um erro e você perde!',
    },
    modeLockedLv: (n) => `Abre no nível ${n}`,
    taParams: (start, bonus) => `${start} s, +${bonus} por par`,
    previewParams: (sec) => `prévia de ${sec} s`,
    memorize: 'Memorize!',
    defeatTimeout: 'O TEMPO ACABOU!',
    defeatMistake: 'ERRO!',
    defeatPairs: (n, total) => `Pares encontrados: ${n} de ${total}`,
    sound:   'SOM',
    soundOn: 'LIGADO',
    soundOff: 'DESLIGADO',
    play:    'INICIAR JOGO',
    journeyTitle: 'Aventura',
    journeySubtitle: 'ESCOLHA UM MUNDO',
    menu:    'MENU',
    moves:   (n) => `Jogadas: ${n}`,
    pairs:   (n, total) => `Pares: ${n} / ${total}`,
    victory: 'VITÓRIA!',
    allPairsFound: 'Todos os pares encontrados!',
    vRecord: 'Novo recorde!',
    vFirstWin: 'Primeira vitória ×2',
    profile: 'Perfil', level: 'Nível', levelUpTitle: 'Novo nível!', levelUpCta: 'Continuar', statGames: 'Jogos', statWins: 'Vitórias', statPairs: 'Pares',
    movesResult: (n) => `Jogadas: ${n}`,
    timeResult:  (t) => `Tempo: ${t}`,
    restart: 'REINICIAR',
    toMenu:  'AO MENU',
    movesLabel: 'JOGADAS',
    timeLabel:  'TEMPO',
    leaderboard: 'RECORDES',
    loginToSave: 'Entrar para salvar pontuação',
    lbTitle:     'Placar',
    lbLoading:   'Carregando...',
    lbClose:     'FECHAR',
    lbPlayer: 'Jogador', lbEmpty: 'Ainda não há recordes',
    shop: 'Coleção', shopBuy: 'COMPRAR', shopEquip: 'EQUIPAR', shopEquipped: 'EQUIPADO',
    shopTabSea: 'Mar', shopTabBack: 'Verso', shopTabPalette: 'Paleta', shopCollected: 'Coletados', comingSoon: 'Em breve',
    shopItems: { seaLagoon:'Lagoa', seaReef:'Recife', seaAbyss:'Abismo', seaArctic:'Ártico', seaLava:'Lava',
      backClassic:'Clássico', backGold:'Ouro', backCoral:'Coral', backDeep:'Profundo', backSilver:'Prata', backJade:'Jade', backOnyx:'Ônix',
      uiOcean:'Oceano', uiSunset:'Pôr do Sol', uiEmerald:'Esmeralda', uiAmethyst:'Ametista', uiCrimson:'Carmesim', uiSlate:'Ardósia', uiSand:'Areia', uiAurora:'Aurora', backPrism:'Prisma', bundleFounder:'Pacote do fundador', bundlePremium:'Pacote premium' },
    dailyTitle: 'Recompensa diária', dailyClaim: 'RESGATAR', dailyDouble: 'DOBRAR COM ANÚNCIO', dailyComeBack: 'Volte amanhã!',
    storeTitle: 'Loja', iapBuy: 'Comprar', storePacks: 'Pérolas', storeBundles: 'Pacotes',
    shopTabExclusive: 'Exclusivo', bundleIncludes: 'Inclui:', bundleOwned: 'Obtido',
    levelWord: 'Nível', goalComplete: 'Complete o nível', goalMoves: 'Em {n} jogadas', goalTime: 'Em {n}s',
    refillFor: 'Recarregar por {n}', levelCleared: 'Nível concluído!', levelFailed: 'Nível falhou',
    skinUnlocked: 'Novo visual desbloqueado!', continue: 'Continuar',
    mapBack: 'Mapa',
    biomeNames: { lagoon: 'BAÍA DE AREIA', volcano: 'CRATERA DE FOGO', reef: 'RECIFE DE CORAL', arctic: 'COSTA GELADA', abyss: 'GRUTA DE CRISTAL' },
    levelHint: 'Sua vez — nível {n}. A trilha mostra o caminho.',
    levelHintDone: 'Mundo concluído!',
    tasks:'Tarefas', tasksTabQuests:'Missões', tasksTabAch:'Conquistas', taskClaim:'RESGATAR', taskClaimed:'RESGATADO', taskReroll:'TROCAR',
    quests: { qWinGames:'Vença 3 jogos', qMatchPairs:'Combine 20 pares', qPlayGames:'Jogue 5 jogos', qWinHard:'Vença no difícil', qPerfectWin:'Jogo perfeito', qFastWin:'Vitória rápida', qWinMedium:'Vença 2 no médio', qMatchPairsBig:'Combine 40 pares' },
    achievements: { aFirstWin:'Primeira vitória', aWin10:'10 vitórias', aWin50:'50 vitórias', aPairs100:'100 pares', aPairs500:'500 pares', aExpertWin:'Vença no especialista', aAllDifficulties:'Todas as dificuldades', aStreak7:'Sequência de 7 dias', aCollector:'5 cosméticos', aRich:'1000 pérolas no total', aPerfectionist:'10 jogos perfeitos', aSpeedrunner:'10 vitórias rápidas', aWin25:'25 vitórias', aPlay25:'Jogue 25 jogos', aPlay100:'Jogue 100 jogos', aPairs1000:'1000 pares', aHardMaster:'10 vitórias no difícil', aExpertMaster:'10 vitórias no especialista', aStreak30:'Sequência de 30 dias', aCollector15:'15 cosméticos', aLevel5:'Nível 5', aLevel10:'Nível 10', aTaWin:'Vença em Contra o Tempo', aTaWin10:'10 vitórias em Contra o Tempo', aSurvWin:'Vença em Sobrevivência', aSurvWin10:'10 vitórias em Sobrevivência', aNmWin:'Vença em Sem Erros', aNmWin10:'10 vitórias em Sem Erros', aAllModes:'Vença em todos os modos', aWin100:'100 vitórias', aPlay250:'Jogue 250 jogos', aPairs2500:'2500 pares', aPerfect25:'25 jogos perfeitos', aFast25:'25 vitórias rápidas', aStreak14:'Sequência de 14 dias', aRich5000:'5000 pérolas no total', aCampFirst:'Primeiro nível da jornada', aCampChapter:'Complete um capítulo da jornada', aCampLevels30:'30 níveis da jornada', aCampStars50:'50 estrelas da jornada', aCampStars120:'120 estrelas da jornada', aCampAllChapters:'Todos os capítulos da jornada', aSeaAll:'Todos os temas de mar', aBacksAll:'Todos os versos', aPalettesAll:'Todas as paletas' },
    help: {
      title: 'Como jogar',
      sections: [
        { h: 'Objetivo', lines: [
          'Vire duas cartas por vez.',
          'Se forem iguais, ficam viradas; senão, as duas voltam.',
          'Encontre todos os pares para vencer. Menos jogadas e menos tempo dão um resultado melhor.',
        ] },
        { h: 'Dificuldades', lines: [
          'Fácil — 6 pares, médio — 10, difícil — 12, especialista — 14.',
          'Quanto maior a dificuldade, mais cartas e maior recompensa.',
        ] },
        { h: 'Modos de jogo', lines: [
          'Clássico — o jogo normal, sem limites.',
          'Contra o tempo (do nível 2) — vença o cronômetro; cada par adiciona segundos.',
          'Sobrevivência (do nível 3) — um erro fecha todos os pares encontrados.',
          'Sem erros (do nível 5) — memorize a prévia; um erro perde o jogo.',
        ] },
        { h: 'Aventura', lines: [
          'Um mapa de ilhas-capítulos, cada uma com 12 níveis e objetivos próprios.',
          'Estrelas: 1 por vencer e uma estrela por objetivo (poucos movimentos, tempo rápido, sem erros) — até 3 por nível.',
          'Energia: iniciar um nível custa 1 vida (máx. 5); uma vida recupera a cada 25 minutos, ou reabasteça com pérolas.',
          'Novas ilhas são desbloqueadas quando você ganha estrelas suficientes.',
        ] },
        { h: 'O que há no jogo', lines: [
          'Coleção — desbloqueie mares, versos e paletas com pérolas.',
          'Recompensa diária — volte todos os dias para resgatar pérolas.',
          'Tarefas — missões e conquistas com recompensas.',
          'Recordes — a tabela dos melhores resultados.',
          'Loja — pacotes de pérolas, lotes e itens exclusivos por dinheiro real.',
        ] },
        { h: 'Como ganhar pérolas', lines: [
          'Uma recompensa base por cada vitória.',
          'Bônus: jogo perfeito sem erros, tempo rápido e novo recorde pessoal.',
          'A primeira vitória do dia paga ×2.',
          'Vitórias seguidas pagam menos (anti-farm).',
          'Além disso: sequência diária, missões, conquistas e dobrar com um anúncio.',
        ] },
        { h: 'Experiência e nível', lines: [
          'Cada vitória concede experiência (XP).',
          'Preencha a barra de XP para subir de nível.',
          'Cada novo nível recompensa com pérolas.',
        ] },
      ],
    },
  },
};