# Перевод парсеров с Kotlin-сайдкара на TypeScript

## Context

Сейчас парсинг источников живёт в `apps/parsers` — Ktor-сервис на JVM (~700 строк обвязки),
который линкует GPL-библиотеку `Gabageba/tanuki-parsers-redo` (форк kotatsu-parsers) и отдаёт
BFF'у сериализованные доменные объекты по HTTP. Библиотека даёт ~1000 источников.

Почему меняем: из этой тысячи нужны только русские — 23 источника. Все текущие патчи форка
(LibSocial, DesuMe, Grouple) написаны нами, а не прилетели из апстрима, то есть довод «за нас
чинят чужие руки» на RU-источниках уже не работает. Остаётся только цена: второй рантайм
(Gradle, JVM toolchain, JitPack, отдельный Dockerfile, два CI-джоба) ради источников, которыми
не пользуемся.

Результат: `packages/parsers` — TS-библиотека, импортируемая **в процесс** `apps/api`.
JVM-сайдкар удаляется целиком.

### Принятые решения

| Решение            | Выбор                                                                                                                                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Рантайм            | Пакет в процессе api (`packages/parsers`), без HTTP-хопа                                                                                                                                                                                                                                                 |
| Сайдкар            | Удаляется, без слоя роутинга на два рантайма                                                                                                                                                                                                                                                             |
| Источники          | Все 23 RU-источника, но это **14 движков**, а не 23 парсера                                                                                                                                                                                                                                              |
| Происхождение кода | Порт логики из Kotlin-форка                                                                                                                                                                                                                                                                              |
| Лицензия           | **GPLv3 на весь репозиторий** — перевод на другой язык это производная работа, а in-process импорт тянет её на `apps/api`. Обязательства возникают только при распространении, сетевой вызов GPLv3 не протягивает. Требует правки таблицы в `docs/09-legal.md:11-15`, которая сейчас утверждает обратное |

### 23 источника = 14 движков

Общие движки (1 движок → много источников):

- **Grouple** (`GroupleParser.kt`, 733 стр.) → READMANGA_RU, MINTMANGA, SELFMANGA, SEIMANGA, USAGI, ALLHENTAI
- **LibSocial** (`LibSocialParser.kt`, 466) → MANGALIB, HENTAILIB, YAOILIB
- **Chan** (`ChanParser.kt`, 273) → MANGACHAN, HENCHAN, YAOICHAN

Одиночные: REMANGA(378), DESUME(405), NUDEMOON(196), ACOMICS(185), COMX(242), MANGABUFF(397),
MANGA_WTF(273), SENKURO(691, GraphQL), TOMILOLIB(430), WAMANGA(148), ZENMANGA(490).

Проверено по форку: **ни один** из 23 не использует `evaluateJs` и не расшифровывает картинки —
headless-браузер не нужен. Четырём нужны интерцепторы запросов: Grouple, LibSocial, Remanga,
TomiloLib.

### Побочная находка: пагинация в сайдкаре сломана

`Routes.kt` создаёт `newParserInstance` на каждый запрос, поэтому мемо-таблица в
`Paginator.getPage()` всегда пуста и всегда срабатывает арифметическая ветка
`intPage + firstPage + (tail == 0 ? 0 : 1)`. Для Desu (pageSize 24) на странице 1
(`offset=20`): `intPage=0, tail=20` → нативная страница 2 → элементы 24..47, **элементы 20..23
теряются**. У Grouple `offset upBy 50` округляет 20 вверх до 50 — теряются элементы 20..49.
Порт это чинит (§ «Пагинация»), а не воспроизводит.

---

## Архитектура `packages/parsers`

```
packages/parsers/
  LICENSE                 # GPLv3
  src/
    index.ts              # единственная точка экспорта
    types.ts              # RawManga/RawChapter/RawPage/RawTag/RawSourceInfo — новый источник истины
    errors.ts             # иерархия ParserError, без зависимости от @nestjs/common
    registry.ts           # SOURCE_IDS, SourceIdSchema, SOURCES, createRegistry()
    core/
      parser.ts           # интерфейс Parser, ParserContext, ListParams
      paging.ts           # planWindow / fetchPaged / fetchOffsetNative
      uid.ts              # generateUid
      http/{client,cookies,classify,decompress,user-agents}.ts
      html/{dom,selectors,urls}.ts
      text/{dates,strings,numbers}.ts
    sources/
      grouple/{engine,auth,config}.ts
      libsocial/{engine,config}.ts
      chan/{engine,config}.ts
      desu/  remanga/  ...  # 11 одиночных
  test/                   # фикстурные тесты + conformance
  contract/               # живые контрактные тесты (только ночью)
```

