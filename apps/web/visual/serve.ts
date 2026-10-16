import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname } from 'node:path';
import { PORT, STORYBOOK_STATIC_URL } from './models.ts';

/** Статика собранного Storybook для визуальных тестов — без зависимостей ради одного сервера. */
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = new URL(`.${decodeURIComponent(pathname)}`, STORYBOOK_STATIC_URL);
  const isInside = file.href.startsWith(STORYBOOK_STATIC_URL.href);
  const isFile = isInside && (await stat(file).catch(() => null))?.isFile();

  if (!isFile) {
    response.writeHead(404).end();
    return;
  }

  response.writeHead(200, {
    'Content-Type': CONTENT_TYPES[extname(file.pathname)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
}).listen(PORT);
