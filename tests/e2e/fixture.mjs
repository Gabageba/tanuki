import { createServer } from 'node:http';

let broken = false;
const EVENTS = [];
const IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR4nGP4v4oBiBhQKABupgn3a227qQAAAABJRU5ErkJggg==',
  'base64',
);
const html = (body) =>
  `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://fixture:4080');
  if (url.pathname === '/control') {
    broken = url.searchParams.get('broken') === 'true';
    res.end('ok');
    return;
  }
  if (url.pathname === '/events') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(EVENTS));
    return;
  }
  if (req.method === 'POST' && url.pathname.includes('/envelope/')) {
    let body = '';
    for await (const chunk of req) body += chunk;
    EVENTS.push(body);
    res.end('{}');
    return;
  }
  if (/^\/image(?:-[12])?\.png$/.test(url.pathname)) {
    res.setHeader('Content-Type', 'image/png');
    res.end(IMAGE);
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (url.pathname === '/acomics.ru/comics' || url.pathname === '/acomics.ru/search') {
    res.end(
      html(
        '<div id="catalog"></div><table class="list-loadable"><tr><td><a href="/fixture"><img src="http://fixture:4080/image.png"><span class="title">Тестовый комикс</span></a></td></tr></table>',
      ),
    );
    return;
  }
  if (url.pathname === '/acomics.ru/fixture/about') {
    res.end(
      html(
        '<h1 class="title">Тестовый комикс</h1><section class="serial-about-text"><p>Описание тестового комикса</p></section>',
      ),
    );
    return;
  }
  if (/^\/acomics.ru\/fixture\/[12]$/.test(url.pathname)) {
    res.end(
      html(
        broken
          ? '<p>secret@example.org token=private upstream failure</p>'
          : `<span class="issueNumber">${url.pathname.endsWith('/1') ? 1 : 2}/2</span><img id="mainImage" src="http://fixture:4080/image-${url.pathname.endsWith('/1') ? 1 : 2}.png">`,
      ),
    );
    return;
  }
  res.writeHead(404).end();
}).listen(4080, '0.0.0.0');
