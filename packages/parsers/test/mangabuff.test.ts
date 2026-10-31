import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  FILTER_TYPE,
  SOURCE_AUTH_FAMILY,
  TITLE_STATE,
  TITLE_TYPE,
  SORT_ORDER,
} from '@tanuki/contracts';
import { createMangaBuffParser, MANGABUFF_FILTER_GROUP } from '../src/sources/mangabuff';
import { loginMangaBuff } from '../src/sources/mangabuff/auth';
import { runWithSourceAccounts, type SourceAccountSession } from '../src/core/source-accounts';
import { SourceAuthRequiredError, SourceBlockedError, SourceUnavailableError } from '../src/errors';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';
import { readFixture } from './support/fixtures';
import { checkHome } from './support/home';

const DOMAIN = 'mangabuff.example';

const LIST_HTML = `<!doctype html><html><body>
  <div class="cards">
    <a href="/manga/one-piece" class="cards__item">
      <div class="cards__img" style="background-image: url('/img/manga/posters/one-piece.jpg')"></div>
      <span class="cards__rating cards__rating--green">9,4</span>
      <div class="cards__name">Ван-Пис</div>
      <div class="cards__info">Манга, Экшен</div>
    </a>
  </div>
</body></html>`;

// getList browses the catalog with ?view=card-detailed — its cards trade the single .cards__info
// genre for a full comma-separated list, so getList's tags come from here rather than getDetails.
const LIST_HTML_DETAILED = `<!doctype html><html><body>
  <div class="cards-detailed">
    <a href="/manga/one-piece" class="cards-detailed__item">
      <div class="cards-detailed__poster"><img src="/img/manga/posters/one-piece.jpg" /></div>
      <div class="cards-detailed__type">Манга</div>
      <div class="cards-detailed__name">Ван-Пис</div>
      <div class="cards-detailed__genres">Экшен, Приключения</div>
      <div class="cards-detailed__info">9.4 <span>1234</span></div>
    </a>
  </div>
</body></html>`;

// .manga__middle-links packs type/year/status as three <a>s told apart by href shape, not
// position — /types/<slug> is the type, /types/<slug>/<year> the year, /manga?status_id[]= the
// status. Genres live separately, under .tags, alongside the age-rating badge.
const DETAILS_HTML = `<!doctype html><html><body>
  <h1>Ван-Пис</h1>
  <div class="manga" data-id="42" data-fav-count="1234"></div>
  <div class="manga__img"><img src="/img/manga/posters/one-piece-full.jpg" /></div>
  <meta itemprop="ratingCount" content="5678" />
  <div class="manga__rating">8,7</div>
  <div class="manga__views">50 000</div>
  <div class="manga__description">Описание тайтла.</div>
  <div class="manga__name-alt"><span>One Piece</span></div>
  <div class="manga__middle-links">
    <a href="/types/manga">Манга</a>
    <a href="/types/manga/1997">1997</a>
    <a href="/manga?status_id[]=2">продолжается</a>
  </div>
  <div class="tags">
    <div class="tags__item tags__item--warning">16+</div>
    <a href="/genres/priklyucheniya" class="tags__item">Приключения</a>
  </div>
  <a class="chapters__item" href="/manga/one-piece/2">
    <div class="chapters__volume">Том <span>1</span></div>
    <div class="chapters__value">Глава <span>2</span></div>
    <div class="chapters__name">Романс Зоро</div>
    <div class="chapters__add-date">02.01.2024</div>
  </a>
  <a class="chapters__item" href="/manga/one-piece/1">
    <span class="chapters__value">Глава 1</span>
    <span class="chapters__add-date">01.01.2024</span>
  </a>
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <div class="reader__pages">
    <img data-src="/pages/001.jpg" />
    <img data-src="/pages/002.jpg" />
  </div>
</body></html>`;

