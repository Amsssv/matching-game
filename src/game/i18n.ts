export type Lang = 'ru' | 'en' | 'tr' | 'es' | 'pt' | 'ar';

export interface Locale {
  title: string;
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
}

export const LOCALES: Record<Lang, Locale> = {
  ru: {
    title:    'МОРСКИЕ ПАРЫ',
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
  },

  en: {
    title:    'SEA PAIRS',
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
  },

  tr: {
    title:    'DENİZ ÇİFTLERİ',
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
  },

  es: {
    title:    'PARES MARINOS',
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
  },

  pt: {
    title:    'PARES DO MAR',
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
  },

  // Arabic: no uppercase concept — labels are natural-case.
  // diffDesc uses correct Arabic grammar: plural (أزواج) for counts 3–10,
  // singular (زوج) for counts 11+ (standard Arabic number agreement).
  ar: {
    title:    'أزواج البحر',
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
  },
};