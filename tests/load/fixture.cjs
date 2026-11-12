const { createServer } = require('node:http');
const { randomBytes } = require('node:crypto');
const sharp = require('/app/node_modules/sharp');
const { gzipSync } = require('node:zlib');

const main = async () => {
  // Noise compresses poorly: a deliberately heavy, but valid, 1600 × 2400 page.
  const page = await sharp(randomBytes(1600 * 2400 * 3), {
    raw: { width: 1600, height: 2400, channels: 3 },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
  console.log(JSON.stringify({ fixturePageBytes: page.length, width: 1600, height: 2400 }));
  const html = (body) =>
    `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
  createServer((request, response) => {
    const url = new URL(request.url, 'http://fixture:4080');
    if (url.pathname === '/oversized.jpg') {
      response
        .writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': 17 * 1024 * 1024 })
        .end();
      return;
    }
    if (url.pathname === '/compressed-large.jpg') {
      const compressed = gzipSync(Buffer.alloc(17 * 1024 * 1024));
      response
        .writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Content-Encoding': 'gzip',
          'Content-Length': compressed.length,
        })
        .end(compressed);
      return;
    }
    if (url.pathname.startsWith('/image')) {
      // Simulate a source with 50 ms latency, rather than a zero-latency memory copy.
      setTimeout(() => {
        response.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': page.length });
        response.end(page);
      }, 50);
      return;
    }
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (url.pathname === '/acomics.ru/comics' || url.pathname === '/acomics.ru/search') {
      response.end(
        html(
          '<div id="catalog"></div>' +
            Array.from(
              { length: 20 },
              (_, i) =>
                `<table class="list-loadable"><tr><td><a href="/fixture"><img src="http://fixture:4080/image-${i}.jpg"><span class="title">Нагрузочный комикс ${i}</span></a></td></tr></table>`,
            ).join(''),
        ),
      );
      return;
    }
    if (url.pathname === '/acomics.ru/fixture/about') {
      response.end(
        html(
          '<h1 class="title">Нагрузочный комикс</h1><section class="serial-about-text"><p>Локальный источник</p></section>',
        ),
      );
      return;
    }
    if (/^\/acomics.ru\/fixture\/[12]$/.test(url.pathname)) {
      const number = url.pathname.endsWith('/1') ? 1 : 2;
      response.end(
        html(
          `<span class="issueNumber">${number}/2</span><img id="mainImage" src="http://fixture:4080/image-${number}.jpg">`,
        ),
      );
      return;
    }
    response.writeHead(404).end();
  }).listen(4080, '0.0.0.0');
};
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
