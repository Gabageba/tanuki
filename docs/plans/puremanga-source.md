# Источник PureManga и движок сети inuko

Статус: **Утверждён** · 2026-10-27
Задача: `puremanga-source` · ветка `feat/puremanga-source` · песочница не нужна

## Зачем

PureManga (`v1.puremanga.me`) — хентай-сайт сети inuko, соседний с Inkstory: тот же бэкенд
`api.inuko.me`, та же SSO `sso.inuko.me`, та же раскладка сайта (TanStack Start, SSR-состояние
seroval, XOR-шифрование картинок с ключом `decryptionKey` в SSR главной). Сейчас его в tanuki нет.
Нужно, чтобы PureManga работал так же, как Inkstory: каталог, фильтры, поиск, тайтл, главы, чтение,
главная сайта, вход и импорт закладок.

Разведка 2026-10-27 нашла вторую проблему, которая касается обоих сайтов. **Списки API скрывают от
гостя взрослое:** `/v2/books`, поиск и лента `chapter-update-feed` не отдают книги
`contentStatus` `EROTIC` и `PORNOGRAPHIC`. У PureManga из 100 самых популярных книг пришло 72 `SAFE`
и 28 `UNSAFE`, фильтр `contentStatus=PORNOGRAPHIC` возвращает `[]`. Тайтл по id
(`/v2/books/{id}`) и его главы (`/v2/chapters?bookId=`) открываются и гостю: у
`milf-hunting-in-another-world` 348 глав. SSR главной сайта взрослое показывает (57 карточек
`PORNOGRAPHIC`). На сайте фильтр снимают настройки пользователя `global-filters`
(`contentStatuses`, `labelBlacklist`, `preventUserAgentFiltering`), которые меняются через server
functions TanStack Start.

Удачей считаем:

- PureManga открывается в tanuki как полноценный источник, взрослое видно в каталоге и поиске;
- у Inkstory в списках тоже появляется взрослое, которое сейчас теряется;
- один привязанный аккаунт Inuko открывает импорт закладок с обоих сайтов;
- у Inkstory не меняется поведение: тайтлы, главы, прогресс чтения и закладки остаются как есть.

## Скоуп

- **Входит:**
  - Движок вынесен из `sources/inkstory` в общую фабрику `sources/inuko` с конфигом на сайт;
    Inkstory и PureManga становятся конфигами (по образцу Grouple, LibSocial и Senkuro).
  - PureManga целиком, как у Inkstory: каталог, фильтры, сортировки, поиск, тайтл, главы,
    страницы с расшифровкой, главная сайта (`getHome`), вход сессией, импорт закладок.
  - Разведка 18+ и снятие фильтра в списках для обоих сайтов.
  - Переименование семейства аккаунта `INKSTORY` → `INUKO` с миграцией сохранённых аккаунтов.
  - Иконка и цвет источника.
- **Потом:**
  - Другие сайты сети — hexnovels, selftoon, zenmanga и manga.ovh. Их `serviceName` уже видны в
    SSR. Новеллы (hexnovels) tanuki вообще не читает. После фабрики каждый из них — это конфиг.
  - Учитывать `labelBlacklist` и личные фильтры зрителя.
- **Не входит:**
  - Запросы списков от аккаунта зрителя. Выбрана сервисная учётка (см. «Отвергнутые идеи»).
  - Новые экраны и песочница: UI меняется только в группе аккаунта в профиле и в модалке входа.

## Сценарии

### Чтение PureManga

1. Пользователь, которому в tanuki разрешены взрослые источники, видит PureManga в списке
   источников, каталоге и поиске (`isAdult: true`; дальше работает существующий механизм скрытия
   18+).
2. Каталог и фильтры такие же, как у Inkstory: жанры, статус, возрастной рейтинг, страна, формат,
   а также диапазоны рейтинга, года и числа глав. Взрослые тайтлы в каталоге есть.
3. Тайтл → главы по веткам перевода → чтение. Картинки расшифровывает img-proxy ключом
   PureManga.
4. На главной tanuki у PureManga те же четыре блока, что у Inkstory.

### Вход и импорт закладок

1. Профиль → «Аккаунты источников» → группа **Inuko** (Inkstory и PureManga) → «Войти».
2. Модалка входа ведёт на сайт той строки, из которой её открыли (`source.domain`). Человек
   входит там в браузере и копирует cookie `__otaku_session`.
