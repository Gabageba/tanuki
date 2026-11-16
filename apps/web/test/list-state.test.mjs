import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';
import { createServer } from 'vite';

let server;
let updateSearchParams;
let readBookmarksParams;
let readUsersParams;
let readInvitesParams;
let readNotificationsParams;

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
    logLevel: 'silent',
  });
  ({ updateSearchParams } = await server.ssrLoadModule('/src/shared/lib/searchParams.ts'));
  ({ readBookmarksParams } = await server.ssrLoadModule('/src/pages/Bookmarks/lib.tsx'));
  ({ readListParams: readUsersParams } = await server.ssrLoadModule(
    '/src/pages/Management/components/ManagementUsers/models.ts',
  ));
  ({ readListParams: readInvitesParams } = await server.ssrLoadModule(
    '/src/pages/Management/components/ManagementInvites/models.ts',
  ));
  ({ readNotificationsParams } = await server.ssrLoadModule('/src/pages/Notifications/lib.ts'));
});

after(async () => server?.close());

const params = (value) => new globalThis.URLSearchParams(value);

test('сортировка закладок из URL получает естественное направление, неизвестные значения сбрасываются', () => {
  assert.deepEqual(readBookmarksParams(params('sort=alphabetical&query=Манга')), {
    sort: 'alphabetical',
    direction: 'asc',
    query: 'Манга',
  });
  assert.deepEqual(readBookmarksParams(params('sort=unknown&direction=broken')), {
    sort: 'updated',
    direction: 'desc',
    query: '',
  });
});

test('патч URL сохраняет фильтры каталога, кодирование и остальные поля', () => {
  const current = params(
    'filters=genres:action&filters=genres:!drama&filters=rating:7..9&query=Манга',
  );
  const next = updateSearchParams(current, { order: 'rating', direction: 'asc' });
  assert.deepEqual(next.getAll('filters'), ['genres:action', 'genres:!drama', 'rating:7..9']);
  assert.equal(next.get('query'), 'Манга');
  assert.equal(current.has('order'), false);
  assert.equal(next.get('direction'), 'asc');
});

test('независимые параметры вкладок сохраняются, пустые фильтры удаляются', () => {
  const next = updateSearchParams(
    params('tab=users&users.page=4&invites.page=3&users.role=admin'),
    {
      page: 1,
      role: [],
      query: '',
    },
    'users.',
  );
  assert.equal(next.get('users.page'), '1');
  assert.equal(next.get('invites.page'), '3');
  assert.equal(next.get('tab'), 'users');
  assert.equal(next.has('users.role'), false);
  assert.equal(next.has('users.query'), false);
});

test('списки из URL отбрасывают неизвестные и повторные значения, номера страниц валидируются', () => {
  const users = readUsersParams(
    params('role=admin&role=broken&role=admin&status=blocked&sort=username&page=-2'),
  );
  assert.deepEqual(users.role, ['admin']);
  assert.deepEqual(users.status, ['blocked']);
  assert.equal(users.direction, 'asc');
  assert.equal(users.page, 1);
  for (const value of ['1.2', 'Infinity', '9007199254740992', 'invalid']) {
    assert.equal(readInvitesParams(params(`page=${value}`)).page, 1);
  }
  assert.equal(readInvitesParams(params('page=3')).page, 3);
  assert.deepEqual(
    readNotificationsParams(params('categories=chapters&categories=invalid&categories=chapters')),
    {
      categories: ['chapters'],
    },
  );
});
