import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { URL, URLSearchParams } from 'node:url';
import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';

const CHAPTERS = Array.from({ length: 40 }, (_, number) => ({
  id: `source:chapter-${number}`,
  titleId: 'source:title',
  number,
  volume: null,
  title: null,
  branch: null,
}));
const HARNESS = `<!doctype html><html><head></head><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useLocation } from 'react-router';
import { READER_READING_MODE } from '@tanuki/contracts';
import useReaderFeed from '/src/pages/Reader/hooks/useReaderFeed.ts';
import useSaveReadingProgress from '/src/pages/Reader/hooks/useSaveReadingProgress.ts';
import useRecordChapterRead from '/src/pages/Reader/hooks/useRecordChapterRead.ts';
const client = new QueryClient({defaultOptions: {
  queries: {staleTime: Infinity, retry: false}, mutations: {retryDelay: 50},
}});
client.setQueryData(['auth', 'me'], {id: 'reader'});
client.setQueryData(['chapters', 'source:title', null], {items: ${JSON.stringify(CHAPTERS)}});
function Probe() {
  const [position, setPosition] = React.useState({chapterId: 'source:chapter-0', pageIndex: 0});
  useSaveReadingProgress({titleId: 'source:title', position});
  useRecordChapterRead({titleId: 'source:title', position, pagesLength: 4});
  React.useLayoutEffect(() => {
    globalThis.window.harness = {setPosition, client, unmount: () => root.unmount()};
  });
  return null;
}
function VerticalProbe() {
  const location = useLocation();
  const chapterId = decodeURIComponent(location.pathname.split('/read/')[1] ?? 'source:chapter-0');
  const feed = useReaderFeed({titleId: 'source:title', chapterId,
    readingMode: READER_READING_MODE.VERTICAL, autoNextChapter: true, pageStep: 1, prefetchPages: 0});
  useSaveReadingProgress({titleId: 'source:title', position: feed.activeChapter?.pages.length ? feed.position : null});
  useRecordChapterRead({titleId: 'source:title', position: feed.position,
    pagesLength: feed.activeChapter?.pages.length || null});
  React.useLayoutEffect(() => { globalThis.window.harness = {client}; });
  return React.createElement('main', {style: {paddingBottom: 800}}, feed.chapters.map(chapter =>
    React.createElement('section', {key: chapter.chapterId, style: {marginBottom: 64}}, chapter.pages.map(page =>
      React.createElement('div', {key: page.index, ref: feed.registerPage,
        'data-chapter-id': chapter.chapterId, 'data-page-index': page.index,
        style: {height: 600}}, chapter.chapterId + ':' + page.index)))));
}
function EntryProbe() {
  const [opened, setOpened] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!opened) globalThis.window.harness = {openReader: () => setOpened(true)};
  }, [opened]);
  return opened ? React.createElement(VerticalProbe) : React.createElement('main', {style: {height: 4000}});
}
const vertical = new URLSearchParams(location.search).has('vertical');
const entry = new URLSearchParams(location.search).has('entry');
const root = createRoot(document.getElementById('root'));
root.render(
  React.createElement(QueryClientProvider, {client}, React.createElement(BrowserRouter, null,
    React.createElement(entry ? EntryProbe : vertical ? VerticalProbe : Probe))));
</script></body></html>`;

let server;
let browser;
before(async () => {
  server = await createServer({
    root: new URL('..', import.meta.url).pathname,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0 },
    plugins: [
      {
        name: 'reader-progress-harness',
        configureServer(vite) {
          vite.middlewares.use('/reader-progress-test', async (_request, response) => {
            response.setHeader('Content-Type', 'text/html');
            response.end(await vite.transformIndexHtml('/reader-progress-test', HARNESS));
          });
        },
      },
    ],
  });
  await server.listen();
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await server?.close();
});