3. Сервер пробует cookie на каждом домене семейства (`inkstory.net`, `v1.puremanga.me`) и
   принимает первый, на котором `/faq` показывает `currentUser`. Аккаунт хранит jar с cookie на
   этом домене.
4. Импорт закладок работает с обоих сайтов: библиотека в API отдаётся по `userId`, а нужный сайт
   выбирает `serviceName`. Поэтому одного аккаунта хватает на всю сеть.
5. Если сессия истекла, аккаунт переходит в `reloginRequired`, как сейчас, и cookie переносят
   заново.

## Логика и правила

### Фабрика inuko

`createInukoParser(config, ctx)`. Конфиг сайта:

```ts
type InukoConfig = {
  id: SourceId; // SOURCE_ID.INKSTORY | SOURCE_ID.PUREMANGA
  serviceName: string; // 'inkstory' | 'puremanga.me' — значение API, не наше
};
```

Домен берётся из `ctx.domain` (`SOURCE_CATALOG[id].domains[0]`). Ключ расшифровки, разметка
главной, блоки главной (`INKSTORY_HOME_SECTION` переименовывается в `INUKO_HOME_SECTION`) и
фильтры — общие для сети. `serviceName` пишется в конфиг как есть: это значение внешнего API
(`puremanga.me` с точкой), и правило `{ SCREAM_CASE: camelCase }` на него не распространяется.

`uid` тайтлов и глав Inkstory не меняются: `generateUid(SOURCE_ID, id)` остаётся с тем же
`SOURCE_ID`. Сохранённый прогресс, закладки и фикстуры `reading-progress` остаются как есть.

### 18+ в списках

Первый этап реализации — разведка: выяснить, что именно снимает фильтр в API. Гипотезы в порядке
проверки:

1. Настройки `global-filters` хранятся у пользователя на стороне inuko. Тогда API узнаёт его по
   cookie сессии или по заголовку/токену, который SSR ставит при запросе к `api.inuko.me`.
2. Настройки хранятся в cookie сайта и уходят в API параметром или заголовком.
3. Срабатывает `preventUserAgentFiltering`: API фильтрует по User-Agent или по origin.

- **Если фильтр снимается аккаунтом.** Заводим сервисную учётку inuko (cookie сессии из env, как
  сервисные учётки других источников для фоновой работы) и один раз ставим ей `contentStatuses`
  со всеми четырьмя значениями. Списки обоих сайтов идут от неё. Тайтл, главы и страницы идут
  как сейчас. Кеш ответов общий.
- **Если через API не получилось** (запасной план). Списки и поиск читаются из SSR-разметки
  страниц каталога сайта (там 18+ есть, как на главной), тайтл и главы — из API.

Если сервисная учётка недоступна (нет env, сессия истекла), источник остаётся рабочим: списки
приходят без 18+, а в лог пишется предупреждение. Это не `down`.

### Семейство аккаунта

```ts
export const SOURCE_AUTH_FAMILY = {
  // …
  INUKO: 'inuko', // было INKSTORY: 'inkstory'
} as const;
```

- `SOURCE_CATALOG.inkstory.authFamily` и `SOURCE_CATALOG.puremanga.authFamily` —
  `SOURCE_AUTH_FAMILY.INUKO`, `loginRequirement: OPTIONAL`, `loginBenefits: []`. Всё открыто
  гостю, а аккаунт нужен только для импорта закладок.
- Название семейства в `getSourceAuthFamilyTitle` — `'Inuko'` (бренд, не переводится).
- `SessionAuthFamily` → `typeof SOURCE_AUTH_FAMILY.INUKO`. `linkSession` перебирает домены всех
  источников семейства, а `fetchInkStoryViewer` → `fetchInukoViewer`.
- `getBookmarks` у каждого сайта узнаёт `userId` по jar аккаунта на том домене, где лежит cookie
  (домен берётся из cookie в jar), и читает библиотеку со своим `serviceName`.
- Действия обратимы: привязку можно снять и повторить. Новых модалок с тоном нет.

## Данные и API

