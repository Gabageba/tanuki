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
23 источника. У источника, для которого `create` ещё не реализован, `isBroken: true`
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
источников, а не хардкодится отдельно. AllHentai использует отдельный SSO-шлюз (`qawa.org`) и
этими кредами не логинится.

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

23 источника = **14 движков** (проверено по форку `tanuki-parsers-redo`). Ни один из них не
использует `evaluateJs` и не расшифровывает картинки — headless-браузер не нужен.

| Движок            | Источники                                                                            | Статус                      |
| ----------------- | ------------------------------------------------------------------------------------ | --------------------------- |
| Grouple           | READMANGA_RU, MINTMANGA, SELFMANGA, SEIMANGA, USAGI, ALLHENTAI                       | ✅ портирован               |
| Desu (standalone) | DESUME                                                                               | ✅ портирован               |
| LibSocial         | MANGALIB, HENTAILIB, YAOILIB                                                         | ⏳ фаза 2                   |
| Chan              | MANGACHAN, HENCHAN, YAOICHAN                                                         | ⏳ фаза 2                   |
| standalone        | REMANGA, NUDEMOON, ACOMICS, COMX, MANGABUFF, MANGA_WTF, TOMILOLIB, WAMANGA, ZENMANGA | ⏳ фаза 3–4                 |
| Senkuro (GraphQL) | SENKURO                                                                              | ⏳ фаза 5, наименьший рычаг |

Пока источник не портирован, `SOURCES[id].create` возвращает заглушку, бросающую
`NotImplementedError` на любой вызов — `/sources` показывает его честно как `status: 'down'`,
без падений на остальных.

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
6. Сузить/расширить `ENABLED_SOURCES` в `.env.example`, если источник готов к использованию.
