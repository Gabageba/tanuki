# 03 — Слой парсеров

## Итог: свой TS-пакет, а не JVM-сайдкар поверх kotatsu

До июля 2026 парсинг источников жил в `apps/parsers` — Ktor-сервис на JVM, линковавший форк
`kotatsu-parsers-redo` (~1000 источников на десятках языков) и отдававший BFF (`apps/api`)
сериализованные доменные объекты по HTTP.

Причина отказа от этой схемы простая: из тысячи источников библиотеки нужны только русские —
23 штуки. «Кто-то другой чинит парсер, когда сайт меняет вёрстку» — вот единственный
содержательный довод в пользу внешней библиотеки — на практике не работал даже для этих 23:
все патчи, когда-либо влившиеся в форк (`LibSocialParser`/MangaLib, `DesuMeParser`, RU-фиксы
`GroupleParser`), были написаны нами же, а не пришли из апстрима. Оставалась только цена: второй
рантайм (Gradle, JVM toolchain, JitPack, отдельный Dockerfile, два CI-джоба) ради 977 источников,
которыми никто не пользуется.

**Текущая архитектура: `packages/parsers` — TS-библиотека, импортируемая в процесс `apps/api`.**
Никакого HTTP-хопа, никакого второго рантайма. `apps/api/src/parsers-client/parsers-client.service.ts`
держит реестр парсеров (`ParsersRegistry` из `@tanuki/parsers`) и вызывает его методы напрямую;
кеш, circuit breaker и rate-limiter (см. «Устойчивость» ниже) работают точно так же, как раньше,
просто оборачивают прямой вызов вместо HTTP GET.