### Интерфейс `Parser`

```ts
export interface Parser {
  readonly id: SourceId;
  readonly info: RawSourceInfo; // статика, без сети
  getList(params: ListParams): Promise<RawManga[]>; // chapters ОБЯЗАН быть null
  getDetails(url: string): Promise<RawManga>; // chapters заполнены
  getPages(chapterUrl: string): Promise<RawPage[]>; // url абсолютный, преразрешённый
  imageHeaders(imageUrl: string): Record<string, string>;
  init?(): Promise<void>; // разовый прогрев (SSO Grouple)
  close?(): Promise<void>;
}
```

**Общие движки — фабрика с конфигом, а не базовый класс.** В Kotlin наследование было
вынужденным: KSP-аннотация `@MangaSourceParser` требует по классу на элемент enum, поэтому
`MintMangaParser.kt` и `ReadmangaParser.kt` — это по 20 строк, где вся разница в `siteId`,
`domains` и одном заголовке. Это данные, притворяющиеся типом. В TS такого ограничения нет,
а конфиги ещё и перечисляемы — реестру нужно обойти все 23 источника, не инстанцируя их.

```ts
export function createGroupleParser(cfg: GroupleConfig, ctx: ParserContext): Parser;
```

Поведенческие отличия внутри семейств (альтернативный SSO-шлюз `qawa.org` у AllHentai,
ремап 404→AuthRequired у MangaLib) выражаются полями конфига, а не переопределением методов.

### Реестр источников

Одна таблица `Record<SourceId, SourceDescriptor>` — пропущенный источник становится ошибкой
компиляции. Дескриптор несёт `info` (то, что возвращает `listSources()`), `domains`,
`cookieScope`, `defaultHeaders`, `paging` и фабрику `create`.

`title`/`locale`/`contentType`/`isBroken` берём дословно из сгенерированного enum'а форка:
`tanuki-parsers-redo/build/generated/ksp/main/kotlin/.../MangaSource.kt` (включая русские
названия и `isBroken: true` у ZENMANGA, HENTAILIB, ACOMICS — `sources.service.ts:26` уже
маппит это в `status: 'down'`).

`sortOrders` и флаги возможностей поднимаются из инстанса парсера в дескриптор — в Kotlin это
были свойства инстанса, из-за чего `/sources` инстанцировал все парсеры подряд. Теперь
`listSources()` бесплатен, что важно: `sources.service.ts` лежит на горячем пути каждого поиска.

Экспорт `SourceIdSchema` даёт валидацию `ENABLED_SOURCES` на старте — сегодня опечатка в этом
списке молча даёт источник, который нигде не появляется.

### HTTP-слой

`undici` + `cheerio` + `tough-cookie` + `iconv-lite`. Обёртка над `undici.request`, а не
над Dispatcher-интерцепторами (те лежат ниже редиректов и кук — не тот уровень). Обёртка обязана:

1. **Свой цикл редиректов** (max 10) со сбором кук **на каждом хопе** — встроенный редирект undici проглотит промежуточный `Set-Cookie`, а `InMemoryCookieJar.kt:24-28` специально мержит куки именно ради антибот-кук на промежуточных хопах.
2. **Декомпрессию** — `undici.request` её не делает; `img-proxy.controller.ts:52-65` уже наступил на это с `static.desu.uno` за ddos-guard. Хелпер переезжает в `core/http/decompress.ts`, img-proxy импортирует его оттуда.
3. **Перекодировку charset** — MANGACHAN/HENCHAN/YAOICHAN/NUDEMOON это DLE-сайты на **windows-1251**. `.text()` молча даст мохнатую кашу без единой ошибки.
4. **Классификацию ошибок** на каждом ответе.

**Интерцепторы: ~40 строк `ThreadLocal` + кастомного `AbstractExecutorService` из
`TanukiMangaLoaderContext.kt:73-104` просто исчезают.** Они существовали только потому, что
OkHttp гоняет цепочку на диспетчерском потоке, не знающем, какой парсер вызывает. В Node
парсер владеет своим `HttpClient` и регистрирует `use(...)` при создании. Это крупнейшее
упрощение всего порта.

**Куки — по семействам, не по процессу и не по источнику.** Общая на процесс (как в Kotlin)
протекает сессией из одного сайта в 22 чужих. По одной на источник тоже неверно:
MANGALIB/HENTAILIB/YAOILIB ходят на **один** хост `api.cdnlibs.org`, различаясь только
заголовком `Site-Id` — три отдельные сессии к одному хосту означают лишние челленджи.
Поле `cookieScope` в дескрипторе решает это одной строкой.