const openReader = async ({
  progressStatus = () => 200,
  readStatus = () => 204,
  waitProgress = async () => {},
  vertical = false,
  entryScroll,
  resumePage,
} = {}) => {
  const page = await browser.newPage();
  const saves = [];
  const reads = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const body = request.postDataJSON();
    if (request.url().endsWith('/pages')) {
      const chapter = Number(/chapter-(\d+)/.exec(request.url())[1]);
      await route.fulfill({
        json: {
          items: Array.from({ length: 4 }, (_, index) => ({
            index,
            url: 'unused',
            width: 375,
            height: 600,
          })),
          prevChapterId: chapter ? `source:chapter-${chapter - 1}` : null,
          nextChapterId: chapter < 39 ? `source:chapter-${chapter + 1}` : null,
        },
      });
    } else if (request.url().endsWith('/progress')) {
      saves.push(body);
      const status = progressStatus();
      await waitProgress();
      await route.fulfill({
        status,
        json:
          status === 200
            ? {
                chapterId: body.chapterId,
                pageIndex: body.pageIndex,
              }
            : { error: { code: 'internal', message: 'Временный сбой' } },
      });
    } else if (request.url().endsWith('/chapter-reads')) {
      reads.push(body);
      const status = readStatus(body.chapterId);
      await route.fulfill({
        status,
        ...(status === 204
          ? {}
          : {
              json: { error: { code: 'internal', message: 'Временный сбой' } },
            }),
      });
    } else await route.fulfill({ status: 204 });
  });
  await page.clock.install();
  const params = new URLSearchParams();
  if (vertical) params.set('vertical', '');
  if (entryScroll !== undefined) params.set('entry', '');
  if (resumePage !== undefined) params.set('page', String(resumePage));
  await page.goto(`${server.resolvedUrls.local[0]}reader-progress-test?${params}`);
  await page.waitForFunction(() => Boolean(globalThis.window.harness));
  if (entryScroll !== undefined) {
    await page.evaluate((top) => {
      globalThis.window.scrollTo({ top, behavior: 'instant' });
      globalThis.window.harness.openReader();
    }, entryScroll);
    await page.waitForFunction(() => Boolean(globalThis.window.harness.client));
  }
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  return { page, saves, reads, errors };
};
const goTo = async (page, chapter, pageIndex) => {
  await page.evaluate(
    ({ chapter, pageIndex }) => {
      globalThis.window.harness.setPosition({ chapterId: `source:chapter-${chapter}`, pageIndex });
    },
    { chapter, pageIndex },
  );
  await expect
    .poll(() => ownPosition(page))
    .toEqual({
      chapterId: `source:chapter-${chapter}`,
      pageIndex,
    });
};
const ownPosition = (page) =>
  page.evaluate(() => {
    const own = globalThis.window.harness.client.getQueryData([
      'reading-progress',
      'source:title',
    ])?.own;
    return own && { chapterId: own.chapterId, pageIndex: own.pageIndex };
  });

