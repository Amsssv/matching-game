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
    shop: 'Коллекция', shopBuy: 'Купить', shopEquip: 'Надеть', shopEquipped: 'Надето',
    shopTabSea: 'Море', shopTabBack: 'Рубашка', shopTabPalette: 'Палитра', shopCollected: 'Собрано',
    shopItems: { seaLagoon:'Лагуна', seaReef:'Риф', seaAbyss:'Бездна', seaArctic:'Арктика',
      backClassic:'Классика', backGold:'Золото', backCoral:'Коралл', backDeep:'Глубина',
      uiOcean:'Океан', uiSunset:'Закат', uiEmerald:'Изумруд', uiAmethyst:'Аметист' },
    dailyTitle: 'Ежедневная награда', dailyClaim: 'Забрать', dailyDouble: 'Удвоить за рекламу', dailyComeBack: 'Возвращайтесь завтра!',
    tasks:'Задания', tasksTabQuests:'Квесты', tasksTabAch:'Достижения', taskClaim:'Забрать', taskClaimed:'Получено', taskReroll:'Обновить',
    quests: { qWinGames:'Выиграй 3 игры', qMatchPairs:'Собери 20 пар', qPlayGames:'Сыграй 5 игр', qWinHard:'Победа на сложном', qPerfectWin:'Идеальная игра', qFastWin:'Быстрая победа', qWinMedium:'2 победы на среднем', qMatchPairsBig:'Собери 40 пар' },
    achievements: { aFirstWin:'Первая победа', aWin10:'10 побед', aWin50:'50 побед', aPairs100:'100 пар', aPairs500:'500 пар', aExpertWin:'Победа на эксперте', aAllDifficulties:'Все сложности', aStreak7:'Стрик 7 дней', aCollector:'5 предметов в коллекции', aRich:'1000 жемчуга всего', aPerfectionist:'10 идеальных игр', aSpeedrunner:'10 быстрых побед' },
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
    shop: 'Collection', shopBuy: 'Buy', shopEquip: 'Equip', shopEquipped: 'Equipped',
    shopTabSea: 'Sea', shopTabBack: 'Card back', shopTabPalette: 'Palette', shopCollected: 'Collected',
    shopItems: { seaLagoon:'Lagoon', seaReef:'Reef', seaAbyss:'Abyss', seaArctic:'Arctic',
      backClassic:'Classic', backGold:'Gold', backCoral:'Coral', backDeep:'Deep',
      uiOcean:'Ocean', uiSunset:'Sunset', uiEmerald:'Emerald', uiAmethyst:'Amethyst' },
    dailyTitle: 'Daily reward', dailyClaim: 'Claim', dailyDouble: 'Double via ad', dailyComeBack: 'Come back tomorrow!',
    tasks:'Tasks', tasksTabQuests:'Quests', tasksTabAch:'Achievements', taskClaim:'Claim', taskClaimed:'Claimed', taskReroll:'Reroll',
    quests: { qWinGames:'Win 3 games', qMatchPairs:'Match 20 pairs', qPlayGames:'Play 5 games', qWinHard:'Win on hard', qPerfectWin:'A perfect game', qFastWin:'A fast win', qWinMedium:'Win 2 on medium', qMatchPairsBig:'Match 40 pairs' },
    achievements: { aFirstWin:'First win', aWin10:'10 wins', aWin50:'50 wins', aPairs100:'100 pairs', aPairs500:'500 pairs', aExpertWin:'Win on expert', aAllDifficulties:'All difficulties', aStreak7:'7-day streak', aCollector:'5 cosmetics owned', aRich:'1000 pearls earned', aPerfectionist:'10 perfect games', aSpeedrunner:'10 fast wins' },
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
    shop: 'Koleksiyon', shopBuy: 'SATIN AL', shopEquip: 'TAK', shopEquipped: 'TAKILI',
    shopTabSea: 'Deniz', shopTabBack: 'Kart Arkası', shopTabPalette: 'Palet', shopCollected: 'Toplandı',
    shopItems: { seaLagoon:'Lagün', seaReef:'Resif', seaAbyss:'Uçurum', seaArctic:'Kutup',
      backClassic:'Klasik', backGold:'Altın', backCoral:'Mercan', backDeep:'Derinlik',
      uiOcean:'Okyanus', uiSunset:'Gün Batımı', uiEmerald:'Zümrüt', uiAmethyst:'Ametist' },
    dailyTitle: 'Günlük ödül', dailyClaim: 'AL', dailyDouble: 'REKLAMLA İKİYE KATLA', dailyComeBack: 'Yarın tekrar gel!',
    tasks:'Görevler', tasksTabQuests:'Görevler', tasksTabAch:'Başarılar', taskClaim:'AL', taskClaimed:'ALINDI', taskReroll:'YENİLE',
    quests: { qWinGames:'3 oyun kazan', qMatchPairs:'20 çift eşleştir', qPlayGames:'5 oyun oyna', qWinHard:'Zorda kazan', qPerfectWin:'Kusursuz oyun', qFastWin:'Hızlı zafer', qWinMedium:'Ortada 2 kez kazan', qMatchPairsBig:'40 çift eşleştir' },
    achievements: { aFirstWin:'İlk zafer', aWin10:'10 zafer', aWin50:'50 zafer', aPairs100:'100 çift', aPairs500:'500 çift', aExpertWin:'Uzmanda kazan', aAllDifficulties:'Tüm zorluklar', aStreak7:'7 günlük seri', aCollector:'5 kozmetik sahibi', aRich:'Toplam 1000 inci', aPerfectionist:'10 kusursuz oyun', aSpeedrunner:'10 hızlı zafer' },
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
    shop: 'Colección', shopBuy: 'COMPRAR', shopEquip: 'EQUIPAR', shopEquipped: 'EQUIPADO',
    shopTabSea: 'Mar', shopTabBack: 'Reverso', shopTabPalette: 'Paleta', shopCollected: 'Coleccionados',
    shopItems: { seaLagoon:'Laguna', seaReef:'Arrecife', seaAbyss:'Abismo', seaArctic:'Ártico',
      backClassic:'Clásico', backGold:'Oro', backCoral:'Coral', backDeep:'Profundo',
      uiOcean:'Océano', uiSunset:'Atardecer', uiEmerald:'Esmeralda', uiAmethyst:'Amatista' },
    dailyTitle: 'Recompensa diaria', dailyClaim: 'RECLAMAR', dailyDouble: 'DUPLICAR CON ANUNCIO', dailyComeBack: '¡Vuelve mañana!',
    tasks:'Tareas', tasksTabQuests:'Misiones', tasksTabAch:'Logros', taskClaim:'RECLAMAR', taskClaimed:'OBTENIDO', taskReroll:'CAMBIAR',
    quests: { qWinGames:'Gana 3 partidas', qMatchPairs:'Empareja 20 pares', qPlayGames:'Juega 5 partidas', qWinHard:'Gana en difícil', qPerfectWin:'Partida perfecta', qFastWin:'Victoria rápida', qWinMedium:'Gana 2 en medio', qMatchPairsBig:'Empareja 40 pares' },
    achievements: { aFirstWin:'Primera victoria', aWin10:'10 victorias', aWin50:'50 victorias', aPairs100:'100 pares', aPairs500:'500 pares', aExpertWin:'Gana en experto', aAllDifficulties:'Todas las dificultades', aStreak7:'Racha de 7 días', aCollector:'5 cosméticos', aRich:'1000 perlas en total', aPerfectionist:'10 partidas perfectas', aSpeedrunner:'10 victorias rápidas' },
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
    shop: 'Coleção', shopBuy: 'COMPRAR', shopEquip: 'EQUIPAR', shopEquipped: 'EQUIPADO',
    shopTabSea: 'Mar', shopTabBack: 'Verso', shopTabPalette: 'Paleta', shopCollected: 'Coletados',
    shopItems: { seaLagoon:'Lagoa', seaReef:'Recife', seaAbyss:'Abismo', seaArctic:'Ártico',
      backClassic:'Clássico', backGold:'Ouro', backCoral:'Coral', backDeep:'Profundo',
      uiOcean:'Oceano', uiSunset:'Pôr do Sol', uiEmerald:'Esmeralda', uiAmethyst:'Ametista' },
    dailyTitle: 'Recompensa diária', dailyClaim: 'RESGATAR', dailyDouble: 'DOBRAR COM ANÚNCIO', dailyComeBack: 'Volte amanhã!',
    tasks:'Tarefas', tasksTabQuests:'Missões', tasksTabAch:'Conquistas', taskClaim:'RESGATAR', taskClaimed:'RESGATADO', taskReroll:'TROCAR',
    quests: { qWinGames:'Vença 3 jogos', qMatchPairs:'Combine 20 pares', qPlayGames:'Jogue 5 jogos', qWinHard:'Vença no difícil', qPerfectWin:'Jogo perfeito', qFastWin:'Vitória rápida', qWinMedium:'Vença 2 no médio', qMatchPairsBig:'Combine 40 pares' },
    achievements: { aFirstWin:'Primeira vitória', aWin10:'10 vitórias', aWin50:'50 vitórias', aPairs100:'100 pares', aPairs500:'500 pares', aExpertWin:'Vença no especialista', aAllDifficulties:'Todas as dificuldades', aStreak7:'Sequência de 7 dias', aCollector:'5 cosméticos', aRich:'1000 pérolas no total', aPerfectionist:'10 jogos perfeitos', aSpeedrunner:'10 vitórias rápidas' },
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
    shop: 'المجموعة', shopBuy: 'شراء', shopEquip: 'تجهيز', shopEquipped: 'مُجهَّز',
    shopTabSea: 'البحر', shopTabBack: 'ظهر البطاقة', shopTabPalette: 'الألوان', shopCollected: 'تم الجمع',
    shopItems: { seaLagoon:'بحيرة', seaReef:'شعاب', seaAbyss:'هاوية', seaArctic:'قطبي',
      backClassic:'كلاسيكي', backGold:'ذهبي', backCoral:'مرجاني', backDeep:'عميق',
      uiOcean:'محيط', uiSunset:'غروب', uiEmerald:'زمرد', uiAmethyst:'جمشت' },
    dailyTitle: 'المكافأة اليومية', dailyClaim: 'استلام', dailyDouble: 'مضاعفة عبر إعلان', dailyComeBack: 'عُد غداً!',
    tasks:'المهام', tasksTabQuests:'المهام', tasksTabAch:'الإنجازات', taskClaim:'استلام', taskClaimed:'تم الاستلام', taskReroll:'تبديل',
    quests: { qWinGames:'افز بـ ٣ مباريات', qMatchPairs:'طابق ٢٠ زوجاً', qPlayGames:'العب ٥ مباريات', qWinHard:'فز في الصعب', qPerfectWin:'مباراة مثالية', qFastWin:'فوز سريع', qWinMedium:'افز مرتين في المتوسط', qMatchPairsBig:'طابق ٤٠ زوجاً' },
    achievements: { aFirstWin:'الفوز الأول', aWin10:'١٠ انتصارات', aWin50:'٥٠ انتصاراً', aPairs100:'١٠٠ زوج', aPairs500:'٥٠٠ زوج', aExpertWin:'فز في الخبير', aAllDifficulties:'جميع الصعوبات', aStreak7:'سلسلة ٧ أيام', aCollector:'٥ عناصر تجميلية', aRich:'١٠٠٠ لؤلؤة إجمالاً', aPerfectionist:'١٠ مباريات مثالية', aSpeedrunner:'١٠ انتصارات سريعة' },
  },
};