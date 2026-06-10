export type Lang = 'ru' | 'en' | 'tr' | 'es' | 'pt' | 'ar';

export interface Locale {
  title: string;
  description: string;
  subtitle: string;
  difficulty: string;
  diffLabels: Record<'easy' | 'medium' | 'hard' | 'expert', string>;
  diffDesc:   Record<'easy' | 'medium' | 'hard' | 'expert', string>;
  diffHint:   Record<'easy' | 'medium' | 'hard' | 'expert', string>;
  sound: string;
  soundOn: string;
  soundOff: string;
  play: string;
  menu: string;
  moves: (n: number) => string;
  pairs: (n: number, total: number) => string;
  victory: string;
  allPairsFound: string;
  vRecord: string;        // victory "new record" banner
  vFirstWin: string;      // victory "first win of the day ×2" chip
  profile: string;        // profile modal title + button
  level: string;          // "Level" label
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
  topupTitle: string;   // "Get pearls" modal title
  iapBuy: string;       // generic money-buy button label (fallback when SDK price is unknown)
}

export const LOCALES: Record<Lang, Locale> = {
  ru: {
    title:       'МОРСКИЕ ПАРЫ',
    description: 'Морские пары — весёлая игра на память для детей от 6 лет. Переворачивай карточки, находи совпадения и тренируй внимание вместе с морскими обитателями!',
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
    sound:   'ЗВУК',
    soundOn: 'ВКЛЮЧЁН',
    soundOff: 'ВЫКЛЮЧЕН',
    play:    'НАЧАТЬ ИГРУ',
    menu:    'МЕНЮ',
    moves:   (n) => `Ходов: ${n}`,
    pairs:   (n, total) => `Пар: ${n} / ${total}`,
    victory: 'ПОБЕДА!',
    allPairsFound: 'Все пары найдены!',
    vRecord: 'Новый рекорд!',
    vFirstWin: 'Первая победа ×2',
    profile: 'Профиль', level: 'Уровень', statGames: 'Игры', statWins: 'Победы', statPairs: 'Пары',
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
    shop: 'Коллекция', shopBuy: 'Купить', shopEquip: 'Надеть', shopEquipped: 'Надето',
    shopTabSea: 'Море', shopTabBack: 'Рубашка', shopTabPalette: 'Палитра', shopCollected: 'Собрано',
    shopItems: { seaLagoon:'Лагуна', seaReef:'Риф', seaAbyss:'Бездна', seaArctic:'Арктика', seaTropic:'Тропики', seaDusk:'Сумерки', seaEmber:'Жар',
      backClassic:'Классика', backGold:'Золото', backCoral:'Коралл', backDeep:'Глубина', backSilver:'Серебро', backJade:'Нефрит', backOnyx:'Оникс',
      uiOcean:'Океан', uiSunset:'Закат', uiEmerald:'Изумруд', uiAmethyst:'Аметист', uiCrimson:'Багрянец', uiSlate:'Графит', uiSand:'Песок' },
    dailyTitle: 'Ежедневная награда', dailyClaim: 'Забрать', dailyDouble: 'Удвоить за рекламу', dailyComeBack: 'Возвращайтесь завтра!',
    topupTitle: 'Пополнить жемчуг', iapBuy: 'Купить',
    tasks:'Задания', tasksTabQuests:'Квесты', tasksTabAch:'Достижения', taskClaim:'Забрать', taskClaimed:'Получено', taskReroll:'Обновить',
    quests: { qWinGames:'Выиграй 3 игры', qMatchPairs:'Собери 20 пар', qPlayGames:'Сыграй 5 игр', qWinHard:'Победа на сложном', qPerfectWin:'Идеальная игра', qFastWin:'Быстрая победа', qWinMedium:'2 победы на среднем', qMatchPairsBig:'Собери 40 пар' },
    achievements: { aFirstWin:'Первая победа', aWin10:'10 побед', aWin50:'50 побед', aPairs100:'100 пар', aPairs500:'500 пар', aExpertWin:'Победа на эксперте', aAllDifficulties:'Все сложности', aStreak7:'Стрик 7 дней', aCollector:'5 предметов в коллекции', aRich:'1000 жемчуга всего', aPerfectionist:'10 идеальных игр', aSpeedrunner:'10 быстрых побед', aWin25:'25 побед', aPlay25:'Сыграй 25 игр', aPlay100:'Сыграй 100 игр', aPairs1000:'1000 пар', aHardMaster:'10 побед на сложном', aExpertMaster:'10 побед на эксперте', aStreak30:'Стрик 30 дней', aCollector15:'15 предметов в коллекции', aLevel5:'Уровень 5', aLevel10:'Уровень 10' },
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
        { h: 'Что есть в игре', lines: [
          'Коллекция — открывай оформление моря, рубашки и палитры за жемчуг.',
          'Ежедневная награда — заходи каждый день и забирай жемчуг.',
          'Задания — квесты и достижения с наградами.',
          'Рекорды — таблица лучших результатов.',
        ] },
        { h: 'Как заработать жемчуг 🦪', lines: [
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
    title:       'SEA PAIRS',
    description: 'Sea Pairs — a fun memory game for kids 6+. Flip cards, find matches, and train your focus with sea creatures!',
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
    sound:   'SOUND',
    soundOn: 'ON',
    soundOff: 'OFF',
    play:    'START GAME',
    menu:    'MENU',
    moves:   (n) => `Moves: ${n}`,
    pairs:   (n, total) => `Pairs: ${n} / ${total}`,
    victory: 'VICTORY!',
    allPairsFound: 'All pairs found!',
    vRecord: 'New record!',
    vFirstWin: 'First win ×2',
    profile: 'Profile', level: 'Level', statGames: 'Games', statWins: 'Wins', statPairs: 'Pairs',
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
    shopTabSea: 'Sea', shopTabBack: 'Card back', shopTabPalette: 'Palette', shopCollected: 'Collected',
    shopItems: { seaLagoon:'Lagoon', seaReef:'Reef', seaAbyss:'Abyss', seaArctic:'Arctic', seaTropic:'Tropics', seaDusk:'Dusk', seaEmber:'Ember',
      backClassic:'Classic', backGold:'Gold', backCoral:'Coral', backDeep:'Deep', backSilver:'Silver', backJade:'Jade', backOnyx:'Onyx',
      uiOcean:'Ocean', uiSunset:'Sunset', uiEmerald:'Emerald', uiAmethyst:'Amethyst', uiCrimson:'Crimson', uiSlate:'Slate', uiSand:'Sand' },
    dailyTitle: 'Daily reward', dailyClaim: 'Claim', dailyDouble: 'Double via ad', dailyComeBack: 'Come back tomorrow!',
    topupTitle: 'Get pearls', iapBuy: 'Buy',
    tasks:'Tasks', tasksTabQuests:'Quests', tasksTabAch:'Achievements', taskClaim:'Claim', taskClaimed:'Claimed', taskReroll:'Reroll',
    quests: { qWinGames:'Win 3 games', qMatchPairs:'Match 20 pairs', qPlayGames:'Play 5 games', qWinHard:'Win on hard', qPerfectWin:'A perfect game', qFastWin:'A fast win', qWinMedium:'Win 2 on medium', qMatchPairsBig:'Match 40 pairs' },
    achievements: { aFirstWin:'First win', aWin10:'10 wins', aWin50:'50 wins', aPairs100:'100 pairs', aPairs500:'500 pairs', aExpertWin:'Win on expert', aAllDifficulties:'All difficulties', aStreak7:'7-day streak', aCollector:'5 cosmetics owned', aRich:'1000 pearls earned', aPerfectionist:'10 perfect games', aSpeedrunner:'10 fast wins', aWin25:'25 wins', aPlay25:'Play 25 games', aPlay100:'Play 100 games', aPairs1000:'1000 pairs', aHardMaster:'10 wins on hard', aExpertMaster:'10 wins on expert', aStreak30:'30-day streak', aCollector15:'15 cosmetics owned', aLevel5:'Level 5', aLevel10:'Level 10' },
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
        { h: "What's in the game", lines: [
          'Collection — unlock sea themes, card backs and palettes for pearls.',
          'Daily reward — come back each day to claim pearls.',
          'Tasks — quests and achievements with rewards.',
          'Records — the leaderboard of best results.',
        ] },
        { h: 'How to earn pearls 🦪', lines: [
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
    title:       'DENİZ ÇİFTLERİ',
    description: 'Deniz Çiftleri — 6 yaş ve üzeri çocuklar için eğlenceli bir hafıza oyunu. Kartları çevir, eşleşmeleri bul ve deniz canlılarıyla dikkatini geliştir!',
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
    sound:   'SES',
    soundOn: 'AÇIK',
    soundOff: 'KAPALI',
    play:    'OYUNA BAŞLA',
    menu:    'MENÜ',
    moves:   (n) => `Hamle: ${n}`,
    pairs:   (n, total) => `Çift: ${n} / ${total}`,
    victory: 'ZAFER!',
    allPairsFound: 'Tüm çiftler bulundu!',
    vRecord: 'Yeni rekor!',
    vFirstWin: 'İlk galibiyet ×2',
    profile: 'Profil', level: 'Seviye', statGames: 'Oyunlar', statWins: 'Galibiyet', statPairs: 'Çiftler',
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
    shopTabSea: 'Deniz', shopTabBack: 'Kart Arkası', shopTabPalette: 'Palet', shopCollected: 'Toplandı',
    shopItems: { seaLagoon:'Lagün', seaReef:'Resif', seaAbyss:'Uçurum', seaArctic:'Kutup', seaTropic:'Tropikler', seaDusk:'Alacakaranlık', seaEmber:'Kor',
      backClassic:'Klasik', backGold:'Altın', backCoral:'Mercan', backDeep:'Derinlik', backSilver:'Gümüş', backJade:'Yeşim', backOnyx:'Oniks',
      uiOcean:'Okyanus', uiSunset:'Gün Batımı', uiEmerald:'Zümrüt', uiAmethyst:'Ametist', uiCrimson:'Kızıl', uiSlate:'Arduvaz', uiSand:'Kum' },
    dailyTitle: 'Günlük ödül', dailyClaim: 'AL', dailyDouble: 'REKLAMLA İKİYE KATLA', dailyComeBack: 'Yarın tekrar gel!',
    topupTitle: 'İnci al', iapBuy: 'Satın al',
    tasks:'Görevler', tasksTabQuests:'Görevler', tasksTabAch:'Başarılar', taskClaim:'AL', taskClaimed:'ALINDI', taskReroll:'YENİLE',
    quests: { qWinGames:'3 oyun kazan', qMatchPairs:'20 çift eşleştir', qPlayGames:'5 oyun oyna', qWinHard:'Zorda kazan', qPerfectWin:'Kusursuz oyun', qFastWin:'Hızlı zafer', qWinMedium:'Ortada 2 kez kazan', qMatchPairsBig:'40 çift eşleştir' },
    achievements: { aFirstWin:'İlk zafer', aWin10:'10 zafer', aWin50:'50 zafer', aPairs100:'100 çift', aPairs500:'500 çift', aExpertWin:'Uzmanda kazan', aAllDifficulties:'Tüm zorluklar', aStreak7:'7 günlük seri', aCollector:'5 kozmetik sahibi', aRich:'Toplam 1000 inci', aPerfectionist:'10 kusursuz oyun', aSpeedrunner:'10 hızlı zafer', aWin25:'25 zafer', aPlay25:'25 oyun oyna', aPlay100:'100 oyun oyna', aPairs1000:'1000 çift', aHardMaster:'Zorda 10 zafer', aExpertMaster:'Uzmanda 10 zafer', aStreak30:'30 günlük seri', aCollector15:'15 kozmetik sahibi', aLevel5:'5. seviye', aLevel10:'10. seviye' },
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
        { h: 'Oyunda neler var', lines: [
          'Koleksiyon — inci ile deniz temaları, kart arkaları ve paletler aç.',
          'Günlük ödül — her gün gel ve inci al.',
          'Görevler — ödüllü görevler ve başarılar.',
          'Rekorlar — en iyi sonuçların listesi.',
        ] },
        { h: 'İnci nasıl kazanılır 🦪', lines: [
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
    title:       'PARES MARINOS',
    description: '¡Pares Marinos — un divertido juego de memoria para niños desde 6 años. Voltea las cartas, encuentra las parejas y entrena la atención con los habitantes del mar!',
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
    sound:   'SONIDO',
    soundOn: 'ACTIVADO',
    soundOff: 'DESACTIVADO',
    play:    'INICIAR JUEGO',
    menu:    'MENÚ',
    moves:   (n) => `Movimientos: ${n}`,
    pairs:   (n, total) => `Pares: ${n} / ${total}`,
    victory: '¡VICTORIA!',
    allPairsFound: '¡Todos los pares encontrados!',
    vRecord: '¡Nuevo récord!',
    vFirstWin: 'Primera victoria ×2',
    profile: 'Perfil', level: 'Nivel', statGames: 'Partidas', statWins: 'Victorias', statPairs: 'Pares',
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
    shopTabSea: 'Mar', shopTabBack: 'Reverso', shopTabPalette: 'Paleta', shopCollected: 'Coleccionados',
    shopItems: { seaLagoon:'Laguna', seaReef:'Arrecife', seaAbyss:'Abismo', seaArctic:'Ártico', seaTropic:'Trópicos', seaDusk:'Crepúsculo', seaEmber:'Brasa',
      backClassic:'Clásico', backGold:'Oro', backCoral:'Coral', backDeep:'Profundo', backSilver:'Plata', backJade:'Jade', backOnyx:'Ónix',
      uiOcean:'Océano', uiSunset:'Atardecer', uiEmerald:'Esmeralda', uiAmethyst:'Amatista', uiCrimson:'Carmesí', uiSlate:'Pizarra', uiSand:'Arena' },
    dailyTitle: 'Recompensa diaria', dailyClaim: 'RECLAMAR', dailyDouble: 'DUPLICAR CON ANUNCIO', dailyComeBack: '¡Vuelve mañana!',
    topupTitle: 'Conseguir perlas', iapBuy: 'Comprar',
    tasks:'Tareas', tasksTabQuests:'Misiones', tasksTabAch:'Logros', taskClaim:'RECLAMAR', taskClaimed:'OBTENIDO', taskReroll:'CAMBIAR',
    quests: { qWinGames:'Gana 3 partidas', qMatchPairs:'Empareja 20 pares', qPlayGames:'Juega 5 partidas', qWinHard:'Gana en difícil', qPerfectWin:'Partida perfecta', qFastWin:'Victoria rápida', qWinMedium:'Gana 2 en medio', qMatchPairsBig:'Empareja 40 pares' },
    achievements: { aFirstWin:'Primera victoria', aWin10:'10 victorias', aWin50:'50 victorias', aPairs100:'100 pares', aPairs500:'500 pares', aExpertWin:'Gana en experto', aAllDifficulties:'Todas las dificultades', aStreak7:'Racha de 7 días', aCollector:'5 cosméticos', aRich:'1000 perlas en total', aPerfectionist:'10 partidas perfectas', aSpeedrunner:'10 victorias rápidas', aWin25:'25 victorias', aPlay25:'Juega 25 partidas', aPlay100:'Juega 100 partidas', aPairs1000:'1000 pares', aHardMaster:'10 victorias en difícil', aExpertMaster:'10 victorias en experto', aStreak30:'Racha de 30 días', aCollector15:'15 cosméticos', aLevel5:'Nivel 5', aLevel10:'Nivel 10' },
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
        { h: 'Qué hay en el juego', lines: [
          'Colección — desbloquea mares, reversos y paletas con perlas.',
          'Recompensa diaria — vuelve cada día para reclamar perlas.',
          'Tareas — misiones y logros con recompensas.',
          'Récords — la tabla de los mejores resultados.',
        ] },
        { h: 'Cómo ganar perlas 🦪', lines: [
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
    title:       'PARES DO MAR',
    description: 'Pares do Mar — um divertido jogo de memória para crianças a partir de 6 anos. Vire as cartas, encontre os pares e treine a atenção com os habitantes do mar!',
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
    sound:   'SOM',
    soundOn: 'LIGADO',
    soundOff: 'DESLIGADO',
    play:    'INICIAR JOGO',
    menu:    'MENU',
    moves:   (n) => `Jogadas: ${n}`,
    pairs:   (n, total) => `Pares: ${n} / ${total}`,
    victory: 'VITÓRIA!',
    allPairsFound: 'Todos os pares encontrados!',
    vRecord: 'Novo recorde!',
    vFirstWin: 'Primeira vitória ×2',
    profile: 'Perfil', level: 'Nível', statGames: 'Jogos', statWins: 'Vitórias', statPairs: 'Pares',
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
    shopTabSea: 'Mar', shopTabBack: 'Verso', shopTabPalette: 'Paleta', shopCollected: 'Coletados',
    shopItems: { seaLagoon:'Lagoa', seaReef:'Recife', seaAbyss:'Abismo', seaArctic:'Ártico', seaTropic:'Trópicos', seaDusk:'Crepúsculo', seaEmber:'Brasa',
      backClassic:'Clássico', backGold:'Ouro', backCoral:'Coral', backDeep:'Profundo', backSilver:'Prata', backJade:'Jade', backOnyx:'Ônix',
      uiOcean:'Oceano', uiSunset:'Pôr do Sol', uiEmerald:'Esmeralda', uiAmethyst:'Ametista', uiCrimson:'Carmesim', uiSlate:'Ardósia', uiSand:'Areia' },
    dailyTitle: 'Recompensa diária', dailyClaim: 'RESGATAR', dailyDouble: 'DOBRAR COM ANÚNCIO', dailyComeBack: 'Volte amanhã!',
    topupTitle: 'Obter pérolas', iapBuy: 'Comprar',
    tasks:'Tarefas', tasksTabQuests:'Missões', tasksTabAch:'Conquistas', taskClaim:'RESGATAR', taskClaimed:'RESGATADO', taskReroll:'TROCAR',
    quests: { qWinGames:'Vença 3 jogos', qMatchPairs:'Combine 20 pares', qPlayGames:'Jogue 5 jogos', qWinHard:'Vença no difícil', qPerfectWin:'Jogo perfeito', qFastWin:'Vitória rápida', qWinMedium:'Vença 2 no médio', qMatchPairsBig:'Combine 40 pares' },
    achievements: { aFirstWin:'Primeira vitória', aWin10:'10 vitórias', aWin50:'50 vitórias', aPairs100:'100 pares', aPairs500:'500 pares', aExpertWin:'Vença no especialista', aAllDifficulties:'Todas as dificuldades', aStreak7:'Sequência de 7 dias', aCollector:'5 cosméticos', aRich:'1000 pérolas no total', aPerfectionist:'10 jogos perfeitos', aSpeedrunner:'10 vitórias rápidas', aWin25:'25 vitórias', aPlay25:'Jogue 25 jogos', aPlay100:'Jogue 100 jogos', aPairs1000:'1000 pares', aHardMaster:'10 vitórias no difícil', aExpertMaster:'10 vitórias no especialista', aStreak30:'Sequência de 30 dias', aCollector15:'15 cosméticos', aLevel5:'Nível 5', aLevel10:'Nível 10' },
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
        { h: 'O que há no jogo', lines: [
          'Coleção — desbloqueie mares, versos e paletas com pérolas.',
          'Recompensa diária — volte todos os dias para resgatar pérolas.',
          'Tarefas — missões e conquistas com recompensas.',
          'Recordes — a tabela dos melhores resultados.',
        ] },
        { h: 'Como ganhar pérolas 🦪', lines: [
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

  // Arabic: no uppercase concept — labels are natural-case.
  // diffDesc uses correct Arabic grammar: plural (أزواج) for counts 3–10,
  // singular (زوج) for counts 11+ (standard Arabic number agreement).
  ar: {
    title:       'أزواج البحر',
    description: 'أزواج البحر — لعبة ذاكرة ممتعة للأطفال من عمر 6 سنوات. اقلب البطاقات وابحث عن التطابقات وتدرب على التركيز مع مخلوقات البحر!',
    subtitle: 'لعبة ذاكرة بالبطاقات',
    difficulty: 'الصعوبة',
    diffLabels: { easy: 'سهل', medium: 'متوسط', hard: 'صعب', expert: 'خبير' },
    diffDesc:   {
      easy:   '٦ أزواج · ١٢ بطاقة',
      medium: '١٠ أزواج · ٢٠ بطاقة',
      hard:   '١٢ زوج · ٢٤ بطاقة',
      expert: '١٤ زوج · ٢٨ بطاقة',
    },
    diffHint:   {
      easy:   'مثالي للمبتدئين',
      medium: 'لعبة كلاسيكية',
      hard:   'للأساتذة الحقيقيين',
      expert: 'جميع المخلوقات الـ ١٤!',
    },
    sound:   'الصوت',
    soundOn: 'مفعّل',
    soundOff: 'معطّل',
    play:    'ابدأ اللعبة',
    menu:    'القائمة',
    moves:   (n) => `الحركات: ${n}`,
    pairs:   (n, total) => `الأزواج: ${n} / ${total}`,
    victory: 'فوز!',
    allPairsFound: 'تم العثور على جميع الأزواج!',
    vRecord: 'رقم قياسي جديد!',
    vFirstWin: 'الفوز الأول ×2',
    profile: 'الملف', level: 'المستوى', statGames: 'الألعاب', statWins: 'الانتصارات', statPairs: 'الأزواج',
    movesResult: (n) => `الحركات: ${n}`,
    timeResult:  (t) => `الوقت: ${t}`,
    restart: 'مجدداً',
    toMenu:  'إلى القائمة',
    movesLabel: 'الحركات',
    timeLabel:  'الوقت',
    leaderboard: 'الأرقام القياسية',
    loginToSave: 'سجّل الدخول لحفظ النتيجة',
    lbTitle:     'لوحة المتصدرين',
    lbLoading:   'جارٍ التحميل...',
    lbClose:     'إغلاق',
    lbPlayer: 'اللاعب', lbEmpty: 'لا توجد أرقام قياسية بعد',
    shop: 'المجموعة', shopBuy: 'شراء', shopEquip: 'تجهيز', shopEquipped: 'مُجهَّز',
    shopTabSea: 'البحر', shopTabBack: 'ظهر البطاقة', shopTabPalette: 'الألوان', shopCollected: 'تم الجمع',
    shopItems: { seaLagoon:'بحيرة', seaReef:'شعاب', seaAbyss:'هاوية', seaArctic:'قطبي', seaTropic:'استوائي', seaDusk:'غسق', seaEmber:'جمر',
      backClassic:'كلاسيكي', backGold:'ذهبي', backCoral:'مرجاني', backDeep:'عميق', backSilver:'فضي', backJade:'يشم', backOnyx:'عقيق',
      uiOcean:'محيط', uiSunset:'غروب', uiEmerald:'زمرد', uiAmethyst:'جمشت', uiCrimson:'قرمزي', uiSlate:'أردوازي', uiSand:'رملي' },
    dailyTitle: 'المكافأة اليومية', dailyClaim: 'استلام', dailyDouble: 'مضاعفة عبر إعلان', dailyComeBack: 'عُد غداً!',
    topupTitle: 'احصل على اللؤلؤ', iapBuy: 'شراء',
    tasks:'المهام', tasksTabQuests:'المهام', tasksTabAch:'الإنجازات', taskClaim:'استلام', taskClaimed:'تم الاستلام', taskReroll:'تبديل',
    quests: { qWinGames:'افز بـ ٣ مباريات', qMatchPairs:'طابق ٢٠ زوجاً', qPlayGames:'العب ٥ مباريات', qWinHard:'فز في الصعب', qPerfectWin:'مباراة مثالية', qFastWin:'فوز سريع', qWinMedium:'افز مرتين في المتوسط', qMatchPairsBig:'طابق ٤٠ زوجاً' },
    achievements: { aFirstWin:'الفوز الأول', aWin10:'١٠ انتصارات', aWin50:'٥٠ انتصاراً', aPairs100:'١٠٠ زوج', aPairs500:'٥٠٠ زوج', aExpertWin:'فز في الخبير', aAllDifficulties:'جميع الصعوبات', aStreak7:'سلسلة ٧ أيام', aCollector:'٥ عناصر تجميلية', aRich:'١٠٠٠ لؤلؤة إجمالاً', aPerfectionist:'١٠ مباريات مثالية', aSpeedrunner:'١٠ انتصارات سريعة', aWin25:'٢٥ انتصاراً', aPlay25:'العب ٢٥ مباراة', aPlay100:'العب ١٠٠ مباراة', aPairs1000:'١٠٠٠ زوج', aHardMaster:'١٠ انتصارات في الصعب', aExpertMaster:'١٠ انتصارات في الخبير', aStreak30:'سلسلة ٣٠ يوماً', aCollector15:'١٥ عنصراً تجميلياً', aLevel5:'المستوى ٥', aLevel10:'المستوى ١٠' },
    help: {
      title: 'كيفية اللعب',
      sections: [
        { h: 'الهدف', lines: [
          'اقلب بطاقتين في كل دور.',
          'إذا تطابقتا تبقيان مكشوفتين، وإلا تُقلب البطاقتان من جديد.',
          'اكشف جميع الأزواج للفوز. عدد حركات أقل ووقت أسرع يعنيان نتيجة أفضل.',
        ] },
        { h: 'الصعوبات', lines: [
          'سهل — ٦ أزواج، متوسط — ١٠، صعب — ١٢، خبير — ١٤.',
          'كلما زادت الصعوبة زاد عدد البطاقات والمكافأة.',
        ] },
        { h: 'ماذا في اللعبة', lines: [
          'المجموعة — افتح أشكال البحر وظهور البطاقات والألوان مقابل اللؤلؤ.',
          'المكافأة اليومية — عُد كل يوم لاستلام اللؤلؤ.',
          'المهام — مهام وإنجازات مع مكافآت.',
          'الأرقام القياسية — جدول أفضل النتائج.',
        ] },
        { h: 'كيف تكسب اللؤلؤ 🦪', lines: [
          'مكافأة أساسية عن كل فوز.',
          'مكافآت إضافية: مباراة مثالية بلا أخطاء، ووقت سريع، ورقم قياسي شخصي جديد.',
          'أول فوز في اليوم يمنح ×2.',
          'الانتصارات المتتالية المتكررة تمنح أقل (حماية من التكرار).',
          'كذلك: سلسلة يومية، ومهام، وإنجازات، ومضاعفة عبر إعلان.',
        ] },
        { h: 'الخبرة والمستوى', lines: [
          'كل فوز يمنح خبرة (XP).',
          'املأ شريط الخبرة لرفع مستواك.',
          'كل مستوى جديد يكافئك باللؤلؤ.',
        ] },
      ],
    },
  },
};