Логика самих 23 парсеров — **порт** соответствующего кода из
[`Kotatsu-Redo/kotatsu-parsers-redo`](https://github.com/Kotatsu-Redo/kotatsu-parsers-redo)
(и нашего форка `Gabageba/tanuki-parsers-redo` поверх него) на TypeScript, а не переписывание с
нуля по вёрстке сайтов — там годами накоплено знание вида «Desu переехал на XenForo и `/manga/
api/` отдаёт 410», «SelfManga 301-редиректит на `1.selfmanga.live`», которое дороже всего
переоткрывать заново. Поскольку это перевод GPLv3-кода на другой язык, весь репозиторий теперь
распространяется под GPLv3 — детали в [09 — Правовые аспекты](09-legal.md).

## Архитектура `packages/parsers`

```
packages/parsers/
  LICENSE                 # GPLv3
  src/
    index.ts              # единственная точка экспорта
    types.ts              # RawManga/RawChapter/RawPage/RawTag/RawSourceInfo
    errors.ts              # иерархия ParserError (framework-free)
    registry.ts            # SOURCE_IDS, SOURCES, createRegistry()
    core/
      parser.ts            # интерфейс Parser, ParserContext, ListParams
      paging.ts             # planWindow / fetchPaged / fetchOffsetNative
      uid.ts                 # generateUid (FNV-1a, стабилен между рестартами)
      http/                  # свой HttpClient поверх undici: редиректы + куки + декомпрессия
      html/                  # cheerio-обёртка (dom, selectors, urls)
      text/                  # RU-даты, строки, числа
    sources/
      grouple/              # 1 движок → READMANGA_RU, MINTMANGA, SELFMANGA, SEIMANGA, USAGI, ALLHENTAI
      desu/                  # DESUME
      ...                    # остальные 16 движков по мере портирования
  test/                     # фикстурные тесты + conformance-набор (каждый PR)
  contract/                 # живые контрактные тесты (только ночной CI)
```

### Интерфейс `Parser`

```ts
export interface Parser {
  readonly id: string;
  readonly info: RawSourceInfo; // статика, без сети
  getList(params: ListParams): Promise<RawManga[]>; // chapters ОБЯЗАН быть null
  getDetails(url: string): Promise<RawManga>; // chapters заполнены
  getPages(chapterUrl: string): Promise<RawPage[]>; // url абсолютный, преразрешённый
  imageHeaders(imageUrl: string): Record<string, string>;
  init?(): Promise<void>; // разовый прогрев (SSO Grouple)
  close?(): Promise<void>;
}
```

Источники с общим движком (Grouple, LibSocial, Chan) реализованы как **фабрика с конфигом**
(`createGroupleParser(config, ctx)`), а не через наследование — в Kotlin один класс на источник
был вынужденной мерой (KSP-аннотация `@MangaSourceParser` требует по классу на элемент enum),
в TS такого ограничения нет, а конфиги ещё и перечисляемы, что важно для реестра.

### Реестр источников

`packages/parsers/src/registry.ts` — одна таблица `Record<SourceId, SourceDescriptor>` на все
22 источника. У источника, для которого `create` ещё не реализован, `isBroken: true`
(независимо от того, что говорит апстрим kotatsu) — это честно отражается в `/sources` как
`status: 'down'`, а не как ошибка. `title`/`contentType`/родной kotatsu-флаг `isBroken` для
каждого источника взяты дословно из сгенерированного enum'а форка
(`tanuki-parsers-redo/build/generated/ksp/.../model/MangaSource.kt`).

### HTTP-слой

Свой `HttpClient` поверх `undici.request` (не поверх Dispatcher-интерцепторов — те лежат ниже
редиректов и кук). Обязанности, которых нет в `undici.request` из коробки:

1. **Свой цикл редиректов** со сбором кук на каждом хопе — антибот-кука на промежуточном хопе
   не должна теряться.
2. **Декомпрессия** — `undici.request()`, в отличие от `fetch()`, не распаковывает тело по
   `Content-Encoding` сама.
3. **Charset** — DLE-сайты (MANGACHAN, HENCHAN, YAOICHAN, NUDEMOON) отдают **windows-1251**;
   декодирование как UTF-8 даёт кашу без единой ошибки, поэтому charset сначала сниффится из
   `Content-Type`, потом из `<meta charset>`.
4. **Классификация ошибок** каждого ответа в `ParserError` — включая антибот-эвристику
   (`core/http/classify.ts`), которая теперь смотрит на **настоящий** ответ источника, а не на
   JSON-конверт бывшего сайдкара.

**Куки — по семействам, не по процессу и не по источнику.** Общая на процесс кука протекает из
одного сайта в 22 чужих; отдельная кука на источник тоже неверна для MANGALIB/HENTAILIB/YAOILIB —
все три ходят на один хост `api.cdnlibs.org`, различаясь только заголовком `Site-Id`. Поле
`cookieScope` в дескрипторе источника решает это одной строкой.

Grouple-сеть (ReadManga/MintManga/SelfManga/SeiManga/Usagi) логинится через общий SSO-шлюз
`3.grouple.co` при старте процесса (`GROUPLE_USERNAME`/`GROUPLE_PASSWORD`, опционально — без них
источники работают анонимно), а полученная `gwt`-кука раскладывается по доменам всех источников
сети (`packages/parsers/src/sources/grouple/auth.ts`) — список доменов выводится из конфига
источников, а не хардкодится отдельно. AllHentai использует отдельный SSO-шлюз (`qawa.org`) со
своей учёткой (`ALLHENTAI_USERNAME`/`ALLHENTAI_PASSWORD`) и логинится отдельным вызовом —
общими Grouple-кредами не покрывается, но получаемая с `qawa.org` кука раскладывается по
доменам AllHentai тем же способом.

### Пагинация

`core/paging.ts`: `planWindow`/`fetchPaged`/`fetchOffsetNative` без внутреннего состояния —
на каждый вызов `getList({offset, limit})` вычисляют, какие нативные страницы источника
покрывают запрошенное окно, и режут точный срез. Максимум 2 обращения наверх на страницу API
(кроме источников с нативным размером страницы ≥ лимита — там всегда 1).

### Идентификаторы

`core/uid.ts`: FNV-1a, маскированный до 53 бит. Совместимость с kotatsu не нужна (opaque id
эфемерны до релиза), но стабильность между рестартами процесса обязательна — `catalog.service.ts`
на BFF матчит соседние главы по `id`, пришедшему от клиента в более раннем запросе.

## Русские источники: движки и статус

22 источника = **14 движков** (проверено по форку `tanuki-parsers-redo`). Ни один из них не
использует `evaluateJs` и не расшифровывает картинки — headless-браузер не нужен.

| Движок            | Источники                                                                 | Статус        |
| ----------------- | ------------------------------------------------------------------------- | ------------- |
| Grouple           | READMANGA_RU, MINTMANGA, SELFMANGA, SEIMANGA, USAGI, ALLHENTAI            | ✅ портирован |
| Desu (standalone) | DESUME                                                                    | ✅ портирован |
| LibSocial         | MANGALIB, HENTAILIB, YAOILIB                                              | ✅ портирован |
| Chan              | MANGACHAN, HENCHAN, YAOICHAN                                              | ✅ портирован |
| standalone        | REMANGA, NUDEMOON, ACOMICS, COMX, MANGABUFF, INKSTORY, TOMILOLIB, WAMANGA | ✅ портирован |
| Senkuro (GraphQL) | SENKURO, SENKOGNITO                                                       | ✅ портирован |

MANGA_WTF и ZENMANGA — один и тот же сайт под новым брендом (домен `inkstory.net`, ранее
`inkstory.me` — переехал в августе 2026), объединены в единый источник INKSTORY.

SENKOGNITO (`ne.senkognito.com`) — 18+ витрина Senkuro: тот же бэкенд и тот же каталог
(`api.senkognito.com` отдаёт ту же схему и те же данные, что `api.senkuro.com`), но показывает
именно те adult-метки, которые SENKURO отфильтровывает. Разнесены на два источника по образцу
MULTPORN / MULTPORN_HENTAI — один движок, два конфига (`sources/senkuro/config.ts`).

Все 22 источника (14 движков) реализованы. ACOMICS несут `isBroken: true`
унаследованно от апстримного kotatsu enum (не от качества самого порта) и потому отдаются как
`status: 'down'` через `/sources`, как и было бы у любого другого известно-неработающего
источника; `create` для них тем не менее реализован и покрыт фикстурными тестами. Реестр
по-прежнему сохраняет заглушку `notImplemented`/`NotImplementedError` как обработку на случай,
если новый источник добавят в `RAW_TABLE` раньше, чем портируют его логику.

INKSTORY больше не входит в этот список: сайт переехал на `inkstory.net`, но при этом сменил
поведение API — `/v2/books?sort=updatedAt,desc` сортирует по правке метаданных тайтла, а не по
дате новой главы, поэтому дефолтный порядок `UPDATED` теперь читает отдельную ленту
`/v2/chapter-update-feed?onlyBorderChapters=true` (как и сам сайт на главной странице); а
`/branch/{id}` заменён на `/v2/branches/{id}` (та же форма ответа). См.
`packages/parsers/src/sources/inkstory/index.ts`.

### Источники вне форка

`HENTAICHAN_CC` (`hentaichan.cc`) — не порт: сайта нет в `tanuki-parsers-redo`, это отдельный
современный Next.js-фронтенд (не DLE-движок старого HENCHAN/`hentaichan.live`, несмотря на
общий бренд). Каталог на самой странице догружается клиентским React Query-запросом, а не
рендерится на сервере, поэтому источник данных — не HTML-вёрстка, а бэкенд на Directus
(`backend.hentaichan.cc`, найден через `Content-Security-Policy: connect-src` фронтенда):
полностью публичный, нетребующий авторизации REST (`/items/<collection>`), обнаруженный и
описанный вручную, а не портированный из Kotlin. Один элемент каталога — один релиз
(one-shot или отдельная переведённая глава, не вся серия целиком): live-проверка показала
`chapters: 1` у 7035 из 7036 записей.

`SEXKOMIX2` (`sexkomix2.com`) — тоже не порт, обычная серверно-рендеренная PHP-вёрстка
(своя CMS, не DLE), обнаруженная и описанная вручную по разметке. Каталог (`li.comix`) и
пагинация (`/home/` и `/search/` с общими параметрами `sort=date|prosmotr|like&page=N`)
одинаковы для листинга и поиска. Как и NUDEMOON, один элемент каталога — один релиз
(единственная синтетическая глава на `getDetails`, без реального разбиения на главы).
Часть страниц галереи доступна только по VIP-подписке — анонимный `getPages` возвращает
столько страниц, сколько сайт отдаёт без авторизации (не всегда полный релиз), это не баг
парсера.

Разметка листинга содержит три (невалидных, задублированных) `<ul id="comix_directory">`:
VIP-промо-карусель, реальный постраничный каталог и виджет «Ещё комиксы»
(`#more_comics_directory`) — только средний из них соответствует `sort=`/`page=`, поэтому
`findCatalogList` берёт последний `<ul>` вне `#more_comics_directory` (на `/home` их два и
нужен второй, на `/search` карусели нет и нужен первый — «последний вне more_comics» верно
в обоих случаях). Внутри самого каталога один из 24 слотов `li.comix` на странице — всегда
рекламная вставка (`div.opt[data-asg-ins]` без `<a>`), поэтому фактический размер страницы
для `fetchPaged` — 23, а не 24; со значением 24 каждая страница ложно выглядела бы как
последняя и пагинация обрывалась на первой же странице.

`MULTPORN`/`MULTPORN_HENTAI` (`multporn.net`, общий движок `sources/multporn`) — тоже не порт:
не Drupal-сайт из форка, а обычная (немодифицированная) Drupal 7 Views-вёрстка, описанная
вручную. Сайт держит ~12 типов контента (Comics, Hentai manga, Cartoon/Hentai pictures, GIF,
видео, игры, ...) за одним экраном фильтров; из них модели `RawManga → chapters → pages`
соответствуют только Comics и Hentai manga (один узел = одна законченная работа с постраничной
галереей), поэтому это два раздельных `SourceId` на одном движке и домене — остальные типы не
реализованы. `getList` без поискового запроса бьёт в `/new?type=1|3&sort_by=created` (15 строк
на нативную страницу, `fetchPaged` с `firstPage: 0` — у Drupal-пейджера страницы с нуля); с
запросом — в общесайтовый `/search`, у которого **нет** фильтра по типу контента: одна нативная
страница (всегда 20 строк) мешает комиксы с видео/играми/т.п. в одном фиде. Поэтому `parseRow`
принимает `pathPrefix` (`/comics/` или `/hentai_manga/`) и отбрасывает чужие строки, а
`fetchSearchList` не переиспользует `fetchPaged`/`fetchOffsetNative` — его эвристика «короткая
страница = конец» смотрит на _отфильтрованное_ количество и обрывалась бы на первой же странице,
как только на ней преобладает другой тип; вместо этого код листает нативные страницы и
останавливается только когда сырых (до фильтра) строк меньше 20.

Разметка деталей и листинга частично расходится по названиям Views-полей между двумя типами
(`field-category` / `field-h-category` для тегов, `field-author` / `field-author-hentai` для
автора — оба вынесены в `MultpornConfig`), но галерея страниц всегда лежит в одном и том же
`field-com-pages` независимо от типа. Сама галерея отдаётся через виджет Juicebox, чья настоящая
разметка — `<noscript>` fallback «для устройств без JS»: htmlparser2 хранит содержимое
`<noscript>` как сырой текст, а не как дочерние элементы, поэтому `<img src>` вынимаются оттуда
регэкспом, а не обычным cheerio-селектором. Каждый `src` — уменьшенный Drupal image style
(`.../styles/juicebox_medium/public/<path>?itok=...`); обрезка `styles/<name>/public/` и
`?itok=` до оригинала подтверждена вживую (оригинал ~5x тяжелее превью, оба отдают 200).
Обложка и описание берутся не из этой галереи, а из `<meta property="og:image">`/`og:description`
(модуль metatag, отдаётся на каждой странице сайта) — на самих страницы деталей нет ни капли
даты публикации, поэтому `RawChapter.uploadDate` там всегда `0` (документированный сентинел
«неизвестно»), а не пробел в парсинге.

Особенность RU-источников — **ветки переводов**: у одного тайтла на ReadManga или MangaLib
бывает несколько команд перевода со своими нумерациями глав (`RawChapter.branch`). Модель
данных и UI это учитывают с самого начала, см. [04 — Контракт API](04-api-contract.md).

## Устойчивость

Парсеры ломаются — сайты меняют вёрстку и защиту раз в несколько недель, это норма, не инцидент.
Что есть в BFF с первого дня (не изменилось после перехода на TS — то же самое просто оборачивает
прямой вызов реестра, а не HTTP-запрос к сайдкару):

- **Circuit breaker на источник** (`apps/api/src/resilience/source-health.service.ts`). 5 ошибок
  подряд → источник помечается `degraded` на 10 минут.
- **Concurrency limiter на источник** — не больше N одновременных запросов к одному домену.
- **Stale-while-revalidate** в Valkey — протухший кеш лучше ошибки.
- **Живые контрактные тесты** (`packages/parsers/contract/`, ночной CI,
  `.github/workflows/parsers-nightly.yml`) — по одному проходу `getList → getDetails → getPages`
  на каждый портированный источник.

### Решение по антиботу

`packages/parsers/src/core/http/classify.ts` эвристически отличает антибот-челлендж
(Cloudflare/ddos-guard заголовки и тела ответа) от обычной недоступности источника и бросает
`SourceBlockedError` вместо `SourceUnavailableError` — честнее для мониторинга. В отличие от
сайдкар-версии, эта проверка теперь смотрит на **настоящий** ответ источника (сайдкар видел
только `{"error": "..."}`, в который Ktor заворачивал исключение парсера, и поэтому эвристика
практически не могла сработать).

### Grouple: авторизация

`GroupleParser` (в форке) считает, что логин требуется, если путь запроса оканчивается на
`/login`, либо приходит 404 без `gwt`-куки в jar'е — то есть любой настоящий 404 на Grouple-домене
без активной сессии тоже маскируется под ошибку авторизации. Порт (`sources/grouple/engine.ts`)
воспроизводит это поведение через HTTP-интерцептор.

Чтобы получить доступ к главам, требующим сессии (типично для MintManga/SelfManga), нужен
аккаунт на grouple.co (общий паспорт для всей сети) и `GROUPLE_USERNAME`/`GROUPLE_PASSWORD` в
`.env` — см. `.env.example`. Юридический риск скриптового логина под живым аккаунтом — см.
[09 — Правовые аспекты](09-legal.md).

AllHentai — особый случай: там 404 без сессии отдаёт не только страница логина, а весь каталог,
поэтому источник бесполезен без авторизации (`SOURCE_AUTH_REQUIRED` на любой запрос), а не
только деградирует на отдельных главах. Нужен отдельный аккаунт на `qawa.org` и
`ALLHENTAI_USERNAME`/`ALLHENTAI_PASSWORD` в `.env`.

## Тесты

Раннер — **vitest**. Два независимых слоя, отвечающих на разные вопросы:

- **Фикстурные + conformance (`packages/parsers/test/`, каждый PR).** Один параметризованный
  набор инвариантов, который обязан пройти каждый источник: `chapters === null` в списке и
  заполнены в деталях; `rating` либо `-1`, либо `0..1` (не `0..10`); `uploadDate` — миллисекунды
  или `0`; id глав уникальны и стабильны между рестартами; `RawPage.url` абсолютный.
- **Живые контрактные (`packages/parsers/contract/`, только ночной CI)** — реальные запросы к
  сайтам, `getList → getDetails → getPages` по каждому портированному источнику, с
  `allSettled`-семантикой: один мёртвый сайт не маскирует остальные.

`apps/api` тоже покрыт точечно — `common/normalize.test.ts` и `common/opaque-id.test.ts`
фиксируют сентинел-конвенции (`-1` → `null`, `0` → `null`, epoch-миллисекунды), которые обязаны
остаться неизменными независимо от того, что происходит на стороне парсеров.

## Как добавить источник

1. Найти соответствующий парсер в `tanuki-parsers-redo/src/main/kotlin/.../site/ru/`.
2. Если он — часть уже портированного движка (Grouple/LibSocial/Chan), добавить конфиг в
   `packages/parsers/src/sources/<engine>/config.ts` и обновить `RAW_TABLE` в `registry.ts`
   (`isImplemented: true`).
3. Если новый standalone-движок — создать `packages/parsers/src/sources/<id>/index.ts` с
   `create<Name>Parser(ctx): Parser`, портировать логику из Kotlin-файла один в один
   (селекторы, форматы дат, сентинелы), подключить в `registry.ts`.
4. Фикстурные тесты: записать реальный HTML/JSON в `test/fixtures/<ID>/`, добавить источник в
   параметризованный `conformance`-набор.
5. Добавить в `IMPLEMENTED_SOURCE_IDS` в `contract/live.test.ts`.
6. Убрать/добавить источник в `DISABLED_SOURCES` в `.env.example`, если он готов к использованию.