// The catalog's filter sidebar (.catalog__right) — a trimmed slice of the real /manga markup.
// genre/type/tag are the only groups mirrored by a without_* select (exclude side); the rest have
// none on the real site either.
const FILTERS_HTML = `<!doctype html><html><body>
  <div class="catalog__right">
    <form action="/manga" method="GET">
      <div class="catalog__field">
        <select name="genres[]" multiple data-placeholder="Жанр манги">
          <option value="1">Арт</option>
          <option value="4">Боевые искусства</option>
        </select>
      </div>
      <div class="catalog__field">
        <select name="type_id[]" multiple data-placeholder="Тип манги">
          <option value="1">Манга</option>
          <option value="3">Манхва</option>
        </select>
      </div>
      <div class="catalog__field">
        <select name="tags[]" multiple data-placeholder="Выбрать теги">
          <option value="7759">Азартные игры</option>
          <option value="7750">Алхимия</option>
        </select>
      </div>
      <div class="catalog__field">
        <select name="status_id[]" multiple data-placeholder="Статус">
          <option value="1">Завершен</option>
          <option value="2">Продолжается</option>
        </select>
      </div>
      <div class="catalog__field">
        <select name="age_rating[]" multiple data-placeholder="Возрастное ограничение">
          <option value="18+">18+</option>
          <option value="16+">16+</option>
        </select>
      </div>
      <div class="catalog__field">
        <select name="rating[]" multiple data-placeholder="Рейтинг">
          <option value="5">Рейтинг 5+</option>
          <option value="9">Рейтинг 9+</option>
        </select>
      </div>
      <div class="catalog__field">
        <select name="year[]" multiple data-placeholder="Год выпуска">
          <option value="2026">2026</option>
          <option value="2018">2018</option>
        </select>
      </div>
      <h3 class="small-title">Колличество глав</h3>
      <div class="catalog__chapters">
        <label>
          <input type="checkbox" name="chapters[]" id="catalog__chapter" value="0">
          <span>&lt;50</span>
        </label>
        <label>
          <input type="checkbox" name="chapters[]" id="catalog__chapter" value="200">
          <span>&gt;200</span>
        </label>
      </div>
      <h3 class="small-title">Исключить</h3>
      <div class="catalog__field">
        <select name="without_genres[]" multiple data-placeholder="Жанр манги">
          <option value="1">Арт</option>
          <option value="4">Боевые искусства</option>
        </select>
      </div>
      <div class="catalog__field">
        <select name="without_type_id[]" multiple data-placeholder="Тип манги">
          <option value="1">Манга</option>
          <option value="3">Манхва</option>
        </select>
      </div>
      <div class="catalog__field">
        <select name="without_tags[]" multiple data-placeholder="Выбрать теги">
          <option value="7759">Азартные игры</option>
          <option value="7750">Алхимия</option>
        </select>
      </div>
    </form>
  </div>
</body></html>`;

