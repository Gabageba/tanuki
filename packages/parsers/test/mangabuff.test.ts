import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createMangaBuffParser } from '../src/sources/mangabuff';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

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

// .manga__middle-links packs type/year/status as three <a>s told apart by href shape, not
// position — /types/<slug> is the type, /types/<slug>/<year> the year, /manga?status_id[]= the
// status. Genres live separately, under .tags, alongside the age-rating badge.
const DETAILS_HTML = `<!doctype html><html><body>
  <h1>Ван-Пис</h1>
  <div class="manga" data-id="42" data-fav-count="1234"></div>
  <div class="manga__img"><img src="/img/manga/posters/one-piece-full.jpg" /></div>
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
    <span class="chapters__value">Глава 2</span>
    <span class="chapters__add-date">02.01.2024</span>
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
  http.register((url) => url.includes('/manga?'), { status: 200, body: LIST_HTML });
  return http;
};

describe('MangaBuff parser conformance', () => {
  const http = setUpFixtures();
  const parser = createMangaBuffParser(makeContext(http));

  it('getList: chapters null, rating/type from the card, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('MANGABUFF');
    expect(item!.rating).toBeCloseTo(0.94, 5);
    expect(item!.type).toBe('MANGA');
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
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
    expect(manga.rating).toBeCloseTo(0.87, 5);
    expect(manga.state).toBe('ONGOING');
    expect(manga.type).toBe('MANGA');
    expect(manga.year).toBe(1997);
    expect(manga.contentRating).toBe('SUGGESTIVE');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(manga.description).toContain('Описание тайтла.');
    expect(manga.description).toContain('Рейтинг: 87%');
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
      'genre',
      'type',
      'tag',
      'status',
      'ageRating',
      'rating',
      'year',
      'chaptersCount',
    ]);

    const genre = groups.find((g) => g.id === 'genre')!;
    expect(genre.type).toBe('SEARCHABLE_CHECKBOX_EXCLUDE');
    expect(genre.options).toEqual([
      { key: '1', title: 'Арт', count: null },
      { key: '4', title: 'Боевые искусства', count: null },
    ]);

    const type = groups.find((g) => g.id === 'type')!;
    expect(type.type).toBe('CHECKBOX_EXCLUDE');
    expect(type.options).toEqual([
      { key: '1', title: 'Манга', count: null },
      { key: '3', title: 'Манхва', count: null },
    ]);

    const tag = groups.find((g) => g.id === 'tag')!;
    expect(tag.type).toBe('SEARCHABLE_CHECKBOX_EXCLUDE');
    expect(tag.options).toEqual([
      { key: '7759', title: 'Азартные игры', count: null },
      { key: '7750', title: 'Алхимия', count: null },
    ]);

    const status = groups.find((g) => g.id === 'status')!;
    expect(status.type).toBe('CHECKBOX');
    expect(status.options).toEqual([
      { key: '1', title: 'Завершен', count: null },
      { key: '2', title: 'Продолжается', count: null },
    ]);

    const chaptersCount = groups.find((g) => g.id === 'chaptersCount')!;
    expect(chaptersCount.title).toBe('Количество глав');
    expect(chaptersCount.type).toBe('CHECKBOX');
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
        { groupId: 'genre', key: '1' },
        { groupId: 'genre', key: '4', exclude: true },
        { groupId: 'type', key: '3', exclude: true },
        { groupId: 'status', key: '2' },
        { groupId: 'chaptersCount', key: '200' },
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
      ['UPDATED', 'updated_at'],
      ['POPULARITY', 'real_views'],
      ['RATING', 'rating'],
      ['ADDED', 'created_at'],
    ];
    for (const [order, sort] of cases) {
      await parser.getList({ offset: 0, limit: 20, order });
      const catalogRequest = http.requests.filter((r) => r.url.includes('/manga?')).at(-1)!;
      const url = new URL(catalogRequest.url);
      expect(url.searchParams.get('sort')).toBe(sort);
    }
  });
});
