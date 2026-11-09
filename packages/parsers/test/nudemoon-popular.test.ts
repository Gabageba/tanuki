import { CookieJar } from 'tough-cookie';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SORT_ORDER, VIEW_MODE, TITLE_TYPE } from '@tanuki/contracts';
import { createNudeMoonParser } from '../src/sources/nudemoon';
import { getNudeMoonMonths, parseNudeMoonTop } from '../src/sources/nudemoon/home';
import { parseHtml } from '../src/core/html/dom';
import { ParseError } from '../src/errors';
import { generateUid } from '../src/core/uid';
import { FakeHttpClient } from './support/fake-http';
import { readFixture } from './support/fixtures';

const DOMAIN = 'nude-moon.example';
const HTML = readFixture('nudemoon-top.html');
const NOW = new Date('2026-11-06T00:00:00Z');
const setup = () => {
  const http = new FakeHttpClient();
  http.register((url) => url.endsWith('/top?like'), { status: 200, body: HTML });
  http.register((url) => url.endsWith('/top?vis'), {
    status: 200,
    body: HTML.replace('/101--sample.html', '/103--sample.html'),
  });
  const parser = createNudeMoonParser({
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    credentials: {},
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  });
  return { http, parser };
};

afterEach(() => vi.useRealTimers());

describe('Nude-Moon popular', () => {
  it('keeps month boundaries and site order, deduplicates previews and preserves real zero', () => {
    const months = parseNudeMoonTop(parseHtml(HTML, `https://${DOMAIN}/top?like`), NOW);
    const items = months.get('2026-11')!;
    expect(items.map(({ url }) => url)).toEqual(['/101--sample.html', '/102--sample.html']);
    expect(months.get('2026-10')).toHaveLength(1);
    expect(months.get('2026-09')).toEqual([]);
    expect(items[0]).toMatchObject({
      id: generateUid('nudemoon', '/101--sample.html'),
      title: 'Первый тайтл',
      altTitles: ['Original'],
      description: 'Описание первого тайтла.',
      authors: ['Автор А'],
      translators: ['Группа Б'],
      coverUrl: null,
      largeCoverUrl: null,
      likes: 0,
      views: 1500,
      rating: -1,
      chapters: null,
      type: TITLE_TYPE.MANGA,
    });
    expect(items[0]!.tags.map(({ title }) => title)).toEqual(['Приключения', 'Фэнтези']);
    expect(items[1]!.views).toBeNull();
  });

  it.each([
    { tag: 'комикс', type: TITLE_TYPE.COMICS },
    { tag: 'манхва', type: TITLE_TYPE.MANHWA },
  ])('preserves the $tag format from preview tags', ({ tag, type }) => {
    const months = parseNudeMoonTop(
      parseHtml(HTML.replace('фэнтези', tag), `https://${DOMAIN}/top?like`),
      NOW,
    );
    expect(months.get('2026-11')![0]!.type).toBe(type);
  });

  it('shares one response between concurrent months, isolates orders and ends after page one', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { parser, http } = setup();
    const [current, previous] = await Promise.all([
      parser.getHomeSection!('popular', { page: 1 }),
      parser.getHomeSection!('popular', { page: 1, variant: '2026-10' }),
    ]);
    expect(current!.items).toHaveLength(2);
    expect(previous!.items).toHaveLength(1);
    expect(http.requests).toHaveLength(1);
    const views = await parser.getHomeSection!('popular', { page: 1, order: SORT_ORDER.VIEWS });
    expect(views!.items[0]!.url).toBe('/103--sample.html');
    expect(http.requests).toHaveLength(2);
    expect(await parser.getHomeSection!('popular', { page: 2 })).toEqual({
      items: [],
      hasNextPage: false,
    });
    expect(http.requests).toHaveLength(2);
    expect((await parser.getHomeSection!('popular', { page: 1, variant: 'old' }))!.items).toEqual(
      current!.items,
    );
    expect(await parser.getHomeSection!('other', { page: 1 })).toBeNull();
  });

  it('updates metadata without rebuilding the parser, including the year boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime('2026-12-31T23:59:59Z');
    const { parser, http } = setup();
    expect(parser.info.homeSections[1]!.viewMode).toBe(VIEW_MODE.COVERLESS);
    expect(parser.info.homeSections[1]!.variants![0]!.id).toBe('2026-12');
    vi.setSystemTime('2027-01-01T00:00:00Z');
    expect(parser.info.homeSections[1]!.variants!.map(({ id }) => id)).toEqual([
      '2027-01',
      '2026-12',
      '2026-11',
    ]);
    expect(getNudeMoonMonths(new Date('2027-01-01T00:00:00Z'))[1]!.title).toBe('Декабрь 2026');
    expect(http.requests).toEqual([]);
  });

  it('does not relabel old site sections as a new calendar month', () => {
    const months = parseNudeMoonTop(
      parseHtml(HTML, `https://${DOMAIN}/top`),
      new Date('2026-12-01T00:00:00Z'),
    );
    expect(months.has('2026-12')).toBe(false);
    expect(months.get('2026-11')!.map(({ url }) => url)).toEqual([
      '/101--sample.html',
      '/102--sample.html',
    ]);
    expect(() => parseNudeMoonTop(parseHtml('<html></html>', DOMAIN), NOW)).toThrow(ParseError);
    expect(() =>
      parseNudeMoonTop(parseHtml(HTML.replace('за Ноябрь', 'сегодня'), DOMAIN), NOW),
    ).toThrow(ParseError);
  });

  it('refreshes the shared response after expiry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { parser, http } = setup();
    await parser.getHomeSection!('popular', { page: 1 });
    vi.setSystemTime(new Date(NOW.getTime() + 30 * 60_000));
    await parser.getHomeSection!('popular', { page: 1 });
    expect(http.requests).toHaveLength(2);
  });
});

it('retries a failed popular request without hiding new translations', async () => {
  const { http, parser } = setup();
  http.register((url) => url === `https://${DOMAIN}/`, {
    status: 200,
    body: readFixture('nudemoon-home.html'),
  });
  const fetch = vi.spyOn(http, 'getHtml');
  fetch.mockRejectedValueOnce(new Error('temporary failure'));
  await expect(parser.getHomeSection!('popular', { page: 1 })).rejects.toThrow('temporary failure');
  await expect(parser.getHomeSection!('popular', { page: 1 })).resolves.toMatchObject({
    hasNextPage: false,
  });
  const separate = setup();
  separate.http.register((url) => url === `https://${DOMAIN}/`, {
    status: 200,
    body: readFixture('nudemoon-home.html'),
  });
  const original = separate.http.getHtml.bind(separate.http);
  vi.spyOn(separate.http, 'getHtml').mockImplementation((url) =>
    url.includes('/top?') ? Promise.reject(new Error('top unavailable')) : original(url),
  );
  const sections = await separate.parser.getHome!();
  expect(sections[0]!.items).toHaveLength(3);
  expect(sections[1]!.items).toEqual([]);
});