Фан-аут `gwt`-куки Grouple **остаётся** (разные регистрируемые домены, никакой атрибут `Domain`
их не покроет), но список доменов выводится из `GROUPLE_CONFIGS.flatMap(c => c.domains)` и не
может разъехаться — сегодня захардкоженный массив в `GroupleAuth.kt:15-26` уже потерял seimanga
и usagi. Логин выполняется один раз на старте в `init()`, а не на каждый запрос.
`RemangaParser.copyCookies()` при этом удаляется — tough-cookie матчит `api.remanga.org` по
доменному правилу сам.

### Пагинация

Без состояния, корректно:

```ts
export function planWindow(offset, limit, size, firstPage = 1): { pages: number[]; skip: number };
export async function fetchPaged(params, cfg, fetchPage): Promise<RawManga[]>; // page-native
export async function fetchOffsetNative(params, cfg, fetchOffset): Promise<RawManga[]>;
```

Забираем **все** нативные страницы, покрывающие окно `[offset, offset+limit)`, и режем срез.
Максимум 2 обращения наверх на страницу API; кеш в `ParsersClientService.listManga` ключуется
по странице API, так что второе обращение амортизируется. Нативные размеры (сверено по форку):
Grouple 50 (offset-native), LibSocial 60, Zen 30 (`firstPage: 0`), Desu/MangaBuff/TomiloLib 24,
Remanga/ComX/MangaWtf/WaManga/Senkuro 20, AComics 10; Chan и NudeMoon — offset-native.

### Идентификаторы

FNV-1a, маскированный до 53 бит (`Number.MAX_SAFE_INTEGER`). Kotlin'овский `31*h+c` даёт
полный 64-битный Long, который не переживает JS `number`, а его обрезание убивает и без того
слабое распределение. Совместимость с kotatsu не требуется (opaque id эфемерны до релиза), но
**детерминированность между рестартами обязательна**: `catalog.service.ts:85` ищет
`siblings.findIndex(ch => ch.id === chapterRef.id)`, где `chapterRef.id` пришёл от клиента из
более раннего запроса, возможно из другого процесса. Ключ хеша — собственный числовой id сайта,
если есть, иначе относительный URL. Никогда не заголовок и не индекс в массиве.

Смена хеш-функции инвалидирует все выданные opaque id — поэтому делается **сейчас**, до появления
сохраняемых пользовательских данных.

---

## Фазы

Порядок по рычагу (источников на движок). Каждая фаза — отдельный PR со своими фикстурами.

| Фаза  | Движки                                      | Источников | Итого      |
| ----- | ------------------------------------------- | ---------- | ---------- |
| **1** | **core** + Grouple + Desu                   | 6 + 1      | **7 / 23** |
| 2     | LibSocial + Chan                            | 3 + 3      | 13 / 23    |
| 3     | Remanga, MangaBuff, MangaWtf, ZenManga      | 4          | 17 / 23    |
| 4     | ComX, TomiloLib, WaManga, NudeMoon, AComics | 5          | 22 / 23    |
| 5     | Senkuro (GraphQL, 691 стр.)                 | 1          | 23 / 23    |

### Что обязано войти в фазу 1

Сайдкар — единственное, что сейчас держит приложение живым, поэтому у фазы 1 жёсткий гейт:

1. **Полный `core/`** — `HttpClient` (редиректы + куки + декомпрессия + charset), `errors.ts`, `classify.ts`, `paging.ts`, `uid.ts`, `html/`, `text/dates.ts`. Без срезания углов: `dates.ts` и charset — ровно то, что пропускают и потом больно доделывают.
2. **Реестр со всеми 23 дескрипторами**, но `create` реализован у 7. Остальные 16 получают `create: notImplemented(id)` и `isBroken: true`. Тогда `listSources()` полон с первого дня, `sources.service.ts` не меняется вообще, а UI показывает полный список источников с честным `status: 'down'` — это уже смоделированное состояние, а не поломка.
3. **Grouple + Desu**, проходящие и фикстурные, и живые контрактные тесты.
4. **`ENABLED_SOURCES` сужен** до этих 7 в `.env.example`.
5. **Замена шва в `apps/api` и удаление сайдкара — в том же PR**, чтобы `master` никогда не был в состоянии, где `PARSERS_URL` указывает в пустоту.

