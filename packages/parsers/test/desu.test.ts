import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  FILTER_TYPE,
  SOURCE_AUTH_FAMILY,
  TITLE_STATE,
  TITLE_TYPE,
} from '@tanuki/contracts';
import { createDesuParser, DESU_FILTER_GROUP } from '../src/sources/desu';
import { loginDesu } from '../src/sources/desu/auth';
import { runWithSourceAccounts, type SourceAccountSession } from '../src/core/source-accounts';
import { SourceAuthRequiredError, SourceBlockedError, SourceUnavailableError } from '../src/errors';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';
import { readFixture } from './support/fixtures';
import { checkHome } from './support/home';

const DOMAIN = 'desu.uno';

// Combined catalog + genre-filter fixture — both live at the same URL on the real site
// (the /manga/ catalog page embeds the genre filter widget inline).
const CATALOG_HTML = `<!doctype html><html><body>
  <div id="animeFilter">
    <ul class="catalog-kinds">
      <li><div class="filter-control kind-checkbox"><input class="filter-control-input" data-kind="manga" value="0"> <span class="filter-control-text">Манга</span></div></li>
      <li><div class="filter-control kind-checkbox"><input class="filter-control-input" data-kind="manhwa" value="0"> <span class="filter-control-text">Манхва</span></div></li>
    </ul>
    <div class="catalog-genres">
      <ul>
        <li><div class="filter-control genre-checkbox"><input data-genre-id="12" data-genre-slug="action" data-genre-name="боевик" value="0" /> <span class="filter-control-text">Боевик</span> <span>(130)</span></div></li>
        <li><div class="filter-control genre-checkbox"><input data-genre-id="34" data-genre-slug="fantasy" data-genre-name="фэнтези" value="0" /> <span class="filter-control-text">Фэнтези</span> <span>(3631)</span></div></li>
        <li style="width:100% !important;height:10px !important;"></li>
        <li><div class="filter-control genre-checkbox"><input data-genre-id="150" data-genre-slug="Artifacts" data-genre-name="артефакты" value="0" /> <span class="filter-control-text"><span style="padding-right:1px;color:rgb(150,150,150)">#</span>Артефакты</span> <span style="font-size:10px;color:rgb(150,150,150);padding-left:2px;">(477)</span></div></li>
      </ul>
    </div>
    <ul class="catalog-status">
      <li><div class="filter-control status-checkbox"><input class="filter-control-input" data-status="ongoing" value="0"> <span class="filter-control-text">Выходит</span></div></li>
      <li><div class="filter-control status-checkbox"><input class="filter-control-input" data-status="completed" value="0"> <span class="filter-control-text">Завершено</span></div></li>
      <li><div class="filter-control status-checkbox"><input class="filter-control-input" data-status="no18plus" value="0"> <span class="filter-control-text">Без 18+</span></div></li>
    </ul>
  </div>
  <ul>
    <li class="memberListItem">
      <h3><a class="animeTitle" href="/manga/solo-leveling.123">Solo Original Title</a></h3>
      <span class="dimmed oTitle">Поднятие уровня в одиночку</span>
      <a class="avatar"><span class="img" style="background-image:url('https://desu.uno/img/123-preview.jpg')"></span></a>
      <dl class="pairsInline"><dt>Жанры:</dt><dd>Боевик, Фэнтези</dd></dl>
      <dl class="pairsInline"><dt>Тип:</dt><dd>Манхва</dd><dt>Год:</dt><dd>2018</dd></dl>
      <dl class="pairsInline"><dt>Рейтинг:</dt><dd>8.5</dd></dl>
    </li>
  </ul>
</body></html>`;