const makeContext = (http: FakeHttpClient): ParserContext => {
  return {
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
};

const setUpFixtures = (): FakeHttpClient => {
  const http = new FakeHttpClient();
  http.register((url) => url.includes('/manga/one-piece/2'), { status: 200, body: PAGES_HTML });
  http.register((url) => url.endsWith('/manga/one-piece'), { status: 200, body: DETAILS_HTML });
  // fetchFilters requests the bare catalog page (no query string) — fetchListPage always adds at
  // least ?sort=..., so the two never collide on the same rule.
  http.register((url) => url === `https://${DOMAIN}/manga`, { status: 200, body: FILTERS_HTML });
  // Catalog browsing always requests ?view=card-detailed; /search doesn't support that param and
  // keeps returning the plain .cards__item markup.
  http.register((url) => url.includes('/manga?'), { status: 200, body: LIST_HTML_DETAILED });
  http.register((url) => url.includes('/search?'), { status: 200, body: LIST_HTML });
  return http;
};

describe('MangaBuff parser conformance', () => {
  const http = setUpFixtures();
  const parser = createMangaBuffParser(makeContext(http));

  it('getList: chapters null, rating/type/tags from the detailed card, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.MANGABUFF);
    expect(item!.rating).toBeCloseTo(0.94, 5);
    expect(item!.type).toBe(TITLE_TYPE.MANGA);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.tags.map((t) => t.title)).toEqual(['Экшен', 'Приключения']);
    // The site never puts a synopsis on any list card, detailed view included.
    expect(item!.description).toBeNull();
  });

  it('getList with a search query: falls back to the plain (non-detailed) card, no tags', async () => {
    const items = await parser.getList({ offset: 0, limit: 20, query: 'ван-пис' });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.tags).toEqual([]);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/manga/one-piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.number).toBeGreaterThan(0);
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    // oldest-first ordering
    expect(manga.chapters![0]!.number).toBe(1);
    expect(manga.chapters![1]!.number).toBe(2);
    // Том, номер и название — отдельные блоки, а не одна строка «Том 1Глава 2Романс Зоро».
    expect(manga.chapters![1]).toMatchObject({ volume: 1, title: 'Романс Зоро' });
    expect(manga.chapters![0]!.volume).toBeNull();
    expect(manga.rating).toBeCloseTo(0.87, 5);
    expect(manga.releaseState).toBe(TITLE_STATE.ONGOING);
    expect(manga.type).toBe(TITLE_TYPE.MANGA);
    expect(manga.year).toBe(1997);
    expect(manga.contentRating).toBe(CONTENT_RATING.SUGGESTIVE);
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    // Description is the synopsis alone — rating/views/favorites/alt titles all have their own
    // dedicated fields and must not be duplicated into the text.
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.votesCount).toBe(5678);
    expect(manga.views).toBe(50000);
    expect(manga.likes).toBe(1234);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/manga/one-piece');
    const chapter2 = manga.chapters!.find((c) => c.number === 2)!;
    const pages = await parser.getPages(chapter2.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/pages/001.jpg`);
  });

  it('getFilters: all eight groups with their options', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      MANGABUFF_FILTER_GROUP.GENRE,
      MANGABUFF_FILTER_GROUP.TYPE,
      MANGABUFF_FILTER_GROUP.TAG,
      MANGABUFF_FILTER_GROUP.STATUS,
      MANGABUFF_FILTER_GROUP.AGE_RATING,
      MANGABUFF_FILTER_GROUP.RATING,
      MANGABUFF_FILTER_GROUP.YEAR,
      MANGABUFF_FILTER_GROUP.CHAPTERS_COUNT,
    ]);

    const genre = groups.find((g) => g.id === MANGABUFF_FILTER_GROUP.GENRE)!;
    expect(genre.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(genre.options).toEqual([
      { key: '1', title: 'Арт', count: null },
      { key: '4', title: 'Боевые искусства', count: null },
    ]);

    const type = groups.find((g) => g.id === MANGABUFF_FILTER_GROUP.TYPE)!;
    expect(type.type).toBe(FILTER_TYPE.CHECKBOX_EXCLUDE);
    expect(type.options).toEqual([
      { key: '1', title: 'Манга', count: null },
      { key: '3', title: 'Манхва', count: null },
    ]);

    const tag = groups.find((g) => g.id === MANGABUFF_FILTER_GROUP.TAG)!;
    expect(tag.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(tag.options).toEqual([
      { key: '7759', title: 'Азартные игры', count: null },
      { key: '7750', title: 'Алхимия', count: null },
    ]);

    const status = groups.find((g) => g.id === MANGABUFF_FILTER_GROUP.STATUS)!;
    expect(status.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(status.options).toEqual([
      { key: '1', title: 'Завершен', count: null },
      { key: '2', title: 'Продолжается', count: null },
    ]);

    const chaptersCount = groups.find((g) => g.id === MANGABUFF_FILTER_GROUP.CHAPTERS_COUNT)!;
    expect(chaptersCount.title).toBe('Количество глав');
    expect(chaptersCount.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(chaptersCount.options).toEqual([
      { key: '0', title: '<50', count: null },
      { key: '200', title: '>200', count: null },
    ]);
  });

  it('getList with filters: genre/type/tag route through without_* when excluded', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: MANGABUFF_FILTER_GROUP.GENRE, key: '1' },
        { groupId: MANGABUFF_FILTER_GROUP.GENRE, key: '4', exclude: true },
        { groupId: MANGABUFF_FILTER_GROUP.TYPE, key: '3', exclude: true },
        { groupId: MANGABUFF_FILTER_GROUP.STATUS, key: '2' },
        { groupId: MANGABUFF_FILTER_GROUP.CHAPTERS_COUNT, key: '200' },
      ],
    });
    const catalogRequest = http.requests.filter((r) => r.url.includes('/manga?')).at(-1)!;
    const url = new URL(catalogRequest.url);
    expect(url.searchParams.getAll('genres[]')).toEqual(['1']);
    expect(url.searchParams.getAll('without_genres[]')).toEqual(['4']);
    expect(url.searchParams.getAll('without_type_id[]')).toEqual(['3']);
    expect(url.searchParams.getAll('status_id[]')).toEqual(['2']);
    expect(url.searchParams.getAll('chapters[]')).toEqual(['200']);
  });

  it("getList: order maps to the site's actual sort= values", async () => {
    const cases: [string | undefined, string][] = [
      [undefined, 'updated_at'],
      [SORT_ORDER.UPDATED, 'updated_at'],
      [SORT_ORDER.POPULARITY, 'real_views'],
      [SORT_ORDER.RATING, 'rating'],
      [SORT_ORDER.ADDED, 'created_at'],
    ];
    for (const [order, sort] of cases) {
      await parser.getList({ offset: 0, limit: 20, order });
      const catalogRequest = http.requests.filter((r) => r.url.includes('/manga?')).at(-1)!;
      const url = new URL(catalogRequest.url);
      expect(url.searchParams.get('sort')).toBe(sort);
    }
  });
});

describe('MangaBuff getHome', () => {
  it('reads all three carousels, both side lists and the updates feed', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/`, {
      status: 200,
      body: readFixture('mangabuff-home.html'),
    });
    const parser = createMangaBuffParser(makeContext(http));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);

    for (const { items } of sections) {
      for (const item of items) expect(item.url).toMatch(/^\/manga\/[^/]+$/);
    }
    // Строки списков приходят с обложкой x70 — в карточку берём x180.
    expect(sections[2]!.items[0]!.coverUrl).toContain('/x180/');
  });
});