- **Контракты** (`packages/contracts`):
  - `SOURCE_ID.PUREMANGA: 'puremanga'`;
  - запись `SOURCE_CATALOG.puremanga`: `title: 'PureManga'`, `contentType: HENTAI`,
    `isAdult: true`, `requiresVpn: false`, `domains: ['v1.puremanga.me']`, `color` — акцент
    сайта, `isBroken: false`;
  - `SOURCE_AUTH_FAMILY.INKSTORY` → `INUKO` и все места использования.
- **Парсеры** (`packages/parsers`):
  - `sources/inkstory/{index,auth}.ts` → `sources/inuko/{engine,auth,config}.ts`, конфиги
    `INUKO_CONFIGS` для Inkstory и PureManga;
  - запись в реестре (`registry.ts`) и в `RAW_TABLE` / `SOURCES`;
  - снятие 18+ в списках по итогам разведки;
  - фикстурные тесты: `test/inkstory.test.ts` → `test/inuko.test.ts` с фикстурами PureManga;
    `contract/live.test.ts` — PureManga.
- **API** (`apps/api`):
  - миграция `drizzle/0032_inuko_family.sql`:
    `UPDATE "source_accounts" SET "family" = 'inuko' WHERE "family" = 'inkstory';`
    (PK `(user_id, family)`, конфликтов нет);
  - `POST /source-accounts/inkstory/session` → `/source-accounts/inuko/session`, Swagger-описание;
  - сервисная учётка: переменная окружения для cookie сессии inuko, пример в `.env.example`.
- **Web** (`apps/web`):
  - `assets/sources/PUREMANGA.png` (favicon сайта) и `case SOURCE_ID.PUREMANGA` в `SourceIcon.tsx`;
  - `LinkInkStoryModal` → `LinkInukoModal`: семейство `INUKO`, ссылка на `source.domain` той
    строки, откуда открыли; story обновляется (`Модалки/…/LinkInukoModal`);
  - `getSourceAuthFamilyTitle`: `INUKO` → `'Inuko'`.

Другим пользователям ничего нового не видно: кеш списков общий, как у всех источников.

## Крайние случаи

| Случай                                                | Что видит пользователь                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Взрослые источники выключены в настройках             | PureManga скрыт, как другие источники с `isAdult` (существующий механизм)                     |
| Сервисной учётки нет или её сессия истекла            | Каталог и поиск без 18+, тайтлы по ссылке и главы открываются; в логе API предупреждение      |
| Сайт недоступен (ddos-guard, смена домена `v1.`)      | Источник `down` по пробнику, как у остальных; домен меняется одной строкой в `SOURCE_CATALOG` |
| Не найден `decryptionKey` в SSR                       | `ParseError`, страницы не грузятся — как у Inkstory сейчас                                    |
| Cookie не подошла ни к одному домену сети             | Ошибка под полем модалки (`SOURCE_LOGIN_FAILED`), как сейчас                                  |
| Cookie снята с PureManga, а импорт идёт с Inkstory    | Работает: `userId` общий, библиотека по `serviceName`                                         |
| Книга сайта «только в библиотеке» (`LIBRARY_ONLY`)    | Берётся по одной из `/v2/books/{id}`, как у Inkstory                                          |
| Аккаунт был привязан до миграции (`family: inkstory`) | После миграции он в группе «Inuko», ничего перепривязывать не нужно                           |

## Дизайн

Новых экранов нет. Меняется:

- **Профиль → аккаунты источников:** группа «Inkstory» становится группой **«Inuko»** с двумя
  строками, Inkstory и PureManga (сортировка по названию, как сейчас).
- **Модалка входа** — тон `neutral` с иконкой `SignInIcon`, как сейчас. Тексты прежние
  (`loginProtectedByCaptcha`, `openSiteInPrivateWindow`, `copyCookieValue`), меняются только сайт
  в ссылке и название в заголовке («Вход в Inuko»).
- Иконка PureManga — favicon сайта, цвет — его акцент.

| Понятие                   | Как называем в UI        |
| ------------------------- | ------------------------ |
| Сеть / семейство аккаунта | Inuko                    |
| Источник                  | PureManga                |
| Cookie сессии             | `__otaku_session` (моно) |

Таблицу модалок в `docs/11-ui-decisions.md` поправить: Inkstory → Inuko.

## Итоги разведки 18+ (2026-10-27, этап 1 — частично)