const DETAILS_HTML = `<!doctype html><html><body>
  <h1><span class="name">Solo Leveling</span><span class="rus-name">Поднятие уровня в одиночку</span></h1>
  <div class="alternativeHeadline">Only I Level Up, 나 혼자만 레벨업</div>
  <div class="c-info-left">
    <div class="tagList">
      <a itemprop="genre" href="/manga/?genres=12">#Боевик</a>
      <a itemprop="genre" href="/manga/?genres=34">#Фэнтези</a>
    </div>
  </div>
  <div class="line-container">
    <div class="line"><span class="key">Тип:</span><span class="value">Манга</span></div>
  </div>
  <div class="line-container">
    <div class="line"><span class="key">Статус:</span><span class="value"><span class="b-anime_status_tag ongoing">выходит</span> с 14 июн 2012 г.</span></div>
  </div>
  <div class="line-container">
    <div class="line"><span class="key">Перевод:</span><span class="value"><span class="b-anime_status_tag continued">продолжается</span></span></div>
  </div>
  <div class="line-container">
    <div class="line"><span class="key">Авторы:</span><span class="value"><a href="/manga/?people=1-chugong">Chugong</a></span></div>
  </div>
  <div class="line-container">
    <div class="line"><span class="key">Просмотров:</span><span class="value"><span class="value">23921</span></span></div>
  </div>
  <div class="line-container">
    <div class="line"><span class="key">Переводчики:</span><span class="value"><a href="https://vk.com/team">Dead Inside Team</a></span></div>
  </div>
  <div class="b-rate" data-score="8.7">
    <meta content="39" itemprop="ratingCount">
  </div>
  <div id="description"><div class="russian"><div class="prgrph">Первый абзац.</div><div class="prgrph">Второй абзац.</div></div></div>
  <div class="c-poster"><img itemprop="image" src="https://desu.uno/img/123-full.jpg" /></div>
  <ul class="chlist">
    <li>
      <h4><a href="/manga/solo-leveling.123/vol1/ch2/">Глава 2</a></h4>
      <i class="chDownload" data-chapters_id="9002"></i>
      <span class="date">Сегодня в 10:00</span>
    </li>
    <li>
      <h4><a href="/manga/solo-leveling.123/vol1/ch1/">Глава 1</a></h4>
      <i class="chDownload" data-chapters_id="9001"></i>
      <span class="date">Вчера в 09:30</span>
    </li>
    <li>
      <h4><a href="/manga/solo-leveling.123/vol1/ch0/">Глава 0 - Вступительная глава</a></h4>
      <i class="chDownload" data-chapters_id="9000"></i>
      <span class="date">Вчера в 09:00</span>
    </li>
  </ul>
</body></html>`;

// The reader page only bootstraps a chapter id + api base path now — the page list itself comes
// from a follow-up JSON call to `${apiBaseUrl}/chapters/${chapter.id}` (ClassicReaderApi.init
// replaced the old Reader.init(dir/prefix/pages) inline payload).
const PAGES_HTML = `<!doctype html><html><body>
  <script>
    window.MangaReader = {"manga":{"id":123,"name":"Solo Leveling"},"chapter":{"id":9001,"volume":"1","number":"1"},"apiBaseUrl":"/api/manga/123"};
    $(document).ready(function() {
        ClassicReaderApi.init(window.MangaReader);
    });
  </script>
</body></html>`;

const PAGES_API_JSON = JSON.stringify({
  chapter: {
    pages: [
      { page: 1, url: 'https://static.desu.uno/manga/123/vol1/ch1/001.jpg' },
      { page: 2, url: 'https://static.desu.uno/manga/123/vol1/ch1/002.jpg' },
      { page: 3, url: 'https://static.desu.uno/manga/123/vol1/ch1/003.jpg' },
    ],
  },
});