describe('MangaBuff getBookmarks', () => {
  const USER_ID = 28145;
  const pageWithUser = (userId: number) =>
    `<html><head><meta name="csrf-token" content="csrf-abc"></head><body><script>
      window.isAuth = ${userId > 0 ? 1 : 0};
      window.user_id = ${userId};
    </script></body></html>`;

  const row = (slug: string, title: string, position: string | null) => `
    <div class="bookmark__manga" data-manga-id="1">
      <div class="bookmark__manga-container">
        <a href="https://${DOMAIN}/manga/${slug}" class="bookmark__manga-image" style="background-image: url('/x70/img/manga/posters/${slug}.jpg?1782880593')"></a>
        <label class="bookmark__edit"><input type="checkbox" class="bookmark__edit-checkbox"></label>
      </div>
      <div class="bookmark__manga-info">
        <a href="https://${DOMAIN}/manga/${slug}" class="bookmark__manga-name">${title}</a>
        <div class="bookmark__manga-chapter">1 том, 34 глава </div>
        ${position ? `<a href="/manga/${slug}/${position}" class="bookmark__manga-chapter">Прочитано до 11</a>` : ''}
      </div>
      <div class="bookmark__manga-right"><div class="bookmark__manga-date">21 час назад</div></div>
    </div>`;

  const menuItem = (id: number, name: string, count: number) => `
    <a href="https://${DOMAIN}/users/${USER_ID}/bookmarks?folder_id=${id}" class="side-menu__item " data-folder-id="${id}">
      <div class="side-menu__name"><i class="icon icon-reading"></i>${name}</div>
      <div class="side-menu__count">${count}</div>
    </a>`;

  const pagination = (folderId: number, pages: number[]) => `
    <ul class="pagination">${pages
      .map(
        (page) =>
          `<li class="pagination__button"><a href="https://${DOMAIN}/users/${USER_ID}/bookmarks?folder_id=${folderId}&amp;page=${page}">${page}</a></li>`,
      )
      .join('')}</ul>`;

  // Разметка — как у живой `/users/{id}/bookmarks` (проверено 2026-10-29).
  const bookmarksPage = (rows: string[], extra = '') => `<html><body><div class="bookmark">
    <div class="side-menu">
      <a href="https://${DOMAIN}/users/${USER_ID}/bookmarks" class="side-menu__item side-menu__item--active">
        <div class="side-menu__name"><i class="icon icon-all-list"></i>Весь список</div>
        <div class="side-menu__count">4</div>
      </a>
      ${menuItem(1, 'Читаю', 3)}
      ${menuItem(2, 'Буду читать', 0)}
      ${menuItem(7600, 'Мило', 1)}
      <a href="https://${DOMAIN}/users/${USER_ID}/favourites" class="side-menu__item side-menu__item--favourite">
        <div class="side-menu__name"><i class="icon icon-heart"></i>Избранное</div>
      </a>
    </div>
    <div class="bookmark__right">${rows.join('')}${extra}</div>
  </div></body></html>`;

  const setUp = (visitorId: number) => {
    const http = new FakeHttpClient();
    const bookmarksUrl = `https://${DOMAIN}/users/${USER_ID}/bookmarks`;
    http.register(
      (url) => url === `https://${DOMAIN}/`,
      () => ({
        status: 200,
        // После входа главная уже называет аккаунт.
        body: pageWithUser(
          http.requests.some((r) => r.url.endsWith('/login') && r.body) ? USER_ID : visitorId,
        ),
      }),
    );
    http.register((url, body) => url === `https://${DOMAIN}/login` && !body, {
      status: 200,
      body: pageWithUser(0),
    });
    http.register((url) => url === `https://${DOMAIN}/login`, { status: 200, body: '{}' });
    http.register((url) => url === `${bookmarksUrl}?folder_id=1`, {
      status: 200,
      body: bookmarksPage(
        [row('one', 'Первый', '1/11'), row('two', 'Второй', null)],
        pagination(1, [1, 2]),
      ),
    });
    http.register((url) => url === `${bookmarksUrl}?folder_id=1&page=2`, {
      status: 200,
      body: bookmarksPage([row('three', 'Третий', '4/16.2')], pagination(1, [2, 1, 2])),
    });
    http.register((url) => url === `${bookmarksUrl}?folder_id=7600`, {
      status: 200,
      body: bookmarksPage([row('four', 'Четвёртый', null)]),
    });
    http.register((url) => url === bookmarksUrl, { status: 200, body: bookmarksPage([]) });
    return http;
  };

  const asUser = <T>(fn: () => Promise<T>, session: SourceAccountSession = {}) =>
    runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.MANGABUFF]: { jar: new CookieJar(), ...session } },
      fn,
    );

  it('folders 1–4 are built-in, the rest own; rows read across pages, position from «Прочитано до»', async () => {
    const http = setUp(USER_ID);
    const parser = createMangaBuffParser(makeContext(http));

    const folders = await asUser(() => parser.getBookmarks!());

    expect(folders.map(({ id, builtIn, name }) => ({ id, builtIn, name }))).toEqual([
      { id: '1', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING, name: 'Читаю' },
      { id: '2', builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED, name: 'Буду читать' },
      { id: '7600', builtIn: null, name: 'Мило' },
    ]);
    const [reading, planned, own] = folders;
    expect(reading!.items[0]).toMatchObject({
      url: '/manga/one',
      title: 'Первый',
      coverUrl: `https://${DOMAIN}/x180/img/manga/posters/one.jpg?1782880593`,
      // «1 том, 34 глава» — последняя глава тайтла, а не место чтения.
      lastChapterNumber: 11,
      lastChapterVolume: 1,
    });
    expect(
      reading!.items.map(({ url, lastChapterNumber, lastChapterVolume }) => ({
        url,
        lastChapterNumber,
        lastChapterVolume,
      })),
    ).toEqual([
      { url: '/manga/one', lastChapterNumber: 11, lastChapterVolume: 1 },
      { url: '/manga/two', lastChapterNumber: null, lastChapterVolume: null },
      { url: '/manga/three', lastChapterNumber: 16.2, lastChapterVolume: 4 },
    ]);
    expect(planned!.items).toEqual([]);
    expect(own!.items.map(({ title }) => title)).toEqual(['Четвёртый']);
    // Пустую папку не открывают, на «Избранное» не ходят, вход не нужен.
    expect(http.requests.some(({ url }) => url.includes('folder_id=2'))).toBe(false);
    expect(http.requests.some(({ url }) => url.includes('favourites'))).toBe(false);
    expect(http.requests.some(({ url }) => url.endsWith('/login'))).toBe(false);
  });

  it('an expired session with a stored password logs in again', async () => {
    const http = setUp(0);
    const parser = createMangaBuffParser(makeContext(http));

    const folders = await asUser(() => parser.getBookmarks!(), {
      credentials: { username: 'reader@example.com', password: 'secret' },
    });

    expect(folders).toHaveLength(3);
    const login = http.requests.find(({ url, body }) => url.endsWith('/login') && body);
    expect(new URLSearchParams(login!.body).get('email')).toBe('reader@example.com');
  });

  it('an expired session without a password — auth required', async () => {
    const parser = createMangaBuffParser(makeContext(setUp(0)));

    await expect(asUser(() => parser.getBookmarks!())).rejects.toBeInstanceOf(
      SourceAuthRequiredError,
    );
  });

  it('without the user’s own account — auth required, no request', async () => {
    const http = setUp(USER_ID);
    const parser = createMangaBuffParser(makeContext(http));

    await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    expect(http.requests).toHaveLength(0);
  });
});

