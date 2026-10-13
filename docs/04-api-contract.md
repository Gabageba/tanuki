# 04 — Контракт API

Всё описанное здесь живёт в `packages/contracts` как zod-схемы. Бекенд валидирует ими
ответы парсеров (`packages/parsers`), фронт импортирует выведенные типы.

## Доменная модель

### Идентификаторы

Один и тот же тайтл существует на разных источниках независимо. Поэтому глобальный ID —
всегда составной:

```ts
type TitleRef = `${SourceId}:${string}`; // "READMANGA:solo-leveling"
```

Все ID стабильны в рамках источника. Клиент никогда не парсит их содержимое.

### Title

```ts
const TitleSchema = z.object({
  id: z.string(), // "READMANGA:solo-leveling"
  sourceId: z.string(),
  slug: z.string(),

  name: z.string(), // локализованное название источника
  altNames: z.array(z.string()), // оригинал, англ., синонимы

  coverUrl: z.string(), // уже проксированный /api/v1/img?...
  largeCoverUrl: z.string().nullable(),

  description: z.string().nullable(),
  authors: z.array(z.string()),
  tags: z.array(TagSchema),

  state: z.enum(['ONGOING', 'FINISHED', 'PAUSED', 'ABANDONED', 'UPCOMING']).nullable(),
  contentRating: z.enum(['SAFE', 'SUGGESTIVE', 'ADULT']),
  type: z.enum(['MANGA', 'MANHWA', 'MANHUA', 'COMICS', 'OTHER']).nullable(),

  rating: z.number().min(0).max(1).nullable(), // нормализовано к 0..1
  chaptersCount: z.number().nullable(),

  publicUrl: z.string(), // ссылка на страницу источника — обязательна
});
```

`publicUrl` не украшение: это ссылка «читать на источнике», и она же — ваш аргумент в
любом разговоре о правах (см. [09](09-legal.md)). Показывайте её на карточке тайтла.

### Chapter и ветки перевода

Самая специфичная для русскоязычных источников часть модели.

```ts
const ChapterSchema = z.object({
  id: z.string(),
  titleId: z.string(),

  number: z.number().nullable(), // 145.5 — дробные бывают
  volume: z.number().nullable(),
  title: z.string().nullable(),

  branch: z.string().nullable(), // "Команда Ронин" — КРИТИЧНО для RU
  scanlator: z.string().nullable(),
  uploadedAt: z.string().datetime().nullable(),

  url: z.string(), // внутренний, наружу не отдаётся как есть
});
```

Все даты и время наружу уходят в стандартном серверном формате: `YYYY-MM-DDTHH:MM:SSZ`
(`uploadedAt`, `lastUpdatedAt`) — без миллисекунд, всегда UTC.

У тайтла на ReadManga или MangaLib нормой являются 3–5 параллельных веток перевода со
своей нумерацией и разной полнотой. Плоский список глав в таком случае превращается в
кашу из дублей — это главная причина, почему самописные читалки выглядят сломанными.

Правила, зашитые в BFF:

1. Главы группируются по `branch`, ветки сортируются по полноте (число глав) и свежести.
2. Ветка по умолчанию — самая полная и свежая, но выбор пользователя запоминается
   **для конкретного тайтла** и живёт в IndexedDB.
3. Прогресс чтения хранится на пару `(titleId, branch)`. Переключение ветки не должно
   обнулять прогресс.
4. UI показывает селектор веток только когда их больше одной.