- `global-filters` сайт читает и пишет только через server functions TanStack Start
  (`createServerFn().middleware([…]).handler(…)`, схема `{ contentStatuses: min(1),
labelBlacklist: uuid[], preventUserAgentFiltering: boolean }`). В клиентских бандлах нет ни
  адреса `api.inuko.me`, ни заголовка `Authorization`: к API ходит только SSR-сервер сайта, и чем он
  представляется API, из браузера не видно.
- `preventUserAgentFiltering` — поле пользователя: оно лежит в SSR у объектов профилей (у одних
  `!0`, у других `!1`).
- Гость в API: `contentStatus=EROTIC` и `PORNOGRAPHIC` → `[]`, `SAFE` → данные; у PureManga
  `x-estimated-total-hits: 836`. Живой парсер: из 40 популярных — 31 `safe`, 9 `suggestive`.
- **Не проверено:** гипотеза 1 (нужна учётка inuko с cookie сессии, её у разведки не было) и
  гипотеза 3 (запросы с другим User-Agent и Origin заблокировал инструмент агента). Этап 4 не
  начат: списки обоих сайтов пока без 18+, как и до задачи.

## Этапы реализации

1. **Разведка 18+** (без кода в репозитории): что снимает фильтр `global-filters` в API и как
   его поставить сервисной учётке. Итог записать в план и в `docs/03-parsers.md`. От него зависит
   этап 4.
2. **Контракты:** `SOURCE_ID.PUREMANGA`, `SOURCE_CATALOG.puremanga`, `SOURCE_AUTH_FAMILY.INUKO`.
3. **Парсеры, фабрика:** перенос движка в `sources/inuko` без изменения поведения Inkstory,
   конфиг PureManga, реестр, `linkSession` по доменам семейства. Тесты Inkstory должны пройти
   без правок фикстур; добавить фикстуры PureManga.
4. **Парсеры, 18+:** сервисная учётка или SSR-каталог по итогам этапа 1.
5. **API:** миграция `0032`, путь `/source-accounts/inuko/session`, env сервисной учётки, тесты
   source-accounts.
6. **Web:** иконка, `SourceIcon`, `LinkInukoModal` и story, название семейства, i18n при
   необходимости (`pnpm lint:i18n`).
7. **Docs.**

Этапы 2–3 и 5–6 не ждут разведки.

## Затронутые docs

- `docs/03-parsers.md`: движок inuko, PureManga в таблицах источников и главной, разведка 18+.
- `docs/04-api-contract.md`: семейство `inuko`, путь сессии, вход по любому домену сети.
- `docs/11-ui-decisions.md`: таблица модалок, Inkstory → Inuko.
- `docs/08-roadmap.md`, `docs/12-todo.md`: если там упомянут PureManga или сайты сети.

## Открытые вопросы

- **Механизм `global-filters`** — решает разведка, этап 1. От него зависит, сервисная учётка это
  или SSR-каталог.
- **Стабильность домена `v1.puremanga.me`.** Голый `puremanga.me` отвечает 404, похоже на
  зеркало. Проверить на этапе 3, нет ли основного домена, и при необходимости поправить
  `domains`.
- **Одна ли cookie на сеть.** Если SSO выдаёт сессию сразу на все сайты, перебор доменов в
  `linkSession` можно упростить. Узнаем при живой проверке входа.

## Отвергнутые идеи

- **Параметр `serviceName` у `createInkStoryParser` без выноса движка** — Inkstory остался бы
  «главным» сайтом, а остальные сайты сети — его вариантами. Фабрика с конфигами, как у Grouple,
  честнее и готова к hexnovels, selftoon и прочим.
- **Своё семейство аккаунта для PureManga** — аккаунт в сети один (`userId` общий), две привязки
  дублировали бы друг друга.
- **Оставить ключ `'inkstory'` у семейства** — тогда группа сети называлась бы именем одного из
  её сайтов. Миграция — одна строка SQL.
- **Списки от аккаунта зрителя** — без привязки 18+ не было бы видно совсем, а кеш списков стал
  бы личным. Сервисная учётка даёт одинаковый каталог всем.
- **Выпустить без 18+ в списках** — хентай-источник без взрослого в каталоге бессмыслен.
- **Песочница** — визуальных развилок нет, модалка проверяется в Storybook.