// Real XenForo search response shape — templateHtml embeds AniMangaSearchCard markup, not the
// blockLinksList/itemTitle classes an older site layout used.
const SEARCH_JSON = JSON.stringify({
  templateHtml: `
    <ul class="AniMangaSearchList" data-search-content-type="manga">
      <li class="AniMangaSearchCard">
        <a href="manga/naruto.29/" class="AniMangaSearchCard__link">
          <img src="https://static.desu.uno/data/manga/covers/x120/29.jpg" class="AniMangaSearchCard__cover" />
          <span class="AniMangaSearchCard__title">Наруто</span>
          <span class="AniMangaSearchCard__subtitle">Naruto</span>
        </a>
      </li>
    </ul>`,
});

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
  http.register((url) => url === `https://${DOMAIN}/manga/`, { status: 200, body: CATALOG_HTML });
  // Filtered/paginated catalog requests append a query string (?kinds=...&page=2 etc.) — same
  // fixture body, the assertions on filter params read `http.requests`, not this response.
  http.register((url) => url.startsWith(`https://${DOMAIN}/manga/?`), {
    status: 200,
    body: CATALOG_HTML,
  });
  http.register(
    (url) => url.startsWith(`https://${DOMAIN}/manga/solo-leveling.123`) && !url.includes('/vol'),
    { status: 200, body: DETAILS_HTML },
  );
  http.register((url) => url.startsWith(`https://${DOMAIN}/manga/adult-title.456`), {
    status: 200,
    body: DETAILS_HTML.replace('class="c-poster"', 'class="c-poster age_18_plus"'),
  });
  http.register((url) => url.includes('/vol1/ch1/'), { status: 200, body: PAGES_HTML });
  http.register((url) => url === `https://${DOMAIN}/api/manga/123/chapters/9001`, {
    status: 200,
    body: PAGES_API_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url === `https://${DOMAIN}/manga/search/`, {
    status: 200,
    body: SEARCH_JSON,
    contentType: 'application/json',
  });
  return http;
};

