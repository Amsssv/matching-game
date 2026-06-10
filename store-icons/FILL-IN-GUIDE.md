# Яндекс.Игры — товары для заполнения формы покупок

12 товаров. Для каждого создаётся отдельная покупка (кнопка «Добавить»).
Иконки лежат рядом — файл `<ID>.png` (512×512, PNG).

## Как заполнять (поля формы)
- **ID** — копировать ровно как в заголовке блока (без пробелов). Должен в точности совпадать — иначе игра не выдаст товар.
- **Стоимость** — впишите в одной валюте (удобнее USD), остальные пересчитаются. USD/EUR ниже — ориентир, ставьте на своё усмотрение.
- **Иконка** — загрузите `<ID>.png` из этой папки.
- **Название / Описание** — заполнить на каждой языковой вкладке. Ниже даны переводы на все 6 локалей игры: 🇷🇺 ru · 🇬🇧 en · 🇹🇷 tr · 🇪🇸 es · 🇵🇹 pt · 🇸🇦 ar.

> Consumable/non-consumable в форме не выбирается — это в коде. Для справки: паки и наборы — расходуемые (валюта), косметика — постоянная.

---

## 1. Жемчужные паки (расходуемые)

### `pearls_small` — 500 🦪 · USD 0.99 / EUR 0.99 · `pearls_small.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Горсть жемчуга | 500 жемчужин для покупок в магазине. |
| en | Handful of Pearls | 500 pearls to spend in the shop. |
| tr | Bir Avuç İnci | Mağazada harcamak için 500 inci. |
| es | Puñado de perlas | 500 perlas para gastar en la tienda. |
| pt | Punhado de pérolas | 500 pérolas para gastar na loja. |
| ar | حفنة من اللؤلؤ | ٥٠٠ لؤلؤة للإنفاق في المتجر. |

### `pearls_medium` — 1300 🦪 · USD 1.99 / EUR 1.99 · `pearls_medium.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Мешочек жемчуга | 1300 жемчужин — на пару оформлений. |
| en | Pouch of Pearls | 1300 pearls — enough for a few cosmetics. |
| tr | İnci Kesesi | 1300 inci — birkaç görünüm için yeterli. |
| es | Bolsa de perlas | 1300 perlas, suficiente para varios cosméticos. |
| pt | Saco de pérolas | 1300 pérolas, suficiente para alguns cosméticos. |
| ar | كيس من اللؤلؤ | ١٣٠٠ لؤلؤة — تكفي لعدة تصاميم. |

### `pearls_large` — 3500 🦪 · USD 4.99 / EUR 4.99 · `pearls_large.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Сундук жемчуга | 3500 жемчужин. Выгодный набор. |
| en | Chest of Pearls | 3500 pearls. Great value. |
| tr | İnci Sandığı | 3500 inci. Avantajlı paket. |
| es | Cofre de perlas | 3500 perlas. Gran valor. |
| pt | Baú de pérolas | 3500 pérolas. Ótimo custo-benefício. |
| ar | صندوق من اللؤلؤ | ٣٥٠٠ لؤلؤة. صفقة رائعة. |

### `pearls_mega` — 8000 🦪 · USD 9.99 / EUR 9.99 · `pearls_mega.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Сокровищница | 8000 жемчужин. Максимальная выгода. |
| en | Pearl Hoard | 8000 pearls. Best value. |
| tr | İnci Hazinesi | 8000 inci. En iyi değer. |
| es | Tesoro de perlas | 8000 perlas. El mejor valor. |
| pt | Tesouro de pérolas | 8000 pérolas. O melhor valor. |
| ar | كنز اللؤلؤ | ٨٠٠٠ لؤلؤة. أفضل قيمة. |

---

## 2. Премиум-косметика (постоянная)

### `sea_ember` — тема моря «Жар» · USD 1.49 / EUR 1.49 · `sea_ember.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Жар | Тёплая тема моря. Разблокируется навсегда. |
| en | Ember | A warm sea theme. Unlocked forever. |
| tr | Kor | Sıcak bir deniz teması. Kalıcı olarak açılır. |
| es | Brasa | Un tema marino cálido. Se desbloquea para siempre. |
| pt | Brasa | Um tema de mar quente. Desbloqueado para sempre. |
| ar | جمر | ثيم بحر دافئ. يُفتح للأبد. |

