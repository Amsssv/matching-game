# Яндекс.Игры — товары для формы «Покупки»

**13 товаров** (4 пака + 7 косметики + 2 набора). Для каждого — отдельная покупка (кнопка «Добавить»).
Иконки лежат рядом — файл `<ID>.png` (512×512, PNG).

## Как заполнять (поля формы)
- **ID** — копировать ровно как в заголовке блока (без пробелов). Должен в точности совпадать с кодом (`src/state/iap.ts` `PEARL_PACKS`/`BUNDLES`, `src/state/catalog.ts` `productId`) — иначе игра не выдаст товар.
- **Стоимость** — впишите в одной валюте (удобнее USD), остальные пересчитаются. Значения ниже — фактические из консоли / ориентир; ставьте на своё усмотрение.
- **Иконка** — загрузите `<ID>.png` из этой папки.
- **Название / Описание** — заполнить на каждой языковой вкладке. Ниже — переводы на все 5 локалей: 🇷🇺 ru · 🇬🇧 en · 🇹🇷 tr · 🇪🇸 es · 🇵🇹 pt.

> Consumable/non-consumable в форме не выбирается — это в коде. Справочно: паки и наборы — расходуемые (валюта/жемчуг), косметика — постоянная.

## ⚠️ Расхождение консоли с кодом (по состоянию на 2026-07-15)
- **ДОБАВИТЬ 4 товара:** `sea_lava`, `sea_reef`, `sea_arctic`, `sea_abyss` (иконок для них ещё нет — сгенерировать через `gen_icons.py`).
- **ДЕАКТИВИРОВАТЬ/УДАЛИТЬ 3 устаревших:** `sea_ember`, `ui_aurora`, `back_prism` (в коде их больше нет; игра не выдаст).
- **ИСПРАВИТЬ описания** `bundle_founder` и `bundle_premium` — раньше описывали «Аврору/Призму» и «четыре оформления»; актуальное содержимое — ниже.

---

## 1. Жемчужные паки (расходуемые)

### `pearls_small` — 500 🦪 · ≈20 / USD 0.90 / EUR 0.78 · `pearls_small.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Горсть жемчуга | 500 жемчужин для покупок в магазине. |
| en | Handful of Pearls | 500 pearls to spend in the shop. |
| tr | Bir Avuç İnci | Mağazada harcamak için 500 inci. |
| es | Puñado de perlas | 500 perlas para gastar en la tienda. |
| pt | Punhado de pérolas | 500 pérolas para gastar na loja. |

### `pearls_medium` — 1500 🦪 · ≈41 / USD 1.85 / EUR 1.61 · `pearls_medium.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Мешочек жемчуга | 1500 жемчужин — на пару оформлений. |
| en | Pouch of Pearls | 1500 pearls — enough for a few cosmetics. |
| tr | İnci Kesesi | 1500 inci — birkaç görünüm için yeterli. |
| es | Bolsa de perlas | 1500 perlas, suficiente para varios cosméticos. |
| pt | Saco de pérolas | 1500 pérolas, suficiente para alguns cosméticos. |

### `pearls_large` — 4000 🦪 · ≈103 / USD 4.66 / EUR 4.04 · `pearls_large.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Сундук жемчуга | 4000 жемчужин. Выгодный набор. |
| en | Chest of Pearls | 4000 pearls. Great value. |
| tr | İnci Sandığı | 4000 inci. Avantajlı paket. |
| es | Cofre de perlas | 4000 perlas. Gran valor. |
| pt | Baú de pérolas | 4000 pérolas. Ótimo custo-benefício. |

### `pearls_mega` — 8000 🦪 · ≈206 / USD 9.31 / EUR 8.08 · `pearls_mega.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Сокровищница | 8000 жемчужин. Максимальная выгода. |
| en | Pearl Hoard | 8000 pearls. Best value. |
| tr | İnci Hazinesi | 8000 inci. En iyi değer. |
| es | Tesoro de perlas | 8000 perlas. El mejor valor. |
| pt | Tesouro de pérolas | 8000 pérolas. O melhor valor. |

---

## 2. Премиум-косметика (постоянная; в игре также покупается за 🦪)

### `sea_lava` — тема моря · ≈31 / USD 1.40 / EUR 1.22 · `sea_lava.png` *(иконку создать)*
| Язык | Название | Описание |
|---|---|---|
| ru | Лава | Огненная тема моря. Разблокируется навсегда. |
| en | Lava | A fiery sea theme. Unlocked forever. |
| tr | Lav | Ateşli bir deniz teması. Kalıcı olarak açılır. |
| es | Lava | Un tema marino ardiente. Se desbloquea para siempre. |
| pt | Lava | Um tema de mar ardente. Desbloqueado para sempre. |