describe('Desu parser conformance', () => {
  const http = setUpFixtures();
  const parser = createDesuParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.DESUME);
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.tags.map((t) => t.title).sort()).toEqual(['Боевик', 'Фэнтези']);
    expect(item!.type).toBe(TITLE_TYPE.MANHWA);
    expect(item!.year).toBe(2018);
  });

  it('getDetails: contentRating comes off the poster age_18_plus marker, same as the catalog card', async () => {
    const adult = await parser.getDetails('/manga/adult-title.456');
    expect(adult.contentRating).toBe(CONTENT_RATING.ADULT);
    const regular = await parser.getDetails('/manga/solo-leveling.123');
    expect(regular.contentRating).toBeNull();
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/manga/solo-leveling.123');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(3);
    for (const chapter of manga.chapters!) {
      expect(chapter.number).not.toBeNull();
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    // "Глава 0" — вступительная глава с настоящим номером 0, а не глава без номера.
    expect(manga.chapters![0]!.number).toBe(0);
    expect(manga.chapters![0]!.volume).toBe(1);
    // Title strips the "Глава N" prefix that duplicates the `number` field — only the text after
    // the dash, if any, survives as the chapter title.
    expect(manga.chapters![0]!.title).toBe('Вступительная глава');
    expect(manga.chapters![1]!.title).toBeNull();
    expect(manga.chapters![2]!.title).toBeNull();
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.releaseState).toBe(TITLE_STATE.ONGOING);
    expect(manga.translationState).toBe(TITLE_STATE.ONGOING);
    expect(manga.type).toBe(TITLE_TYPE.MANGA);
    expect(manga.year).toBe(2012);
    expect(new Date(manga.releaseDate!).toISOString().slice(0, 10)).toBe('2012-06-14');
    expect(manga.authors).toEqual(['Chugong']);
    expect(manga.rating).toBeCloseTo(0.87, 5);
    expect(manga.title).toBe('Поднятие уровня в одиночку');
    expect(manga.description).toBe('Первый абзац.\n\nВторой абзац.');
    expect(manga.originalTitle).toEqual(['Solo Leveling']);
    // The original title has its own dedicated field now — altTitles only carries the site's
    // own "Другие названия:" list, not a duplicate of it.
    expect(manga.altTitles).toEqual(['Only I Level Up', '나 혼자만 레벨업']);
    expect(manga.translators).toEqual(['Dead Inside Team']);
    expect(manga.views).toBe(23921);
    expect(manga.votesCount).toBe(39);
  });

  it('getList with query: parses AniMangaSearchCard results', async () => {
    const items = await parser.getList({ offset: 0, limit: 20, query: 'наруто' });
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toBe('Наруто');
    expect(items[0]!.altTitles).toEqual(['Naruto']);
    expect(items[0]!.url).toBe('/manga/naruto.29/');
  });

  it('getFilters: all five groups with their options and counts', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      DESU_FILTER_GROUP.KIND,
      DESU_FILTER_GROUP.GENRE,
      DESU_FILTER_GROUP.TAG,
      DESU_FILTER_GROUP.STATUS,
      DESU_FILTER_GROUP.RATING,
    ]);

    const kind = groups.find((g) => g.id === DESU_FILTER_GROUP.KIND)!;
    expect(kind.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(kind.options).toEqual([
      { key: 'manga', title: 'Манга', count: null },
      { key: 'manhwa', title: 'Манхва', count: null },
    ]);

    const genre = groups.find((g) => g.id === DESU_FILTER_GROUP.GENRE)!;
    expect(genre.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(genre.options).toEqual([
      { key: '12-action', title: 'Боевик', count: 130 },
      { key: '34-fantasy', title: 'Фэнтези', count: 3631 },
    ]);

    const tag = groups.find((g) => g.id === DESU_FILTER_GROUP.TAG)!;
    expect(tag.title).toBe('Теги');
    expect(tag.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(tag.options).toEqual([{ key: '150-Artifacts', title: 'Артефакты', count: 477 }]);

    const status = groups.find((g) => g.id === DESU_FILTER_GROUP.STATUS)!;
    expect(status.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(status.options).toEqual([
      { key: 'ongoing', title: 'Выходит', count: null },
      { key: 'completed', title: 'Завершено', count: null },
    ]);

    const rating = groups.find((g) => g.id === DESU_FILTER_GROUP.RATING)!;
    expect(rating.title).toBe('Возрастное ограничение');
    expect(rating.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(rating.options).toEqual([{ key: 'no18plus', title: 'Без 18+', count: null }]);
  });

  it('getList with filters: kinds/status are plain lists, genre exclude packs "id-!slug"', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: DESU_FILTER_GROUP.KIND, key: 'manga' },
        { groupId: DESU_FILTER_GROUP.STATUS, key: 'ongoing' },
        { groupId: DESU_FILTER_GROUP.GENRE, key: '12-action' },
        { groupId: DESU_FILTER_GROUP.GENRE, key: '34-fantasy', exclude: true },
      ],
    });
    const catalogRequest = http.requests.find((r) => r.url.startsWith(`https://${DOMAIN}/manga/?`));
    expect(catalogRequest).toBeDefined();
    const url = new URL(catalogRequest!.url);
    expect(url.searchParams.get('kinds')).toBe('manga');
    expect(url.searchParams.get('status')).toBe('ongoing');
    expect(url.searchParams.get('genres')).toBe('12-action,34-!fantasy');
  });

  it('getList with filters: "tag" group folds into the shared genres param', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: DESU_FILTER_GROUP.GENRE, key: '12-action' },
        { groupId: DESU_FILTER_GROUP.TAG, key: '150-Artifacts' },
      ],
    });
    const catalogRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${DOMAIN}/manga/?`))
      .at(-1);
    const url = new URL(catalogRequest!.url);
    expect(url.searchParams.get('genres')).toBe('12-action,150-Artifacts');
  });

  it('getList with filters: "rating" group folds into the shared status param', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: DESU_FILTER_GROUP.STATUS, key: 'ongoing' },
        { groupId: DESU_FILTER_GROUP.RATING, key: 'no18plus' },
      ],
    });
    const catalogRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${DOMAIN}/manga/?`))
      .at(-1);
    const url = new URL(catalogRequest!.url);
    expect(url.searchParams.get('status')).toBe('ongoing,no18plus');
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/manga/solo-leveling.123');
    const chapterUrl = manga.chapters!.find((c) => c.url.includes('ch1'))!.url;
    const pages = await parser.getPages(chapterUrl);
    expect(pages).toHaveLength(3);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://static.desu.uno/manga/123/vol1/ch1/001.jpg');
  });
});