Вид выбора ветки и действий над списком — [11 — Ветки и сортировка
глав](11-ui-decisions.md#ветки-и-сортировка-глав).

### Page

```ts
const PageSchema = z.object({
  index: z.number(),
  url: z.string(), // /api/v1/img?u=<signed>&s=<sourceId>
  width: z.number().nullable(), // если источник отдаёт — резервируем место
  height: z.number().nullable(),
});
```

`width`/`height` заполняем везде, где источник их даёт. Без них вертикальный webtoon-ридер
прыгает при подгрузке — самый заметный дефект чтения на мобильном.

## Эндпоинты

Базовый префикс `/api/v1`.

### Источники

```
GET /sources
    → { manga: Source[], hentai: Source[], comics: Source[], other: Source[] }
    Source: { id, title, domain, locale, contentType: 'manga'|'hentai'|'comics'|'other',
              status: 'ok'|'degraded'|'down',
              statusReason: 'broken'|'probeFailed'|'requestFailures'|'recovered'|null,
              statusChangedAt: string|null, checkedAt: string|null,
              failedProbeStreak: number, lastError: string|null,
              homeSections: { id, title }[] }

POST /sources/probe             → SourcesResponse # прогнать проверку по всем
POST /sources/:sourceId/probe   → Source          # прогнать проверку по одному
```

Обе ручки `probe` — только персоналу (`@Roles(ADMIN, MODERATOR)`, остальным 403); `GET /sources` —
всем вошедшим.

Ответ сгруппирован по `contentType`; все четыре ключа присутствуют всегда — если источников
типа нет (например, все выключены через `DISABLED_SOURCES`), приходит пустой массив. Здесь
отдаются все источники, включая `degraded` и `down`, — веер поиска и матчинга отбирает их
отдельно, внутри API.

`status` — липкий: он держится, пока его не сменит явное событие (открывшийся circuit breaker,
ночная проверка), и переживает рестарт API. Ручного сброса нет и намеренно — см.
`docs/03-parsers.md`. Правила переходов — там же. Фронт обязан его показывать: честное «источник
недоступен» лучше вечного спиннера. Остальные поля объясняют, откуда статус взялся: `statusChangedAt` («нестабилен с 3
сентября») и `checkedAt` («проверен 2 часа назад») отдаются в `YYYY-MM-DDTHH:MM:SSZ`, а
`lastError` несёт текст последней ошибки.

Возможности источника (поддержка поиска, доступные сортировки) наружу не отдаются: фронт их
никак не использовал, а мультипоиск отбирает источники по этим флагам сам, внутри API.

`homeSections` — блоки главной сайта для подборок, в порядке сайта, с названиями как у сайта
(`{ id: "hotNew", title: "Горячие новинки" }`). Описаны статически в парсере — вкладка настроек и
скелетон страницы подборок показывают их без запроса к сайту. Пустой массив — у источника нет
главной (или он `isBroken`).

`domain` — текущий хост источника без схемы (`web.usagi.one`). Источники регулярно переезжают
на новые зеркала, так что для всего, что переживает запрос (закладки, история), ключ — `id`.
Иконку источника фронт собирает сам из `domain`/`id`, API её не отдаёт.

### Каталог

```
GET /sources/:sourceId/titles
    ?page=0&order=UPDATED|POPULARITY|RATING|NEWEST|ALPHABETICAL
    &query=&tags=&excludeTags=&state=&contentRating=
    → { items: Title[], page, hasNext, stale?: true }
```

`stale: true` — ответ отдан из протухшего кеша, потому что источник лежит. Фронт рисует
ненавязчивую плашку, но контент показывает.

`query` и `filters` вместе работают не у каждого источника: `Source.isSearchWithFiltersSupported`
говорит, применяет ли источник оба. Если `false`, при запросе он берёт что-то одно (chan, desu,
mangabuff, multporn, nudemoon — запрос; sexkomix2 — фильтры) и молча отбрасывает другое. Поэтому клиент не отправляет `filters`, пока набран `query`
(в адресе выбор остаётся), и блокирует кнопку «Фильтры».

### Мультипоиск

```
GET /search?query=...&sources=READMANGA,DESU&types=manga,manhwa&states=ongoing&limit=10
    → { groups: Array<{ sourceId, status, items: Title[], unappliedFilters: Array<'types' | 'states'>, filters: FilterSelection[] }> }
    status: ok | timeout | error | locked | unavailable
```

Веерный запрос с общим дедлайном (`SEARCH_TIMEOUT_MS`, 5 секунд). Источники, не уложившиеся в
дедлайн, возвращаются со `status: 'timeout'` и пустым списком — частичный результат лучше, чем
ожидание самого медленного. Группы идут в порядке источников пользователя (`Source.position`);
выключенные пользователем и скрытые настройкой 18+ не возвращаются вовсе.

- `locked` — у пользователя нет аккаунта на закрытом источнике, его не опрашивали. Так же
  закрыт источник, у которого поиск по названию — выгода входа (`loginBenefits` с `titleSearch`,
  nudemoon), если пользователь на нём не вошёл: каталог открыт и гостю, а поиск сайт гостю не
  отдаёт.
- Источник отдаёт ровно `limit` карточек: веер просит у него страницу размера `limit`, а не
  страницу каталога, и кладёт её в кеш под своим ключом (размер страницы — часть ключа).
- `unavailable` — источник в `degraded`/`down`: веер его не опрашивает, чтобы не отъедать
  дедлайн у живых, но группа есть, чтобы клиент показал пропуск.
- `sources` — пересечение с источниками пользователя; остальные не опрашиваются.
- `types` / `states` — значения `TITLE_TYPE` / `TITLE_STATE` через запятую; неизвестное значение —
  400 `searchFilterInvalid`. Фильтр не постфильтр: сервер переводит выбор в собственные фильтры
  источника (`Parser.resolveSearchFilters`) и отправляет их вместе с `query`, так что 10 карточек
  источника уже подходят. Применено ли выбранное, видно в `unappliedFilters` группы:
  - у источника нет такого фильтра (chan, desu, mangabuff, multporn, sexkomix2, nudemoon, acomics,
    comx, grouple; у hentaichancc — только тип);
  - поиск по названию на источнике не сочетается с фильтрами (`Source.isSearchWithFiltersSupported`
    = `false`);
  - хотя бы у одного выбранного значения нет опции на источнике (иначе выбор молча сузился бы до
    остальных значений);
  - группа источника радио (tomilolib), а выбрано больше одного значения.

  В этих случаях источник отдаёт выдачу без сужения по этому критерию. Пустые группы (`ok` без
  тайтлов) на клиенте не рисуются.

- Побочный эффект — запрос пишется в историю (если `UserSettings.saveSearchHistory` не
  выключен). Фильтры в историю не попадают.

```
GET    /search/history               → { items: Array<{ query, searchedAt }> }   свежие сверху
DELETE /search/history?query=<текст> → 204   удалить один
DELETE /search/history               → 204   очистить все
```

История — до 10 запросов на пользователя (`SEARCH_HISTORY_LIMIT`). Запрос хранится после `trim`
и схлопывания пробелов; ключ дедупликации — он же в нижнем регистре, повтор поднимает запись и
сохраняет последнее написание. `PUT /user-settings` с `saveSearchHistory: false` стирает историю
в той же транзакции.

### Тайтл и главы

```
GET /titles/:titleId
    → { title: Title, branches: Branch[] }
    Branch: { id, name, scanlator, chaptersCount, lastUpdatedAt }

GET /titles/:titleId/chapters?branch=<id>
    → { items: Chapter[], numbering: "perVolume" | "global" }

GET /titles/:titleId/chapters/:chapterId/pages
    → { items: Page[], prevChapterId, nextChapterId }
```

`numbering` — как ветка нумерует главы: `perVolume`, если заново с 0 или 1 начинается
большинство томов (сезонов), иначе `global`. При `perVolume` номер без тома неоднозначен, и
клиент показывает главу как «Т. 2 Гл. 5», при `global` — «Гл. 5».

`prevChapterId` / `nextChapterId` считает бек в пределах выбранной ветки. Клиент не
должен сам вычислять «следующую главу» — на дробной нумерации и пропусках он ошибётся.

### Тот же тайтл на других источниках

```
GET /titles/:titleId/matches
    → { items: TitleMatch[], failures: { sourceId, status }[] }
    TitleMatch: { title: Title, score: 0..1, confidence, matchedName, tied }
    confidence: confirmed | exact | high | low
```

Веер поиска по всем источникам с общим дедлайном (`MATCH_TIMEOUT_MS`, по умолчанию 20 с) —
не уложившиеся попадают в `failures`, как и в мультипоиске. Результат кешируется на часы:
«на каком ещё сайте лежит тайтл» меняется куда реже, чем страница каталога.

Как сравниваются тайтлы:

- Названия сравниваются **двумя независимыми каналами** — латиница и кириллица. Русские
  названия у каждого источника свои (перевод любительский), поэтому одинокое нечёткое
  совпадение по кириллице не поднимается выше `low`. Латиница — стабильный якорь, по ней же
  идёт первая волна поиска; вторая волна опрашивает русским названием только те источники,
  которые ничего не нашли.
- Совпали оба канала — самый сильный сигнал, он снимает потолок с кириллицы. Совпал один
  точно, а другой распознал подзаголовок — наоборот, повод усомниться: так выглядит спин-офф,
  у которого в альтернативных названиях стоит название всей франшизы.
- Метаданные (год, автор, тип, теги) только уточняют. Отсутствие данных не штрафует никогда,
  а число глав сравнивается исключительно в плюс: 200 глав оригинала против 30 переведённых —
  обычное отставание перевода, а не признак разных тайтлов.
- `tied: true` означает, что с источника пришло несколько неразличимых кандидатов и выбор
  между ними оставлен человеку — так выглядят, например, обычное и цветное издания.

```
PUT /titles/:titleId/links     → 204
    { targetId: "sourceId:opaqueId", verdict: confirmed | rejected | none }
```

Ручная правка выдачи: `confirmed` поднимает пару наверх с уровнем `confirmed` (и дотягивает
тайтл, которого веер не нашёл — так работает «добавить вручную»), `rejected` убирает её из
выдачи, `none` снимает пометку. Правки применяются поверх кеша, поэтому видны сразу.

Связь хранится в Postgres одной строкой на пару, ключ пары отсортирован — поэтому пометка,
поставленная на странице A, видна и со страницы B. Ключ стороны — `sourceId:адрес тайтла`, а
не `Title.id`: часть парсеров выдаёт для одного тайтла разные внутренние id в списке и в
деталях.

Правки по-прежнему глобальны и видны всем авторизованным — своей роли для этого действия нет,
эндпоинт закрыт только общим требованием сессии (см. «Аккаунты и инвайты» ниже: весь `/api/v1`,
кроме явно помеченных `@Public()` ручек, теперь отвечает 401 без сессии).

Недоступность базы обрабатывается несимметрично: чтение деградирует до чистой алгоритмической
выдачи (матчи важнее правок), а запись отвечает `STORAGE_UNAVAILABLE` — молча потерять правку
человека нельзя.

Подтверждения транзитивны: 1↔2 и 2↔3 значат, что 1, 2 и 3 — один тайтл, и 3 приходит на
странице 1 с уровнем `confirmed`, даже если между ними строки нет. Группа собирается рекурсивным
запросом по подтверждённым парам. Прямой `rejected` сильнее цепочки: отказ 1↔3 убирает 3 из
группы 1 при любой цепочке через 2.

### Прогресс чтения

```
GET /titles/:titleId/progress  → { own: ReadingProgress | null, linked: LinkedReadingProgress[] }
PUT /titles/:titleId/progress  → ReadingProgress
    { chapterId: "sourceId:opaqueId", pageIndex: 0 }

ReadingProgress = { sourceId, chapterId, chapterVolume, chapterNumber, chapterTitle, branchId,
                    pageIndex, updatedAt }
LinkedReadingProgress = ReadingProgress & {
  projections: { branchId, chapterId, confidence: "exact" | "approximate" }[]
}
```

Одна отметка на пару «пользователь × тайтл на источнике», ключ — тот же `sourceId:адрес`, что и
у связей. `own` — отметка этого тайтла, `linked` — отметки всей его группы подтверждённых
совпадений (см. выше), свежие первыми.

Чужие отметки на главы этого тайтла переносит сервер (`reading-progress/chapter-alignment.ts`):
полные списки глав ветки отметки и каждой ветки тайтла выравниваются целиком.

- **Нумерация.** По томам — если заново с 0 или 1 начинается большинство томов, иначе сквозная;
  одна глава с ошибочным томом на это не влияет. При сквозной нумерации порядок чтения задаёт
  номер, том только разводит одинаковые номера.
- **Якоря** — главы, совпавшие однозначно: по номеру (по тому и номеру, если обе нумерации по
  томам; при разной нумерации номера не сравниваются) и по названию без служебного префикса
  («Глава 12:», «1 - 1», «Экстра:»). Одинаковое название у глав, чьи номера разошлись больше
  чем на 10, — не якорь. Если название главы указывает на другую главу, номер уступает ему: так
  ловится сдвиг нумерации из-за лишней главы у одного источника и экстры, пронумерованные наоборот.
- Из якорей остаётся самая тяжёлая цепочка, не противоречащая порядку чтения (совпадение по
  номеру весит больше, чем по названию, по обоим — больше всех).
- Совпала сама глава отметки — `exact`. Иначе между соседними якорями её место переносится
  пропорционально, а до первого и после последнего якоря — на столько же глав от него —
  `approximate`. Отметка раньше первой главы ветки — ветки в `projections` нет.
- Нет ни одного якоря, а нумерации разные (одна ветка по томам или сезонам, другая сквозная) —
  номер «том + номер» переводится в сквозной (смещение тома — сумма последних номеров томов до
  него). Перевод ошибается на 0–3 главы, почти всегда вперёд, поэтому отметка отступает на 3 главы
  назад и всегда `approximate`. Нумерации одинаковые и якорей нет — ветки в `projections` нет.
- Недоступен источник отметки — глава узнаётся по снимку (том и номер, название, номер при
  сквозной нумерации), только точно.

Точность проверяет `chapter-alignment.corpus.test.ts` на реальных списках глав
(`reading-progress/fixtures`): каждая глава каждой ветки переносится на ветки других источников.

Том, номер, название и ветку главы при записи сервер берёт из деталей источника сам — клиент шлёт
только id главы и страницу. Чтение при недоступной базе отдаёт пустой прогресс, запись отвечает
`STORAGE_UNAVAILABLE`.

#### «Продолжить чтение»

```
GET    /reading-progress/recent           → { items: ContinueReadingItem[] }
PUT    /titles/:titleId/progress/hidden   — убрать из «Продолжить чтение» → 204
DELETE /titles/:titleId/progress/hidden   — «Отменить» в тосте → 204

ContinueReadingItem = {
  title: { id, sourceId, name, coverUrl, contentRating, type },
  chapter: { id, number, volume, title },
  updatedAt
}
```

- До 20 тайтлов, свежие первыми; группа подтверждённых совпадений — одна карточка с источником и
  главой самой свежей отметки. Тайтлы выключенных и скрытых настройкой 18+ источников не
  попадают. Дочитанные не отсеиваются — их убирают руками.
- Снимок названия, обложки, рейтинга и типа пишет `PUT /progress` из деталей источника (как у
  закладок; обложка — сырым адресом, подпись прокси ставится при чтении). Строкам без снимка он
  досниматься из деталей при выдаче; не вышло — строка ждёт следующего чтения.
- «Убрать» пишет `hidden_at = now()` во все строки группы, прогресс не трогает. Тайтл
  возвращается, когда `updated_at > hidden_at` — при следующем сохранении прогресса; `DELETE`
  сбрасывает `hidden_at`. Недоступная база — пустая лента; «Убрать» — `STORAGE_UNAVAILABLE`.

### Подборки

```
GET /selections/:sourceId → { sourceId, status, sections: HomeSection[] }
    status: "ok" | "timeout" | "error" | "locked" | "unavailable"   — как у группы поиска
    HomeSection = { id, title, items: Title[] }
```

Блоки главной сайта одного источника (`Parser.getHome`). Отдаются все описанные блоки: какие
показывать, решают настройки пользователя на фронте (`selectionsDisabledSources`,
`selectionsDisabledSections`), а кеш общий — `CACHE_TTL.selections`, 30 минут свежести,
stale-while-revalidate до 6 часов. Не ответивший источник — не ошибка запроса, а `status` с
пустыми `sections`: страница рисует причину на месте блоков, а глобальный обработчик ошибок не
показывает тост. `locked` — источник закрыт без аккаунта (парсер не вызывается), `unavailable` —
`degraded`/`down` (тоже без запроса), `timeout` — главная не пришла за 15 с (запрос доживает в
фоне и прогревает кеш). Блок, которого не нашлось на странице, приходит пустым. Неизвестный или
скрытый источник — 404 `sourceNotFound`.

### Прокси изображений

```
GET /img?u=<base64url>&s=<sourceId>&sig=<hmac>&w=<width>&f=webp|avif|orig
```

Правила:

- `sig` = HMAC-SHA256 от `(u, s, exp)` серверным секретом. **Без подписи эндпоинт — это
  открытый прокси**, через который через сутки погонят чужой трафик.
- Ответ стримится через `undici`, без буферизации целиком в память.
- `Referer` и `User-Agent` подставляются из профиля источника.
- `w` округляется до ближайшего из `[360, 480, 720, 1080, 1440]` — иначе получите
  бесконечное множество вариантов в кеше.
- `Cache-Control: public, max-age=31536000, immutable` — URL содержит подпись, значит
  контент по нему неизменен.
- Ресайз через `sharp` только для обложек. **Страницы глав не трогаем**: перекодирование
  убивает качество текста и съедает CPU на каждой странице.

### Аккаунты и инвайты

Весь `/api/v1` закрыт сессией по умолчанию — без валидной cookie `tanuki_session` любой
эндпоинт, кроме перечисленных ниже как `@Public()` и `GET /health`, отвечает 401
`UNAUTHORIZED`. Регистрация возможна только по одноразовому приглашению от админа;
самостоятельной открытой регистрации нет.

```
GET  /auth/invites/:code                → { valid: boolean }                          @Public()
GET  /auth/check-username?username&invite → { available: boolean }                    @Public()

POST /auth/register     { inviteCode, email, username, password, language } → 204      @Public()
POST /auth/verify-email { token } → CurrentUser, ставит cookie сессии                  @Public()
POST /auth/resend-verification { email, language } → 204                               @Public()

POST /auth/login  { login, password, remember, cancelDeletion? } → CurrentUser         @Public()
POST /auth/logout → 204, снимает cookie
GET  /auth/me     → CurrentUser

POST /auth/forgot-password { email, language } → 204, ответ не выдаёт, есть ли аккаунт  @Public()
POST /auth/reset-password  { token, password } → CurrentUser, отзывает старые сессии   @Public()

GET    /invites?page&status&role&sort&direction → { items: Invite[], total }   admin, moderator
POST   /invites  { role }   → Invite & { code }, код виден только тут   admin, moderator (moderator — только role=user)
DELETE /invites/:id         → Invite, отзывает активное                 admin; moderator — только своё
POST   /invites/:id/reissue → Invite & { code }, отзыв + новое с той же ролью   admin; moderator — только своё; не для role=admin

GET    /users?page&query&role&status&sort&direction → { items: ManagedUser[], total }   admin, moderator
PATCH  /users/:id/role  { role }     → ManagedUser                       только admin
POST   /users/:id/block { until, reason } → ManagedUser                  admin; moderator — только role=user
DELETE /users/:id/block              → ManagedUser                       admin; moderator — только role=user
DELETE /users/:id                    → 204, удаляет сразу               только admin
```

Детали:

- **Инвайт** — одноразовый, живёт 7 дней, несёт роль будущего пользователя. `code` в открытом
  виде отдаётся только в ответе на `POST /invites`; хранится (и потом проверяется) только его
  SHA-256. Ссылка на регистрацию — `/register?invite=<code>` на фронтенде. Потерянную ссылку не
  восстановить — приглашение перевыпускают: `POST /invites/:id/reissue` в одной транзакции отзывает
  старое и выпускает новое с той же ролью. Приглашение в роль `admin` (из CLI-скрипта) не
  перевыпускается — только отзывается.
- **Список приглашений** — по 10 (`INVITES_PAGE_SIZE`), фильтры `status` и `role` повторяемые
  (`?status=active&status=used`), `sort` (`INVITES_SORT`) — `createdAt` (по умолчанию, новые
  сверху) / `status` (активные первыми) / `role` / `createdBy` (из консоли — в конце), при
  равенстве — новые сверху. `Invite` несёт `createdById` (по нему интерфейс узнаёт свои),
  `revokedAt` и `revokedByUsername`.
- **Список пользователей** — `sort` (`MANAGED_USERS_SORT`) — `createdAt` (по умолчанию) /
  `lastSeenAt` / `username` / `email` / `status` / `statusUntil` (срок блокировки или удаления,
  бессрочная блокировка — самый дальний) / `invitedBy`. Пустые значения — не входил, без срока,
  без пригласившего — в конце при любом `direction`. Какой ключ в каком столбце — [11 — Сортировка
  составных столбцов](11-ui-decisions.md#сортировка-составных-столбцов).
- **Права на приглашения** — `getInvitePermissions` в `@tanuki/contracts`, общие для API и
  интерфейса: только активное; админ — любое, модератор — только своё; иначе 403.
- **`username`** — `^[a-zA-Z0-9_.]{3,24}$`, хранится как введён, уникален без учёта регистра;
  `email` — тоже уникален без учёта регистра.
- **Пароль** — Argon2id, 8–128 символов, без требований к составу (индикатор надёжности —
  только на фронте, подсказка, а не валидация).
- **Подтверждение почты** обязательно: `POST /auth/login` до перехода по ссылке из письма
  отвечает 403 `EMAIL_NOT_VERIFIED`. Ссылка живёт 24 часа; аккаунт с неподтверждённой почтой
  старше 7 дней удаляется кроном, инвайт при этом освобождается.
- **Сессия** — не JWT, а случайный токен в httpOnly cookie (`SameSite=Lax`), в БД хранится
  только его хэш. `remember: true` — cookie на 30 дней со скользящим продлением (не чаще
  раза в час); `remember: false` — cookie сессии браузера + серверный idle-таймаут 24 часа.
  Сброс пароля отзывает все сессии пользователя, кроме новой, выданной тем же запросом.
- **Rate limit** (Valkey, по IP и/или адресу): вход — 10 попыток / 15 мин; письма
  (resend/forgot) — 1 / 60 с и 5 / час на адрес. Превышение — 429 `TOO_MANY_REQUESTS` с
  `retryAfter` в секундах.
- Письма уходят через SMTP (`nodemailer`); без `SMTP_HOST` в env ссылка вместо отправки
  пишется в лог API — этого достаточно для локальной разработки. В dev-докере поднят Mailpit
  (UI на `:8025`).
- **Управление пользователями** (страница «Управление» → «Пользователи»): по 10 строк,
  новые сверху; `query` ищет подстроку в имени и почте, `status` — один из `USER_STATUS`.
  Статус не хранится, а выводится по приоритету: действующая блокировка → удаление ждёт →
  почта не подтверждена → активен. Права — `getUserManagementPermissions` из контрактов: себя
  и админа не меняет никто, роль `admin` не выдаётся (`role` — только `user`/`moderator`); на
  чужое действие — 403 `FORBIDDEN`. `until` блокировки — `YYYY-MM-DDTHH:MM:SSZ` в будущем или
  `null` (навсегда); блокировка сразу отзывает все сессии. Заблокированному вход отвечает 403
  `ACCOUNT_BLOCKED` — текст называет срок и причину; то же при подтверждении почты, сбросе
  пароля и отмене удаления по ссылке, а уцелевшую сессию отвергает `AuthGuard`. Блокировка со
  сроком кончается сама, без крона. «Вход» в таблице — `users.lastSeenAt`, пишется при
  создании сессии и её продлении.
- Реализация: `apps/api/src/auth`, `apps/api/src/invites`, `apps/api/src/users`, `apps/api/src/mail`,
  `apps/api/src/rate-limit`; таблицы — `users`, `sessions`, `invites`, `email_tokens` в
  `apps/api/src/database/schema.ts`.

### Управление аккаунтом

Вкладка профиля «Вход и безопасность». Всё, что меняет способ входа, подтверждается текущим
паролем (403 `WRONG_PASSWORD`, лимит 10 попыток / 15 мин на пользователя).

```
POST   /account/email          { newEmail, password } → 204, код ушёл на новый адрес
POST   /account/email/confirm  { code } → CurrentUser, почта уже новая
POST   /account/email/revert   { token } → 204, все сессии завершены                  @Public()

POST   /account/password       { currentPassword, newPassword, signOutOtherDevices } → 204

GET    /account/sessions       → { items: Session[] }  (браузер, ОС, тип устройства, IP, isCurrent)
DELETE /account/sessions/:id   → 204
DELETE /account/sessions       → 204, все, кроме текущей

POST   /account/deletion        { password } → 204, все сессии завершены
POST   /account/deletion/cancel { token } → CurrentUser, ставит cookie сессии         @Public()
```

- **Смена почты** — два шага в одной модалке. Первый шлёт на новый адрес 6-значный код
  (15 минут); повторный запрос (он же «отправить ещё раз») гасит прежний код. Второй — ввод
  кода: почта меняется сразу, а на прежний адрес уходит уведомление со ссылкой «это был не я»
  (7 дней), которая возвращает прежнюю почту и завершает все сессии. У аккаунта всегда одна
  почта: ожидающий адрес живёт только в `email_tokens.payload` кода, закрытая модалка просто
  бросает попытку. Неверный код — 400 `CODE_INVALID`; после 5 неверных вводов
  (`email_tokens.attempts`) код гаснет, и нужен новый.
- **Удаление** — отложенное на 14 дней (`users.deletion_scheduled_at`). Все сессии
  завершаются. Вход до этой даты отвечает 403 `ACCOUNT_DELETION_SCHEDULED`, а вход с
  `cancelDeletion: true` (или ссылка из письма, или сброс пароля) удаление снимает.
  Окончательно удаляет крон `AuthCleanupService`, данные уходят каскадом.
- Реализация: `apps/api/src/auth/account.{controller,service}.ts`.

### Личные аккаунты источников

У источников с входом (`SOURCE_CATALOG[id].authFamily`: Grouple, AllHentai, LibSocial, Nude-Moon) в каталоге
записано, обязателен ли вход (`loginRequirement`: `required` — без аккаунта источник не работает,
`optional` — читается и гостем), и `Source.loginRequirement` отдаёт это значение как есть. Источник с `required` закрыт для
пользователя, пока он не привяжет свой аккаунт: запрос к нему — 403 `SOURCE_ACCOUNT_REQUIRED` с
`sourceId`, даже если ответ лежит в общем кеше. `Source.access` (`available` / `locked` /
`reloginRequired`) показывает это заранее, поиск отдаёт такие источники со статусом группы
`locked`. Источник с `optional` без аккаунта читается анонимно, а свой аккаунт используется, если он
привязан. Сервисные учётки из env пользователю не подставляются — через них ходят только фоновые
задачи. `Source.loginBenefits` — всё, что вход даёт (`catalogAndReading` — сам источник, у каждого
`required`; `memberChapters`; `purchasedChapters`; `titleSearch` — поиск по названию, который
сайт отдаёт только вошедшим: без аккаунта источник в `/search` — `locked`, а поле поиска в его
каталоге закрыто),
`Source.isLoggedIn` — есть ли действующий аккаунт.
Источник с `optional` всегда `access: available`. Если аккаунт привязан, но источник
перестал принимать его сессию, закрытый источник отвечает 403 `SOURCE_RELOGIN_REQUIRED`.

Порядок источников пользователя: `PUT /sources/order { sourceIds }` — список целиком, неизвестные и
повторные id отбрасываются, не названные источники встают в конец в порядке каталога.
`Source.position` — место источника в этом порядке; в нём же идут `/sources` и группы `/search`.

```
GET    /source-accounts                → { items: SourceAccount[], isLinkingAvailable }
POST   /source-accounts/:family/login  { login, password, rememberPassword } → 204  (grouple, allhentai, nudemoon)
POST   /source-accounts/libsocial/login { login, password, rememberPassword } → 204
POST   /source-accounts/libsocial/token { sourceId, value } → 204
DELETE /source-accounts/:family → 204

PUT    /sources/:sourceId/enabled      { isEnabled } → 204
```

- Аккаунт один на семейство. Grouple и AllHentai: сервер сам входит на SSO-шлюз и хранит
  cookie jar. Nude-Moon — так же, но через форму входа самого сайта (`/setuser.php`, cookie
  `fusion_user`). Пароль хранится, только если человек разрешил: тогда истёкшая сессия
  восстанавливается сама. LibSocial: учётка общая на всю сеть, но у MangaLib и HentaiLib свои
  OAuth-шлюзы, и токен каждый выдаёт свой. Аккаунт хранит токены по сайтам
  (`SourceAccount.sourceIds` — у каких сайтов токен есть), сайт без токена закрыт (`locked`),
  а отвергнутый сайтом токен забывается только у этого сайта. Вход по паролю проходит
  все сайты сети разом, вставленный токен добавляется к аккаунту только для своего сайта.
  Сервер сам проходит вход сайта без браузера (`packages/parsers/src/sources/libsocial/login.ts`): OAuth2 + PKCE,
  форма `/auth/login` с ALTCHA (proof-of-work, решается перебором SHA-256), страница согласия,
  если она есть, и код из редиректа на callback сайта — сам callback не открывается. С
  сохранённым паролем отвергнутый refresh_token заменяется новым входом. Запасной путь для
  входящих через VK или Яндекс — вставить значение ключа `auth` из localStorage сайта. Такой токен
  проверяется через `/api/auth/me`.
- Сессии и пароли шифруются AES-256-GCM ключом `SOURCE_SECRETS_KEY`. Без ключа привязка
  отвечает 503 `SOURCE_LINKING_UNAVAILABLE`. Источник, не принявший данные, — 400
  `SOURCE_LOGIN_FAILED`. Отвергнутая источником сессия переводит аккаунт в `reloginRequired`.
- Кеш ответов общий, доступ проверяется у каждого пользователя. Промах кеша идёт с аккаунтом
  зрителя. Купленные платные главы LibSocial (`RawChapter.isPaid`) в общий кеш не попадают,
  а их страницы не кешируются вовсе. Фоновая работа (пробник, веер совпадений) идёт от
  сервисных учёток из env.
- Выключенные в настройках источники (`disabled_sources`) скрыты из поиска и совпадений,
  `Source.isEnabled` размечает их в `/sources`.
- Реализация: `apps/api/src/source-accounts` (зритель запроса — AsyncLocalStorage,
  `ViewerContextInterceptor`), `packages/parsers/src/core/source-accounts.ts`.

### Закладки

Хранятся на сервере (Postgres), без Dexie и local-first: всё приложение требует вход, прогресс
уже на сервере. Реализация — `apps/api/src/library` (`LibraryModule`), план —
[`plans/bookmarks.md`](plans/bookmarks.md), контракты — `packages/contracts/src/bookmark.ts`.

```
GET    /bookmark-folders                 → { items: BookmarkFolder[], hasNew }
POST   /bookmark-folders                 { name, icon, color, trackUpdates } → BookmarkFolder
PATCH  /bookmark-folders/:id             { name?, icon?, color?, trackUpdates? } → 204
PUT    /bookmark-folders/order           { ids: string[] } — все папки в новом порядке → 204
DELETE /bookmark-folders/:id?moveTo=<id> без moveTo закладки папки удаляются → 204

GET    /bookmarks?folderId=&sort=&query=&page=   → { items: BookmarkItem[], page, total }
GET    /bookmarks/new-chapters  → { items: BookmarkItem[] } — до 8, для главной
POST   /bookmarks/lookup     { titleIds }        → { [titleId]: folderId } — метки на карточках
POST   /bookmarks/restore    { rows }            — «Вернуть» после удаления → 204

GET    /titles/:titleId/bookmark          → { folderId | null, conflict: BookmarkFolderCopy[] | null }
PUT    /titles/:titleId/bookmark          { folderId } — положить или перенести группу
DELETE /titles/:titleId/bookmark          → { rows } — удалённые строки для restore
POST   /titles/:titleId/bookmark/visit    → { newChapterIds } — главы с прошлого визита

BookmarkFolder = { id, builtIn: "reading" | "planned" | "completed" | "dropped" | null,
                   name, icon, color (null у встроенных), trackUpdates, count, newCount }
BookmarkItem = { titleId, sourceId, name, coverUrl, contentRating, type, folderId,
                 progress: { chapterNumber, total } | null, chaptersCount, newChaptersCount,
                 otherSources: { sourceId, titleId }[],
                 availability: "available" | "sourceDisabled" | "sourceDown" | "titleMissing" }
```

- **Ключ** — тайтл на источнике (`sourceId:адрес`, как у прогресса и связей), а показ и правки —
  по группе подтверждённых совпадений: смена папки и удаление касаются всех строк группы, тайтл
  «в закладках», если в закладках он сам или любая копия. Одна папка на тайтл.
- **Папки:** четыре встроенные создаются лениво, переименовать и удалить их нельзя
  (`builtInBookmarkFolderReadonly`); своих — не больше 20 (`bookmarkFolderLimit`), название 1–32
  символа и уникально без учёта регистра, в том числе против названий встроенных на любом языке
  (`bookmarkFolderNameTaken`). «Следить за обновлениями» по умолчанию включено у всех, кроме
  «Брошено».
- **Куда ведёт карточка:** источник самой свежей отметки чтения в группе, без отметок — где
  добавили. Выключенные и лежащие источники целью не становятся, пока в группе есть другие; не
  осталось ни одного — `availability` называет причину. Снимок названия, обложки, рейтинга и типа
  хранится в строке закладки (обложка — сырым адресом, подпись прокси ставится при чтении).
- **Новые главы:** общие таблицы снимков `title_chapter_snapshots` / `title_chapters_seen` пишут
  крон (`BOOKMARK_UPDATES_CRON`, по умолчанию раз в 3 часа, только отслеживаемые папки, мимо
  источников в `down`), `GET /titles/:id/chapters` (дотяжка, не чаще раза в 5 минут) и визит.
  Первый снимок тайтла — базовый, его главы новыми не считаются. Новые — увиденные впервые после
  последнего визита в группу; визит — открытие страницы тайтла или сохранение прогресса. Число
  считается по ветке отметки цели (без отметки — по самой длинной), наружу карточка показывает
  только точку. Снимки, которых нет ни в закладках, ни в отметках, чистятся раз в сутки
  (`BOOKMARK_SNAPSHOTS_CLEANUP_CRON`).
- **Склейка:** `PUT /titles/:id/links` с `confirmed` принимает необязательный `bookmarkFolderId`.
  Если у подтверждающего обе стороны лежат в закладках в разных папках, а поля нет — `409
bookmarkFolderConflict`, фронт спрашивает папку и повторяет запрос. У остальных пользователей
  папки группы остаются разошедшимися: `GET /titles/:id/bookmark` отдаёт `conflict`, и фронт
  спрашивает при следующем открытии тайтла; до выбора группа лежит в папке самой свежей строки.

- **«Новые главы в закладках» на главной** — `GET /bookmarks/new-chapters`: группы с
  `newChaptersCount > 0` (у неотслеживаемых папок счётчик всегда 0), свежая новая глава первой,
  до 8.

### Уведомления

Лента, поток SSE и Web Push. Реализация — `apps/api/src/notifications` (`NotificationsModule`,
глобальный: события в него шлют закладки, статусы источников, аккаунт и инвайты), план —
[`plans/notifications.md`](plans/notifications.md), контракты —
`packages/contracts/src/notification.ts`.

```
GET    /notifications?category=a,b&page=   → { items: NotificationItem[], page, total } (по 20)
GET    /notifications/unread-count         → { count }
GET    /notifications/stream               → text/event-stream
DELETE /notifications/:id                  → 204 — «прочитано» (убрать) одно
DELETE /notifications?category=a,b        → 204 — убрать все, с учётом категории
GET    /notifications/push/config          → { enabled, publicKey }
POST   /notifications/push/subscriptions   { endpoint, keys: { p256dh, auth } } → 204
DELETE /notifications/push/subscriptions   { endpoint } → 204

NotificationItem = { id, type, category, count, createdAt, updatedAt, payload }  // по type
  payload: newChapters   { titleId, sourceId, name, coverUrl }
           newDeviceLogin { device }
           sourceDown / parserDown { sourceId, reason }
           sourceRecovered / parserRecovered { sourceId }
           inviteUsed { inviteId, username } · inviteExpired { inviteId }
           emailChanged / deletionRequested {}
```

- **Категории и типы** — `NOTIFICATION_CATEGORY` (`chapters`, `account`, `sources`,
  `administration`) и `NOTIFICATION_TYPE`; категория выводится из типа (`getNotificationCategory`).
  «Администрирование» видят только `admin` и `moderator`; чужая категория в фильтре даёт пустой
  список, а не 403. Текст ленты клиент собирает по `type` и `payload` — готовой строки нет.
- **Прочитано = удалено.** Столбца `readAt` нет, лента показывает только непрочитанное. Запись
  уникальна по `(userId, groupKey)`: `chapters:<ключ группы закладки>`, `source:<id>`,
  `parser:<id>`, `invite:<id>`, `event:<uuid>`. Переход источника `down` → `ok` переписывает ту же
  запись типом `…Recovered` и поднимает её как новую. Непрочитанное живёт 30 дней от `updatedAt`
  (суточный крон, 05:00), не больше 200 записей на пользователя.
- **Новые главы** создаёт крон закладок после прохода: для каждой группы, чьи главы найдены именно
  в этом проходе, `count` выставляется равным текущему числу новых глав (идемпотентно). Группы без
  новых глав, а также записи удалённых закладок и папок, у которых выключили «Следить за
  обновлениями», убираются. Визит в группу (страница тайтла, прогресс) удаляет запись сразу.
- **Поток SSE.** Событие на каждое создание, переписывание и удаление: `{ type: 'created' |
'updated', notification }` или `{ type: 'removed', id? }` (без `id` — удалена пачка, клиент
  перезапрашивает ленту). Раз в 25 с — событие `ping` с пустыми данными; заголовок
  `X-Accel-Buffering: no`. Не больше 5 потоков на пользователя — самый старый закрывается. Хаб —
  в памяти процесса (одна реплика API).
- **Push.** Опция инстанса: пара `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (+ `VAPID_SUBJECT`) в
  конфиге API; без неё `push/config` отдаёт `enabled: false`. Push уходит, когда запись создана или
  сменила тип, а не при росте `count`; больше 3 новых записей `newChapters` за проход крона — один
  сводный push. Категории, выключенные в `UserSettings.pushDisabledCategories`, пропускаются. Текст
  push — на сервере, на языке пользователя. Подписка с ответом 404/410 удаляется.
- **Источники событий.** `newChapters` — крон закладок; `sourceDown/Recovered` — держателям
  закладок на источнике (кроме выключивших его), `parserDown/Recovered` — всем `admin` и
  `moderator`, оба — на переходах в `down` и обратно, `degraded` не шумит
  (`SourceStatusService`); `emailChanged`, `deletionRequested` — `AccountService`;
  `newDeviceLogin` — вход с устройства, которого нет в `known_devices` (отпечаток «браузер + ОС»
  из User-Agent; первый вход аккаунта не считается, пустая таблица засевается из прежних сессий);
  `inviteUsed` / `inviteExpired` — **только создателю инвайта** (`invites.createdBy`; у первого
  инвайта из CLI создателя нет — никому). Истечение ловит часовой крон по окну прошедшего часа.

## Ошибки

```ts
{ error: { code: 'SOURCE_UNAVAILABLE', message: '...', sourceId, retryAfter?: 30 } }
```

| Код                             | HTTP | Смысл                                                                |
| ------------------------------- | ---- | -------------------------------------------------------------------- |
| `SOURCE_UNAVAILABLE`            | 503  | Circuit breaker открыт                                               |
| `SOURCE_BLOCKED`                | 502  | Источник вернул антибот-челлендж                                     |
| `PARSER_FAILED`                 | 502  | Парсер не смог разобрать ответ — сайт сменил вёрстку                 |
| `STORAGE_UNAVAILABLE`           | 503  | Postgres недоступен — правка связи не сохранена                      |
| `NOT_FOUND`                     | 404  | Тайтла или главы нет на источнике                                    |
| `UNAUTHORIZED`                  | 401  | Нет валидной сессии                                                  |
| `FORBIDDEN`                     | 403  | Сессия есть, но не хватает роли (не admin)                           |
| `INVALID_CREDENTIALS`           | 401  | Неверная почта/имя пользователя или пароль                           |
| `EMAIL_NOT_VERIFIED`            | 403  | Почта ещё не подтверждена — вход запрещён                            |
| `EMAIL_TAKEN`                   | 409  | Такая почта уже зарегистрирована                                     |
| `USERNAME_TAKEN`                | 409  | Такое имя пользователя уже занято                                    |
| `INVITE_INVALID`                | 400  | Инвайт не найден, использован, отозван или истёк                     |
| `TOKEN_INVALID`                 | 400  | Ссылка подтверждения/сброса недействительна                          |
| `CODE_INVALID`                  | 400  | Код из письма неверный, истёк или сгорел                             |
| `TOO_MANY_REQUESTS`             | 429  | Rate limit (вход/письма) — см. `retryAfter`                          |
| `RATE_LIMITED`                  | 429  | Превышен лимит запросов клиента                                      |
| `INVALID_SIGNATURE`             | 403  | Некорректная подпись у `/img`                                        |
| `VALIDATION_FAILED`             | 400  | Тело или параметры запроса не прошли zod-схему                       |
| `BAD_REQUEST`                   | 4xx  | Прочий 4xx без своего кода                                           |
| `INTERNAL`                      | 500  | Непредвиденное падение сервера                                       |
| `bookmarkFolderLimit`           | 409  | Своих папок закладок уже 20                                          |
| `bookmarkFolderNameTaken`       | 409  | Папка с таким названием уже есть                                     |
| `builtInBookmarkFolderReadonly` | 400  | Встроенную папку нельзя переименовать или удалить                    |
| `bookmarkFolderConflict`        | 409  | Связь склеила бы закладки из разных папок — нужен `bookmarkFolderId` |

`message` переводится на язык из `Accept-Language` (`ru`/`en`, по умолчанию `ru`) — фронт
выводит его как есть, своих текстов под коды не держит. Словари — `apps/api/src/common/error-messages.ts`;
исключение (`ApiException`) хранит ключ сообщения, а не готовый текст. Сырой текст ошибки парсера
клиенту не уходит — только в логи и в статус источника.

На фронте ошибку показывает глобальный обработчик в `QueryClientProvider`:

- `UNAUTHORIZED` у залогиненного — разлогин на клиенте (кеш очищается) и уход на
  `/login?redirect=…`;
- любая упавшая загрузка и мутация — уведомление, есть у запроса данные или нет;
- основной запрос страницы без данных (`PageLayout.Content`, читалка) — вдобавок `QueryError`
  вместо страницы, без редиректов: HTTP-статус фоном, текст ошибки с сервера и «Повторить»
  (для `NOT_FOUND` — «На главную»). Блоки внутри страницы `QueryError` не рисуют: при ошибке
  они просто пустые, о сбое говорит уведомление;
- `meta: SILENT_ERROR_META` отключает уведомление, когда ошибку разбирает сам вызывающий код
  (формы входа/регистрации), `meta.errorTitle` задаёт заголовок уведомления.

`PARSER_FAILED` стоит логировать отдельным счётчиком с разбивкой по источникам — это
ранний сигнал, что пора обновлять форк парсеров.