test('непрерывное чтение 30 глав сохраняет промежуточный прогресс и все прочтения', async () => {
  const { page, saves, reads, errors } = await openReader();
  try {
    for (let chapter = 0; chapter < 30; chapter++) {
      for (let index = 0; index < 4; index++) {
        await goTo(page, chapter, index);
        await page.clock.fastForward(500);
      }
    }
    // Каждая остановка короче debounce: прогресс всё равно должен уходить во время чтения.
    await expect.poll(() => saves.length).toBeGreaterThan(5);
    await expect.poll(() => new Set(reads.map((read) => read.chapterId)).size).toBe(30);
    await page.clock.fastForward(5000);
    await expect.poll(() => saves.at(-1)).toEqual({ chapterId: 'source:chapter-29', pageIndex: 3 });
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('сбой сохранения повторяется без смены страницы, подтверждённое сохранение не дублируется', async () => {
  let status = 503;
  const { page, saves } = await openReader({ progressStatus: () => status });
  try {
    await goTo(page, 15, 2);
    await page.clock.fastForward(2100);
    await expect.poll(() => saves.length).toBe(1);
    status = 200;
    await page.clock.fastForward(5000);
    await expect.poll(() => saves.length).toBe(2);
    await page.clock.fastForward(5000);
    assert.equal(saves.length, 2);
    assert.deepEqual(saves[1], { chapterId: 'source:chapter-15', pageIndex: 2 });
  } finally {
    await page.close();
  }
});

for (const status of [200, 503]) {
  test(`запоздавший ответ ${status} не откатывает новую позицию и не запускает параллельные записи`, async () => {
    let release;
    let blocked = true;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    const { page, saves } = await openReader({
      progressStatus: () => status,
      waitProgress: () => (blocked ? held : Promise.resolve()),
    });
    try {
      await goTo(page, 15, 0);
      await page.clock.fastForward(2100);
      await expect.poll(() => saves.length).toBe(1);
      await goTo(page, 16, 2);
      await page.clock.fastForward(5000);
      assert.equal(saves.length, 1);
      blocked = false;
      release();
      await expect
        .poll(() => page.evaluate(() => globalThis.window.harness.client.isMutating()))
        .toBe(0);
      assert.deepEqual(await ownPosition(page), { chapterId: 'source:chapter-16', pageIndex: 2 });
      await page.clock.fastForward(5000);
      await expect.poll(() => saves.length).toBe(2);
      assert.deepEqual(saves[1], { chapterId: 'source:chapter-16', pageIndex: 2 });
    } finally {
      release();
      await page.close();
    }
  });
}

test('дочитанные главы повторно отправляются после временного сбоя, даже после перехода дальше', async () => {
  let fail = true;
  const { page, reads } = await openReader({ readStatus: () => (fail ? 503 : 204) });
  try {
    for (let chapter = 15; chapter < 20; chapter++) await goTo(page, chapter, 3);
    await expect.poll(() => new Set(reads.map((read) => read.chapterId)).size).toBe(5);
    await goTo(page, 20, 0);
    fail = false;
    await page.clock.fastForward(2000);
    await expect
      .poll(
        () =>
          new Set(
            reads
              .filter(
                (read, index) =>
                  reads.findIndex((other) => other.chapterId === read.chapterId) !== index,
              )
              .map((read) => read.chapterId),
          ).size,
      )
      .toBe(5);
    await expect
      .poll(() => page.evaluate(() => globalThis.window.harness.client.isMutating()))
      .toBe(0);
  } finally {
    await page.close();
  }
});

test('visibilitychange и pagehide отправляют одну последнюю позицию', async () => {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const { page, saves } = await openReader({ waitProgress: () => held });
  try {
    await goTo(page, 25, 1);
    await page.evaluate(() => {
      Object.defineProperty(globalThis.document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      globalThis.document.dispatchEvent(new globalThis.Event('visibilitychange'));
      globalThis.window.dispatchEvent(new globalThis.Event('pagehide'));
    });
    await expect.poll(() => saves.length).toBe(1);
    assert.deepEqual(saves[0], { chapterId: 'source:chapter-25', pageIndex: 1 });
    release();
  } finally {
    release();
    await page.close();
  }
});

test('повтор прочтения из прежнего аккаунта не отправляется от нового пользователя', async () => {
  const { page, reads } = await openReader({ readStatus: () => 503 });
  try {
    await goTo(page, 25, 3);
    await expect.poll(() => reads.length).toBe(1);
    await page.evaluate(() =>
      globalThis.window.harness.client.setQueryData(['auth', 'me'], { id: 'another-reader' }),
    );
    await goTo(page, 26, 0);
    await page.clock.fastForward(2000);
    await expect
      .poll(() => page.evaluate(() => globalThis.window.harness.client.isMutating()))
      .toBe(0);
    assert.equal(reads.length, 1);
  } finally {
    await page.close();
  }
});

test('уход из читалки во время сохранения досылает последнюю страницу', async () => {
  let release;
  let blocked = true;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const { page, saves } = await openReader({
    waitProgress: () => (blocked ? held : Promise.resolve()),
  });
  try {
    await goTo(page, 25, 1);
    await page.clock.fastForward(2100);
    await expect.poll(() => saves.length).toBe(1);
    await goTo(page, 26, 2);
    await page.evaluate(() => globalThis.window.harness.unmount());
    blocked = false;
    release();
    await expect.poll(() => saves.length).toBe(2);
    assert.deepEqual(saves[1], { chapterId: 'source:chapter-26', pageIndex: 2 });
  } finally {
    release();
    await page.close();
  }
});

for (const status of [200, 503]) {
  test(`уход после возврата в скрытую вкладку досылает последнюю страницу после ответа ${status}`, async () => {
    let release;
    let blocked = true;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    const { page, saves } = await openReader({
      progressStatus: () => (blocked ? status : 200),
      waitProgress: () => (blocked ? held : Promise.resolve()),
    });
    try {
      await goTo(page, 25, 1);
      await page.evaluate(() => {
        Object.defineProperty(globalThis.document, 'visibilityState', {
          configurable: true,
          value: 'hidden',
        });
        globalThis.document.dispatchEvent(new globalThis.Event('visibilitychange'));
      });
      await expect.poll(() => saves.length).toBe(1);
      await page.evaluate(() => {
        Object.defineProperty(globalThis.document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        });
        globalThis.document.dispatchEvent(new globalThis.Event('visibilitychange'));
      });
      await goTo(page, 26, 2);
      await page.evaluate(() => globalThis.window.harness.unmount());
      assert.equal(saves.length, 1);
      blocked = false;
      release();
      await expect.poll(() => saves.length).toBe(2);
      assert.deepEqual(saves[1], { chapterId: 'source:chapter-26', pageIndex: 2 });
    } finally {
      release();
      await page.close();
    }
  });
}

for (const resumePage of [undefined, 3]) {
  test(`вход из прокрученного экрана открывает страницу ${resumePage ?? 1} без смещения`, async () => {
    const { page, errors } = await openReader({ vertical: true, entryScroll: 180, resumePage });
    try {
      const pageIndex = (resumePage ?? 1) - 1;
      const slot = page.locator(
        `[data-chapter-id="source:chapter-0"][data-page-index="${pageIndex}"]`,
      );
      await expect(slot).toHaveCount(1);
      await page.clock.runFor(32);
      await expect
        .poll(() => slot.evaluate((element) => element.getBoundingClientRect().top))
        .toBe(0);
      await expect
        .poll(() => ownPosition(page))
        .toEqual({ chapterId: 'source:chapter-0', pageIndex });
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

test('вертикальная лента определяет позицию и учитывает 30 глав при настоящей прокрутке', async () => {
  const { page, saves, reads, errors } = await openReader({ vertical: true });
  try {
    await page.mouse.wheel(0, 1);
    await page.clock.runFor(32);
    for (let chapter = 0; chapter < 30; chapter++) {
      for (let index = 0; index < 4; index++) {
        const slot = page.locator(
          `[data-chapter-id="source:chapter-${chapter}"][data-page-index="${index}"]`,
        );
        await expect(slot).toHaveCount(1);
        await slot.evaluate((element) =>
          element.scrollIntoView({ block: 'start', behavior: 'instant' }),
        );
        await page.clock.runFor(32);
        await expect
          .poll(() => ownPosition(page))
          .toEqual({ chapterId: `source:chapter-${chapter}`, pageIndex: index });
        await page.clock.fastForward(500);
      }
    }
    await expect.poll(() => new Set(reads.map((read) => read.chapterId)).size).toBe(30);
    await page.clock.fastForward(5000);
    await expect.poll(() => saves.at(-1)).toEqual({ chapterId: 'source:chapter-29', pageIndex: 3 });
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});