describe('Desu getHome', () => {
  it('finds both manga blocks by heading, original title from the link title', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/`, {
      status: 200,
      body: readFixture('desu-home.html'),
    });
    const parser = createDesuParser(makeContext(http));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);

    const first = sections[0]!.items[0]!;
    expect(first.url).toMatch(/^\/manga\/[^/]+\.\d+\/$/);
    expect(first.altTitles).toHaveLength(1);
  });

  it('a block missing from the page comes back empty', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/`, {
      status: 200,
      body: '<html><body><div class="subheadline">Горячие новинки манги</div><div></div></body></html>',
    });
    const sections = await createDesuParser(makeContext(http)).getHome!();

    expect(sections.every(({ items }) => items.length === 0)).toBe(true);
  });
});

describe('Desu getBookmarks', () => {
  const USER_ID = 87654;
  const pageWithVisitor = (userId: number) =>
    `<html><body><script>XenForo.init({ visitor: { user_id: ${userId} } });</script></body></html>`;

  const row = (id: number, chapters: number, bookmark: string | null, altName = 'Выходной') => `
    <tr class="user_rate selectable editable" data-manga_id="${id}">
      <td class="index"><span>1</span></td>
      <td class="cover"><img class="lazy" src="data:image/gif;base64,R0lGOD" data-src="https://static.desu.uno/data/manga/covers/x120/${id}.jpg" /></td>
      <td class="name">
        <div class="name-block">
          <span class="name-block-base"><a class="tooltipped" href="manga/title-${id}.${id}/">Title ${id}</a></span>
          <span class="name-block-altnames">${altName} </span>
          <span class="name-block-status rewatches ongoing">выходит</span>
        </div>
      </td>
      <td class="num hoverable"><span class="current-value" data-field="score">-</span></td>
      <td class="num hoverable">
        <span class="current-value" data-field="chapters"><span>${chapters}</span></span>
        <span class="misc-value"></span>
      </td>
      <td class="num hoverable bookmark">${
        bookmark
          ? `<a class="Tooltip" href="/manga/title_${id}/${bookmark}/rus#page=6" title="Продолжить чтение">4 - 24</a>`
          : ''
      }</td>
      <td class="num">Манхва</td>
    </tr>`;

  const group = (status: string, title: string, rows: string[]) => `
    <header class="status-1"><div class="subheadline">${title}
      </div></header>
    <table id="status_${status}_block" style="display: none;" class="b-table list-lines tablesorter">
      <thead><tr><th class="index">#</th></tr></thead>
      <tbody class="entries">${rows.join('')}</tbody>
    </table>`;

  // Разметка списка — как у живой `/manga/list/<slug>.<id>/` (проверено 2026-10-26).
  const LIST_HTML = `<html><body><div id="userMyList"><div class="list-groups">
    ${group('planned', 'Запланировано', [row(3943, 0, null, '')])}
    ${group('watching', 'Читаю', [row(2240, 23, 'vol4/ch24'), row(5759, 12, null)])}
    ${group('on_hold', 'Отложено', [row(7001, 0, null)])}
    ${group('favorites', 'Любимое', [])}
  </div></div></body></html>`;

  const setUp = (visitorId: number) => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/`, {
      status: 200,
      body: pageWithVisitor(visitorId),
    });
    http.register((url) => url === `https://${DOMAIN}/login/login`, {
      status: 200,
      body: pageWithVisitor(USER_ID),
    });
    http.register((url) => url === `https://${DOMAIN}/login/`, {
      status: 200,
      body: pageWithVisitor(0),
    });
    http.register((url) => url === `https://${DOMAIN}/manga/list/${USER_ID}/`, {
      status: 200,
      body: LIST_HTML,
    });
    return http;
  };

  const asUser = <T>(fn: () => Promise<T>, session: SourceAccountSession = {}) =>
    runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.DESU]: { jar: new CookieJar(), ...session } }, fn);

  it('maps list statuses to built-in or own folders, position from the bookmark', async () => {
    const http = setUp(USER_ID);
    const parser = createDesuParser(makeContext(http));

    const folders = await asUser(() => parser.getBookmarks!());

    expect(folders.map(({ id, builtIn, name }) => ({ id, builtIn, name }))).toEqual([
      { id: 'planned', builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED, name: 'Запланировано' },
      { id: 'watching', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING, name: 'Читаю' },
      { id: 'on_hold', builtIn: BUILT_IN_BOOKMARK_FOLDER.ON_HOLD, name: 'Отложено' },
      { id: 'favorites', builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE, name: 'Любимое' },
    ]);
    const [planned, reading] = folders;
    expect(planned!.items[0]).toMatchObject({
      url: '/manga/title-3943.3943/',
      // Русского названия нет — остаётся оригинальное.
      title: 'Title 3943',
      coverUrl: 'https://static.desu.uno/data/manga/covers/preview/3943.jpg',
      type: TITLE_TYPE.MANHWA,
      lastChapterNumber: null,
      lastChapterVolume: null,
    });
    expect(
      reading!.items.map(({ title, lastChapterNumber, lastChapterVolume }) => ({
        title,
        lastChapterNumber,
        lastChapterVolume,
      })),
    ).toEqual([
      // Закладка точнее счётчика «Главы»: глава 24 тома 4, а не 23 прочитанных.
      { title: 'Выходной', lastChapterNumber: 24, lastChapterVolume: 4 },
      { title: 'Выходной', lastChapterNumber: 12, lastChapterVolume: null },
    ]);
    expect(http.requests.some(({ url }) => url.endsWith('/login/login'))).toBe(false);
  });

  it('an expired session with a stored password logs in again', async () => {
    const http = setUp(0);
    const parser = createDesuParser(makeContext(http));

    const folders = await asUser(() => parser.getBookmarks!(), {
      credentials: { username: 'reader', password: 'secret' },
    });

    expect(folders).toHaveLength(4);
    const login = http.requests.find(({ url }) => url.endsWith('/login/login'));
    expect(new URLSearchParams(login!.body).get('login')).toBe('reader');
  });

  it('an expired session without a password — auth required', async () => {
    const parser = createDesuParser(makeContext(setUp(0)));

    await expect(asUser(() => parser.getBookmarks!())).rejects.toBeInstanceOf(
      SourceAuthRequiredError,
    );
  });

  it('without the user’s own account — auth required, no request', async () => {
    const http = setUp(USER_ID);
    const parser = createDesuParser(makeContext(http));

    await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    expect(http.requests).toHaveLength(0);
  });
});

