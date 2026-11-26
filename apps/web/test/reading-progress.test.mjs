import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';
import { createServer } from 'vite';

let server;
let resolveContinuePosition;

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
    logLevel: 'silent',
  });
  ({ resolveContinuePosition } = await server.ssrLoadModule(
    '/src/entities/title/readingProgress.ts',
  ));
});

after(async () => server?.close());

export const completedMark = (chapter) => ({
  chapter,
  pageIndex: 7,
  progress: { chapterId: chapter.id, chapterCompleted: true },
});

test('Продолжить сохраняет порядок одинаковых номеров и ставит главы без номера в конец', () => {
  const first = { id: 'first', number: 1 };
  const second = { id: 'second', number: 2 };
  const alternate = { id: 'alternate', number: 2 };
  const special = { id: 'special', number: null };
  const epilogue = { id: 'epilogue', number: null };
  const chapters = [second, alternate, first, special, epilogue];
  const isUnavailable = () => false;

  for (const [chapter, next] of [
    [second, alternate],
    [alternate, special],
    [special, epilogue],
  ]) {
    assert.deepEqual(resolveContinuePosition(completedMark(chapter), chapters, isUnavailable), {
      chapter: next,
      pageIndex: 0,
    });
  }
});

test('Продолжить оставляет сохранённую страницу, когда следующая глава недоступна', () => {
  const chapter = { id: 'first', number: 1 };
  const next = { id: 'second', number: 2 };
  const mark = completedMark(chapter);

  assert.equal(
    resolveContinuePosition(mark, [next, chapter], (id) => id === next.id),
    mark,
  );
});