Grouple и Desu выбраны не случайно: DESUME — текущий дефолт `ENABLED_SOURCES` (`env.ts:11`) и
P0-источник вертикального среза, без него dev-окружение мертво. Grouple — 6 источников с одного
движка, ничего близкого в списке нет. Вместе это 30% каталога за 2 движка из 14.

---

## Изменения в `apps/api`

### Меняется

**`parsers-client.service.ts`** — единственная содержательная правка. Убираем `undici`,
`PARSERS_URL`, `looksLikeAntibotChallenge` и весь `httpGet`. Инжектим реестр.
**Публичные сигнатуры `getSources`/`listManga`/`getDetails`/`getPages` остаются побайтово теми
же**, `fetchCached`/`guardedFetch` не трогаются — кеш, breaker и лимитер не затронуты вообще.
Появляется приватный `call()` — единственное место, где `ParserError` превращается в
HTTP-исключение. `offset: page * PAGE_SIZE` считается теперь здесь, а не в `Routes.kt:73`.

**`parsers-client.types.ts`** — тела интерфейсов заменяются ре-экспортом из `@tanuki/parsers`,
чтобы импорты в остальных файлах не менялись. `normalize.ts` и `catalog.service.ts` остаются
нетронутыми, как и требовалось.

**`config/env.ts`** — убрать `PARSERS_URL`; `ENABLED_SOURCES` пропустить через
`z.array(SourceIdSchema)`; добавить `GROUPLE_USERNAME`/`GROUPLE_PASSWORD` (переезжают из
`apps/parsers/.env.example`) и `SOURCE_HTTP_TIMEOUT_MS`.

**`img-proxy/source-domains.ts`** — захардкоженная карта из 2 записей заменяется делегированием
в реестр. Комментарий в файле сам говорит «расширяется по мере подключения источников»; при 23
источниках ручная карта гарантированно разъедется, а парсер и так знает свой домен и UA
(Grouple нужен и специфичный `Referer`, и Arora-UA на запросах картинок).

**`img-proxy/img-proxy.controller.ts`** — использовать заголовки из реестра; декомпрессию взять
из `@tanuki/parsers`.

**`package.json`** — добавить `@tanuki/parsers` и скрипт `test`. `undici` остаётся (img-proxy
использует напрямую).

### Добавляется

**`parsers-client/parsers.provider.ts`** — DI-провайдер, создающий реестр из env и вызывающий
`registry.init()` (Grouple SSO; `allSettled`, падение логируется, не бросается), плюс
`OnApplicationShutdown` → `registry.close()`.

**`parsers-client/parser-error.mapper.ts`** — замена status-code-лестницы из `httpGet`:
чистый маппинг `ParserError` → исключения из `common/errors.ts`, без эвристик.

### Удаляется

**`parsers-client/antibot-detection.ts`** → переезжает в `core/http/classify.ts`. Это прямой ответ
на вопрос «где живёт классификация»: **внутри HTTP-клиента пакета, на каждом ответе наверх**,
потому что только этот слой видит настоящие `Server: cloudflare` / `cf-ray` и настоящее тело
челленджа. В нынешней архитектуре `apps/api` нюхает Ktor'овский конверт `{"error": "..."}` на
маркеры Cloudflare — то есть сработать корректно практически не может. Переезд чинит скрытый
баг, а не просто меняет путь файла. Эвристика переносится как есть, плюс маркеры `ddos-guard`.

### Вне `apps/api`

- **`apps/parsers/`** — удалить целиком (Gradle, Dockerfile, `.env`, `isrg-root-ye.pem`, Ktor-приложение, `SourceContractTest.kt`).
- **`docker-compose.yml`** — убрать сервис `parsers`.
- **`.github/workflows/ci.yml`** — убрать джоб `parsers-compile`, добавить `test` (`pnpm turbo run test`).
- **`.github/workflows/parsers-nightly.yml`** — переписать с Gradle/JDK на `pnpm --filter @tanuki/parsers test:contract`.
- **Документация** — `docs/03-parsers.md` переписать существенно (раздел «Почему JVM-сайдкар, а не порт на TypeScript» устарел целиком); `docs/09-legal.md:11-15` (таблица лицензий теперь говорит обратное истине); `docs/02-tech-stack.md`, `docs/08-roadmap.md`, `README.md`.

---

## Тесты

В репозитории сейчас **ноль** тестов в `apps/api`; `turbo.json` объявляет задачу `test`, которую
никто не реализует. Раннер — **vitest**.