describe('MangaBuff login', () => {
  const LOGGER = { info: () => {}, warn: () => {}, error: () => {} };
  const CREDENTIALS = { username: 'reader@example.com', password: 'p&ss word' };
  const LOGIN_PAGE = '<html><head><meta name="csrf-token" content="csrf-abc"></head></html>';

  const setUp = (loginResponse: { status: number; body: string }, userId: number) => {
    const http = new FakeHttpClient();
    http.register((url, body) => url === `https://${DOMAIN}/login` && !body, {
      status: 200,
      body: LOGIN_PAGE,
    });
    http.register((url) => url === `https://${DOMAIN}/login`, loginResponse);
    http.register((url) => url === `https://${DOMAIN}/`, {
      status: 200,
      body: `<script>window.user_id = ${userId};</script>`,
    });
    return http;
  };

  it('posts the AJAX login with the page’s CSRF token and returns the id from `/`', async () => {
    const http = setUp({ status: 200, body: '{}' }, 42);

    expect(await loginMangaBuff(http, DOMAIN, CREDENTIALS, LOGGER)).toBe(42);
    // Сначала страница входа — токен Laravel сверяет с cookie сессии, что она ставит.
    expect(http.requests.map(({ url }) => url)).toEqual([
      `https://${DOMAIN}/login`,
      `https://${DOMAIN}/login`,
      `https://${DOMAIN}/`,
    ]);
    const post = http.requests[1]!;
    expect(post.headers['X-CSRF-TOKEN']).toBe('csrf-abc');
    const body = new URLSearchParams(post.body);
    expect(body.get('email')).toBe('reader@example.com');
    expect(body.get('password')).toBe('p&ss word');
  });

  it('a rejected password (422) — null, `/` is not even opened', async () => {
    const http = setUp(
      { status: 422, body: '{"message":"Неверный логин или пароль","errors":{}}' },
      0,
    );

    expect(await loginMangaBuff(http, DOMAIN, CREDENTIALS, LOGGER)).toBeNull();
    expect(http.requests.some(({ url }) => url === `https://${DOMAIN}/`)).toBe(false);
  });

  it('an accepted answer that leaves a guest — null', async () => {
    const http = setUp({ status: 200, body: '{}' }, 0);

    expect(await loginMangaBuff(http, DOMAIN, CREDENTIALS, LOGGER)).toBeNull();
  });

  it('the site asking for a captcha is a block, not a rejected password', async () => {
    const http = setUp({ status: 428, body: '{"captcha_required":true}' }, 0);

    await expect(loginMangaBuff(http, DOMAIN, CREDENTIALS, LOGGER)).rejects.toBeInstanceOf(
      SourceBlockedError,
    );
  });

  it('a site that is down is not a rejected password either', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/login`, { status: 503, body: '' });

    await expect(loginMangaBuff(http, DOMAIN, CREDENTIALS, LOGGER)).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
  });
});
