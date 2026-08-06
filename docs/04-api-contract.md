# 04 — Контракт API

Всё описанное здесь живёт в `packages/contracts` как zod-схемы. Бекенд валидирует ими
ответы парсеров (`packages/parsers`), фронт импортирует выведенные типы.

## Доменная модель

### Идентификаторы

Один и тот же тайтл существует на разных источниках независимо. Поэтому глобальный ID —
всегда составной:

```ts
type MangaRef = `${SourceId}:${string}`; // "READMANGA:solo-leveling"
```

Все ID стабильны в рамках источника. Клиент никогда не парсит их содержимое.

### Manga

```ts
const MangaSchema = z.object({
  id: z.string(), // "READMANGA:solo-leveling"
  sourceId: z.string(),
  slug: z.string(),

  title: z.string(), // локализованное название источника
  altTitles: z.array(z.string()), // оригинал, англ., синонимы

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
  mangaId: z.string(),

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
3. Прогресс чтения хранится на пару `(mangaId, branch)`. Переключение ветки не должно
   обнулять прогресс.
4. UI показывает селектор веток только когда их больше одной.

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
              status: 'ok'|'degraded'|'down' }
```

Ответ сгруппирован по `contentType`; все четыре ключа присутствуют всегда — если источников
типа нет (например, все выключены через `DISABLED_SOURCES`), приходит пустой массив.

`status` считается circuit breaker'ом. Фронт обязан его показывать: честное «источник
недоступен» лучше вечного спиннера.

Возможности источника (поддержка поиска, доступные сортировки) наружу не отдаются: фронт их
никак не использовал, а мультипоиск отбирает источники по этим флагам сам, внутри API.

`domain` — текущий хост источника без схемы (`web.usagi.one`). Источники регулярно переезжают
на новые зеркала, так что для всего, что переживает запрос (закладки, история), ключ — `id`.
Иконку источника фронт собирает сам из `domain`/`id`, API её не отдаёт.

### Каталог

```
GET /sources/:sourceId/manga
    ?page=0&order=UPDATED|POPULARITY|RATING|NEWEST|ALPHABETICAL
    &query=&tags=&excludeTags=&state=&contentRating=
    → { items: Manga[], page, hasNext, stale?: true }
```

`stale: true` — ответ отдан из протухшего кеша, потому что источник лежит. Фронт рисует
ненавязчивую плашку, но контент показывает.

### Мультипоиск

```
GET /search?query=...&sources=READMANGA,DESU,REMANGA&limit=10
    → { groups: Array<{ sourceId, status, items: Manga[] }> }
```

Веерный запрос с общим дедлайном 5 секунд. Источники, не уложившиеся в дедлайн,
возвращаются со `status: 'timeout'` и пустым списком — частичный результат лучше, чем
ожидание самого медленного.

### Тайтл и главы

```
GET /manga/:sourceId/:mangaId
    → { manga: Manga, branches: Branch[] }
    Branch: { id, name, scanlator, chaptersCount, lastUpdatedAt }

GET /manga/:sourceId/:mangaId/chapters?branch=<id>
    → { items: Chapter[] }

GET /manga/:sourceId/:mangaId/chapters/:chapterId/pages
    → { items: Page[], prevChapterId, nextChapterId }
```

`prevChapterId` / `nextChapterId` считает бек в пределах выбранной ветки. Клиент не
должен сам вычислять «следующую главу» — на дробной нумерации и пропусках он ошибётся.

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

### Библиотека (Фаза 5, требует аккаунта)

```
GET    /library                         → сохранённые тайтлы
POST   /library                         → { mangaId, sourceId }
DELETE /library/:mangaId

GET    /progress?mangaIds=a,b,c
PUT    /progress                        → { mangaId, branch, chapterId, page, percent }

POST   /sync                            → батч-синхронизация из IndexedDB
```

Работает по принципу local-first: клиент пишет в IndexedDB немедленно, синхронизация —
фоновая, конфликты разрешаются по «максимальному прогрессу», а не по времени записи.
Пользователь, прочитавший главу 50 на телефоне, не должен откатиться на 30 из-за того,
что планшет синхронизировался позже.

## Ошибки

```ts
{ error: { code: 'SOURCE_UNAVAILABLE', message: '...', sourceId, retryAfter?: 30 } }
```

| Код                  | HTTP | Смысл                                                |
| -------------------- | ---- | ---------------------------------------------------- |
| `SOURCE_UNAVAILABLE` | 503  | Circuit breaker открыт                               |
| `SOURCE_BLOCKED`     | 502  | Источник вернул антибот-челлендж                     |
| `PARSER_FAILED`      | 502  | Парсер не смог разобрать ответ — сайт сменил вёрстку |
| `NOT_FOUND`          | 404  | Тайтла или главы нет на источнике                    |
| `RATE_LIMITED`       | 429  | Превышен лимит запросов клиента                      |
| `INVALID_SIGNATURE`  | 403  | Некорректная подпись у `/img`                        |

`PARSER_FAILED` стоит логировать отдельным счётчиком с разбивкой по источникам — это
ранний сигнал, что пора обновлять форк парсеров.