describe('Desu login', () => {
  const LOGGER = { info: () => {}, warn: () => {}, error: () => {} };
  const CREDENTIALS = { username: 'reader', password: 'p&ss word' };

  const setUp = (loginPage: string) => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/login/`, { status: 200, body: '' });
    http.register((url) => url === `https://${DOMAIN}/login/login`, {
      status: 200,
      body: loginPage,
    });
    return http;
  };

  it('returns the account id from the page the accepted login lands on', async () => {
    const http = setUp('<script>XenForo.init({ visitor: { user_id: 42 } });</script>');

    expect(await loginDesu(http, DOMAIN, CREDENTIALS, LOGGER)).toBe(42);
    // Сначала страница входа — без её cookie XenForo отвергает форму, не глядя на пароль.
    expect(http.requests.map(({ url }) => url)).toEqual([
      `https://${DOMAIN}/login/`,
      `https://${DOMAIN}/login/login`,
    ]);
    const body = new URLSearchParams(http.requests[1]!.body);
    expect(body.get('login')).toBe('reader');
    expect(body.get('password')).toBe('p&ss word');
    expect(body.get('remember')).toBe('1');
  });

  it('a rejected password leaves a guest — null', async () => {
    const http = setUp('<div class="errorPanel"></div><script>visitor: { user_id: 0 },</script>');

    expect(await loginDesu(http, DOMAIN, CREDENTIALS, LOGGER)).toBeNull();
  });

  it('a site that is down is not a rejected password — the error goes up', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/login/`, { status: 503, body: '' });

    await expect(loginDesu(http, DOMAIN, CREDENTIALS, LOGGER)).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
  });

  it('an antibot page on the form is not a rejected password either', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/login/`, { status: 200, body: '' });
    http.register((url) => url === `https://${DOMAIN}/login/login`, {
      status: 403,
      body: '<title>Just a moment...</title>',
    });

    await expect(loginDesu(http, DOMAIN, CREDENTIALS, LOGGER)).rejects.toBeInstanceOf(
      SourceBlockedError,
    );
  });
});