### `sea_reef` — тема моря · ≈31 / USD 1.40 / EUR 1.22 · `sea_reef.png` *(иконку создать)*
| Язык | Название | Описание |
|---|---|---|
| ru | Риф | Коралловая тема моря. Разблокируется навсегда. |
| en | Reef | A coral sea theme. Unlocked forever. |
| tr | Resif | Mercan bir deniz teması. Kalıcı olarak açılır. |
| es | Arrecife | Un tema marino de coral. Se desbloquea para siempre. |
| pt | Recife | Um tema de mar de coral. Desbloqueado para sempre. |

### `sea_arctic` — тема моря · ≈31 / USD 1.40 / EUR 1.22 · `sea_arctic.png` *(иконку создать)*
| Язык | Название | Описание |
|---|---|---|
| ru | Арктика | Ледяная тема моря. Разблокируется навсегда. |
| en | Arctic | An icy sea theme. Unlocked forever. |
| tr | Kutup | Buzlu bir deniz teması. Kalıcı olarak açılır. |
| es | Ártico | Un tema marino helado. Se desbloquea para siempre. |
| pt | Ártico | Um tema de mar gelado. Desbloqueado para sempre. |

### `sea_abyss` — тема моря · ≈31 / USD 1.40 / EUR 1.22 · `sea_abyss.png` *(иконку создать)*
| Язык | Название | Описание |
|---|---|---|
| ru | Бездна | Глубоководная тема моря. Разблокируется навсегда. |
| en | Abyss | A deep-sea theme. Unlocked forever. |
| tr | Uçurum | Derin deniz teması. Kalıcı olarak açılır. |
| es | Abismo | Un tema marino de las profundidades. Se desbloquea para siempre. |
| pt | Abismo | Um tema de mar das profundezas. Desbloqueado para sempre. |

### `back_onyx` — рубашка карт · ≈31 / USD 1.40 / EUR 1.22 · `back_onyx.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Оникс | Тёмная рубашка карт. Разблокируется навсегда. |
| en | Onyx | A dark card back. Unlocked forever. |
| tr | Oniks | Koyu bir kart arkası. Kalıcı olarak açılır. |
| es | Ónix | Un reverso de carta oscuro. Se desbloquea para siempre. |
| pt | Ônix | Um verso de carta escuro. Desbloqueado para sempre. |

### `ui_amethyst` — палитра интерфейса · ≈41 / USD 1.85 / EUR 1.61 · `ui_amethyst.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Аметист | Фиолетовая палитра интерфейса. Навсегда. |
| en | Amethyst | A purple interface palette. Forever. |
| tr | Ametist | Mor bir arayüz paleti. Kalıcı. |
| es | Amatista | Una paleta de interfaz púrpura. Para siempre. |
| pt | Ametista | Uma paleta de interface roxa. Para sempre. |

### `ui_sand` — палитра интерфейса · ≈41 / USD 1.85 / EUR 1.61 · `ui_sand.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Песок | Тёплая песочная палитра интерфейса. Навсегда. |
| en | Sand | A warm sandy interface palette. Forever. |
| tr | Kum | Sıcak kum rengi arayüz paleti. Kalıcı. |
| es | Arena | Una paleta de interfaz arena cálida. Para siempre. |
| pt | Areia | Uma paleta de interface areia quente. Para sempre. |

---

## 3. Наборы (расходуемые — содержат жемчуг)

### `bundle_founder` — Набор основателя · ≈103 / USD 4.66 / EUR 4.04 · `bundle_founder.png`
Содержимое (выдаётся кодом): рубашка «Нефрит» + палитра «Багрянец» + 1500 🦪
| Язык | Название | Описание |
|---|---|---|
| ru | Набор основателя | Рубашка «Нефрит», палитра «Багрянец» и 1500 жемчужин. |
| en | Founder's Pack | Jade card back, Crimson palette and 1500 pearls. |
| tr | Kurucu Paketi | Yeşim kart arkası, Kızıl palet ve 1500 inci. |
| es | Pack de fundador | Reverso Jade, paleta Carmesí y 1500 perlas. |
| pt | Pacote do fundador | Verso Jade, paleta Carmesim e 1500 pérolas. |

### `bundle_premium` — Премиум-набор · ≈164 / USD 7.41 / EUR 6.43 · `bundle_premium.png`
Содержимое (выдаётся кодом): «Оникс» + «Аметист» + «Песок» + 1000 🦪
| Язык | Название | Описание |
|---|---|---|
| ru | Премиум-набор | Оникс, Аметист, Песок и 1000 жемчужин. |
| en | Premium Pack | Onyx, Amethyst, Sand and 1000 pearls. |
| tr | Premium Paket | Oniks, Ametist, Kum ve 1000 inci. |
| es | Pack premium | Ónix, Amatista, Arena y 1000 perlas. |
| pt | Pacote premium | Ônix, Ametista, Areia e 1000 pérolas. |