Нужны оба слоя, они отвечают на разные вопросы. Фикстурные отвечают «не сломал ли я парсер
рефакторингом» — детерминированы, гоняются на каждом PR. Живые контрактные отвечают «не сменил
ли сайт вёрстку ночью» — это и есть настоящий режим отказа парсеров, и фикстурами он не ловится
в принципе. В Kotlin был только второй слой, поэтому поломка `getDetails` рефакторингом
оставалась незамеченной до суток.

1. **Фикстурные (`test/`, на каждый PR).** `test/support/fake-http.ts` реализует `HttpClient`
   поверх записанных HTML/JSON. Главный рычаг — параметризованный `conformance.spec.ts`, один
   набор инвариантов, который обязан пройти каждый источник: `chapters === null` в списке и
   заполнены в деталях; `rating === -1 || 0 <= rating <= 1` (**не** 0..10); `url` относительный,
   `publicUrl` абсолютный; `Number.isSafeInteger(id)`; id глав уникальны;
   `uploadDate === 0 || uploadDate > 1e12` (миллисекунды, не секунды — классический баг порта,
   а `normalize.ts:82` кормит это прямо в `new Date()`); страницы 0 и 1 не пересекаются
   (ловит ту самую дыру пагинации); снапшот id для стабильности.
2. **Точечные юниты** на `planWindow` (таблично по всем 8 размерам страниц), `generateUid`
   (стабильность + отсутствие коллизий на 100k ключей), `classify.ts` (фикстуры: реальное тело
   Cloudflare 503, ddos-guard, честная 500), парсер русских дат.
3. **Живые контрактные (`contract/`, ночью)** — порт `SourceContractTest.kt` той же формы
   (`getList` → `getDetails(первый)` → `getPages(первая глава)`), но по всем реализованным
   источникам, с `allSettled`, чтобы один мёртвый сайт не маскировал остальные.
4. **`apps/api`** — минимум `normalize.spec.ts` (обработка сентинелов, группировка веток) и
   `opaque-id.spec.ts`. Это чистые функции, которые по условию обязаны остаться неизменными —
   тесты и есть способ это доказать во время замены.

---

## Проверка

1. `pnpm turbo run typecheck lint` — зелено во всём воркспейсе.
2. `pnpm --filter @tanuki/parsers test` — фикстурные + conformance зелёные для 7 источников фазы 1.
3. `pnpm --filter @tanuki/parsers test:contract` — живой прогон по Grouple и Desu; MINTMANGA/SELFMANGA ожидаемо требуют `GROUPLE_USERNAME`/`GROUPLE_PASSWORD` (см. `docs/03-parsers.md:190-216`).
4. `docker compose up` поднимает только valkey и postgres, сервиса `parsers` больше нет.
5. `pnpm --filter @tanuki/api dev` стартует **без** `PARSERS_URL` в окружении; в логах видно, что Grouple SSO отработал или честно предупредил об отсутствии кред.
6. Ручной e2e через web: каталог DESUME грузится, **страница 2 продолжает страницу 1 без разрыва** (это регрессия-проверка на найденный баг пагинации), карточка тайтла открывается с обложкой, список глав с ветками, читалка отдаёт страницы, prev/next между главами работает.
7. `GET /sources` возвращает все 23 источника, из них 16 со `status: 'down'`.
8. Проверить, что обложки и страницы реально грузятся через img-proxy (заголовки `Referer`/UA теперь приходят из реестра, а не из захардкоженной карты).

---

## Риски

**Блокировка event loop в `/search`.** `SearchService` веером опрашивает все search-способные
источники. Раньше этот параллелизм уезжал на JVM в отдельный процесс; теперь синхронный разбор
cheerio (~5–30 мс на страницу каталога) идёт на event loop, до 23 раз одновременно. На 7
источниках фазы 1 это терпимо (~200 мс худший случай), на 23 вылезет в p99 **чужих** запросов.
Смягчение по порядку: существующий `ConcurrencyLimiterService` оставить; предпочитать JSON-парсеры
в веере поиска; если прижмёт — унести разбор в пул `node:worker_threads` за тем же интерфейсом
`Parser`. Под это закладываемся уже сейчас, держа вход и выход парсеров structured-clonable
(байты внутрь, plain-объекты `Raw*` наружу) — предложенный интерфейс это уже соблюдает.
**Пул воркеров в фазе 1 не строим.**

**Лицензия.** См. таблицу решений — требует правки `docs/09-legal.md`, которая сейчас
утверждает противоположное. Решение необратимо в одну сторону: вернуться к проприетарной
лицензии после порта можно только переписыванием.
