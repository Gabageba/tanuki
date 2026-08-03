import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createDesuParser } from '../src/sources/desu';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'desu.uno';

// Combined catalog + genre-filter fixture — both live at the same URL on the real site
// (the /manga/ catalog page embeds the genre filter widget inline).
const CATALOG_HTML = `<!doctype html><html><body>
  <div id="animeFilter">
    <div class="catalog-genres">
      <ul>
        <li><input data-genre-id="12" data-genre-slug="action" data-genre-name="боевик" /></li>
        <li><input data-genre-id="34" data-genre-slug="fantasy" data-genre-name="фэнтези" /></li>
      </ul>
    </div>
  </div>
  <ul>
    <li class="memberListItem">
      <h3><a class="animeTitle" href="/manga/solo-leveling.123">Solo Original Title</a></h3>
      <span class="dimmed oTitle">Поднятие уровня в одиночку</span>
      <a class="avatar"><span class="img" style="background-image:url('https://desu.uno/img/123-preview.jpg')"></span></a>
      <dl class="pairsInline"><dt>Жанры:</dt><dd>Боевик, Фэнтези</dd></dl>
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
    <div class="line"><span class="key">Статус:</span><span class="value"><span class="b-anime_status_tag ongoing"></span></span></div>
  </div>
  <div class="b-rate" data-score="8.7"></div>
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
  </ul>
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <script>
    Reader.init({
      dir: "https://static.desu.uno/manga/123/vol1/ch1/",
      prefix: "",
      pages: [["001.jpg", 800, 1200], ["002.jpg", 800, 1200], ["003.jpg", 800, 1200]]
    });
  </script>
</body></html>`;

function makeContext(http: FakeHttpClient): ParserContext {
  return {
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
}

function setUpFixtures(): FakeHttpClient {
  const http = new FakeHttpClient();
  http.register((url) => url === `https://${DOMAIN}/manga/`, { status: 200, body: CATALOG_HTML });
  http.register(
    (url) => url.startsWith(`https://${DOMAIN}/manga/solo-leveling.123`) && !url.includes('/vol'),
    { status: 200, body: DETAILS_HTML },
  );
  http.register((url) => url.includes('/vol1/ch1/'), { status: 200, body: PAGES_HTML });
  return http;
}

describe('Desu parser conformance', () => {
  const http = setUpFixtures();
  const parser = createDesuParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('DESUME');
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.tags.map((t) => t.title).sort()).toEqual(['Боевик', 'Фэнтези']);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/manga/solo-leveling.123');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.number).toBeGreaterThanOrEqual(0);
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.state).toBe('ONGOING');
    expect(manga.rating).toBeCloseTo(0.87, 5);
    expect(manga.title).toBe('Поднятие уровня в одиночку');
    expect(manga.description).toBe('Первый абзац.\n\nВторой абзац.');
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
