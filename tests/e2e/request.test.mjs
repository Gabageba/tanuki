import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { request } from './request.mjs';

export const listen = async (t, handler) => {
  const server = createServer(handler);
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
};

test('checks use separate connections and preserve request headers and body', async (t) => {
  const received = [];
  const url = await listen(t, async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received.push({ socket: req.socket, headers: req.headers, method: req.method, body });
    res.end('ok');
  });
  assert.equal(await (await request(`${url}/health`)).text(), 'ok');
  assert.equal(await (await request(`${url}/auth`)).text(), 'ok');
  const headers = new Headers({ cookie: 'session=fixture', 'Content-Type': 'application/json' });
  assert.equal(
    await (
      await request(`${url}/settings`, { method: 'PUT', headers, body: '{"colorScheme":"dark"}' })
    ).text(),
    'ok',
  );
  assert.equal(received.length, 3);
  assert.equal(new Set(received.map(({ socket }) => socket)).size, 3);
  assert.ok(received.every(({ headers }) => headers.connection === 'close'));
  assert.equal(received[2].headers.cookie, 'session=fixture');
  assert.equal(received[2].headers['content-type'], 'application/json');
  assert.equal(received[2].method, 'PUT');
  assert.equal(received[2].body, '{"colorScheme":"dark"}');
  assert.equal(headers.has('Connection'), false);
});

test('socket errors identify the failed request without retrying a mutation', async (t) => {
  let attempts = 0;
  const url = await listen(t, (req) => {
    attempts += 1;
    req.socket.destroy();
  });
  await assert.rejects(request(`${url}/register`, { method: 'POST', body: '{}' }), (error) => {
    assert.equal(error.message, `E2E request failed: POST ${url}/register`);
    assert.equal(error.cause.cause.code, 'UND_ERR_SOCKET');
    return true;
  });
  assert.equal(attempts, 1);
});