### `back_onyx` — рубашка карт «Оникс» · USD 1.49 / EUR 1.49 · `back_onyx.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Оникс | Тёмная рубашка карт. Разблокируется навсегда. |
| en | Onyx | A dark card back. Unlocked forever. |
| tr | Oniks | Koyu bir kart arkası. Kalıcı olarak açılır. |
| es | Ónix | Un reverso de carta oscuro. Se desbloquea para siempre. |
| pt | Ônix | Um verso de carta escuro. Desbloqueado para sempre. |
| ar | عقيق | ظهر بطاقة داكن. يُفتح للأبد. |

### `ui_amethyst` — палитра «Аметист» · USD 1.99 / EUR 1.99 · `ui_amethyst.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Аметист | Фиолетовая палитра интерфейса. Навсегда. |
| en | Amethyst | A purple interface palette. Forever. |
| tr | Ametist | Mor bir arayüz paleti. Kalıcı. |
| es | Amatista | Una paleta de interfaz púrpura. Para siempre. |
| pt | Ametista | Uma paleta de interface roxa. Para sempre. |
| ar | جمشت | لوحة ألوان أرجوانية للواجهة. للأبد. |

### `ui_sand` — палитра «Песок» · USD 1.99 / EUR 1.99 · `ui_sand.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Песок | Тёплая песочная палитра интерфейса. Навсегда. |
| en | Sand | A warm sandy interface palette. Forever. |
| tr | Kum | Sıcak kum rengi arayüz paleti. Kalıcı. |
| es | Arena | Una paleta de interfaz arena cálida. Para siempre. |
| pt | Areia | Uma paleta de interface areia quente. Para sempre. |
| ar | رملي | لوحة ألوان رملية دافئة للواجهة. للأبد. |

---

## 3. Эксклюзивы (только за деньги, постоянные)

### `ui_aurora` — палитра «Аврора» · USD 2.49 / EUR 2.49 · `ui_aurora.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Аврора | Эксклюзивная палитра северного сияния. |
| en | Aurora | An exclusive northern-lights palette. |
| tr | Aurora | Özel kuzey ışıkları paleti. |
| es | Aurora | Una paleta exclusiva de auroras boreales. |
| pt | Aurora | Uma paleta exclusiva de aurora boreal. |
| ar | الشفق | لوحة ألوان حصرية للشفق القطبي. |

### `back_prism` — рубашка «Призма» · USD 2.49 / EUR 2.49 · `back_prism.png`
| Язык | Название | Описание |
|---|---|---|
| ru | Призма | Эксклюзивная радужная рубашка карт. |
| en | Prism | An exclusive rainbow card back. |
| tr | Prizma | Özel gökkuşağı kart arkası. |
| es | Prisma | Un reverso de carta arcoíris exclusivo. |
| pt | Prisma | Um verso de carta arco-íris exclusivo. |
| ar | منشور | ظهر بطاقة حصري بألوان قوس قزح. |

---

## 4. Наборы (расходуемые — содержат жемчуг)

### `bundle_founder` — Набор основателя · USD 4.99 / EUR 4.99 · `bundle_founder.png`
Содержимое: Аврора + Призма + 1500 🦪
| Язык | Название | Описание |
|---|---|---|
| ru | Набор основателя | Палитра «Аврора», рубашка «Призма» и 1500 жемчужин. |
| en | Founder's Pack | Aurora palette, Prism card back and 1500 pearls. |
| tr | Kurucu Paketi | Aurora paleti, Prizma kart arkası ve 1500 inci. |
| es | Pack de fundador | Paleta Aurora, reverso Prisma y 1500 perlas. |
| pt | Pacote do fundador | Paleta Aurora, verso Prisma e 1500 pérolas. |
| ar | حزمة المؤسس | لوحة «الشفق» وظهر «منشور» و١٥٠٠ لؤلؤة. |

### `bundle_premium` — Премиум-набор · USD 7.99 / EUR 7.99 · `bundle_premium.png`
Содержимое: Жар + Оникс + Аметист + Песок + 1000 🦪
| Язык | Название | Описание |
|---|---|---|
| ru | Премиум-набор | Четыре премиум-оформления и 1000 жемчужин. |
| en | Premium Pack | Four premium cosmetics and 1000 pearls. |
| tr | Premium Paket | Dört premium görünüm ve 1000 inci. |
| es | Pack premium | Cuatro cosméticos premium y 1000 perlas. |
| pt | Pacote premium | Quatro cosméticos premium e 1000 pérolas. |
| ar | الحزمة المميزة | أربعة تصاميم مميزة و١٠٠٠ لؤلؤة. |
