import assert from 'node:assert/strict';
import { URL } from 'node:url';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let createToastStore;
let KIND;
let REASON;
let PAUSE;

before(async () => {
  server = await createServer({
    configFile: false,
    root: new URL('..', import.meta.url).pathname,
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
    logLevel: 'silent',
  });
  ({ createToastStore } = await server.ssrLoadModule('/src/shared/lib/toasts/store.ts'));
  ({
    TOAST_KIND: KIND,
    TOAST_CLOSE_REASON: REASON,
    TOAST_PAUSE: PAUSE,
  } = await server.ssrLoadModule('/src/shared/lib/toasts/models.ts'));
});
after(async () => server.close());

const setup = () => {
  let now = 0;
  let sequence = 0;
  const tasks = new Map();
  const store = createToastStore({
    now: () => now,
    schedule: (callback, delay) => {
      const id = ++sequence;
      tasks.set(id, { callback, time: now + delay });
      return id;
    },
    cancel: (id) => tasks.delete(id),
  });
  const advance = (duration) => {
    const target = now + duration;
    for (;;) {
      const next = [...tasks.entries()].sort((a, b) => a[1].time - b[1].time)[0];
      if (!next || next[1].time > target) break;
      now = next[1].time;
      tasks.delete(next[0]);
      next[1].callback();
    }
    now = target;
  };
  const add = (id, props = {}) => store.show({ id, title: id, ...props });
  const visible = () =>
    store
      .getSnapshot()
      .filter((entry) => entry.visible)
      .map((entry) => entry.id);
  return { store, advance, add, visible };
};

test('новое сообщение сдвигает стек вверх; скрытые возвращаются после его закрытия', () => {
  const { add, visible, store } = setup();
  ['one', 'two', 'three', 'four', 'five'].forEach((id) => add(id));
  assert.deepEqual(visible(), ['three', 'four', 'five']);
  assert.equal(store.getSnapshot().length, 5);
  store.close('five');
  assert.deepEqual(visible(), ['two', 'three', 'four']);
  store.close('four');
  assert.deepEqual(visible(), ['one', 'two', 'three']);
});

test('отмены и безопасность временно скрываются вместе со стеком, сохраняя действия', () => {
  const { add, store, visible } = setup();
  add('undo', { kind: KIND.UNDO });
  add('security', { kind: KIND.SECURITY });
  ['one', 'two', 'three'].forEach((id) => add(id));
  assert.deepEqual(visible(), ['one', 'two', 'three']);
  store.close('three');
  assert.deepEqual(visible(), ['security', 'one', 'two']);
  store.close('two');
  assert.deepEqual(visible(), ['undo', 'security', 'one']);
  let calls = 0;
  store.act('undo', () => calls++);
  assert.equal(calls, 1);
});

test('таймер скрытого при переполнении сообщения сохраняет остаток без перезапуска', () => {
  const { add, store, advance, visible } = setup();
  add('old', { kind: KIND.UNDO });
  advance(3_000);
  ['one', 'two', 'three'].forEach((id) => add(id, { kind: KIND.UNDO }));
  advance(9_000);
  assert.deepEqual(visible(), ['one', 'two', 'three']);
  store.close('three');
  assert.deepEqual(visible(), ['old', 'one', 'two']);
  advance(6_999);
  assert.deepEqual(visible(), ['old']);
  advance(1);
  assert.equal(store.getSnapshot().length, 0);
});

test('наведение, фокус и скрытая вкладка сохраняют остаток времени, а не полный таймер', () => {
  const { add, store, advance, visible } = setup();
  add('undo', { kind: KIND.UNDO });
  advance(3_000);
  store.pause('undo', PAUSE.HOVER, true);
  store.pause('undo', PAUSE.FOCUS, true);
  advance(20_000);
  store.pause('undo', PAUSE.HOVER, false);
  advance(20_000);
  store.setHidden(true);
  store.pause('undo', PAUSE.FOCUS, false);
  advance(20_000);
  store.setHidden(false);
  advance(6_999);
  assert.deepEqual(visible(), ['undo']);
  advance(1);
  assert.equal(store.getSnapshot().length, 0);
});

test('тост с фокусом не вытесняется даже при обычном тоне', () => {
  const { add, store, visible } = setup();
  add('focused');
  add('two');
  add('three');
  store.pause('focused', PAUSE.FOCUS, true);
  add('four');
  assert.deepEqual(visible(), ['focused', 'three', 'four']);
});

test('PWA временно уступает слот; onDismiss вызывается только крестиком', () => {
  const { add, store, visible } = setup();
  let dismissed = 0;
  add('pwa', { kind: KIND.PWA, onDismiss: () => dismissed++ });
  add('two');
  add('three');
  add('four');
  assert.deepEqual(visible(), ['two', 'three', 'four']);
  assert.equal(dismissed, 0);
  store.close('two');
  assert.deepEqual(visible(), ['pwa', 'three', 'four']);
  store.close('pwa', REASON.DISMISS);
  assert.equal(dismissed, 1);
});

test('PWA не занимает слот перед временной очередью и не истекает', () => {
  const { add, store, advance, visible } = setup();
  ['one', 'two', 'three'].forEach((id) => add(id, { kind: KIND.UNDO }));
  add('pwa', { kind: KIND.PWA });
  add('normal');
  store.close('one');
  assert.deepEqual(visible(), ['two', 'three', 'normal']);
  advance(10_000);
  assert.deepEqual(visible(), ['pwa']);
  advance(1_000_000);
  assert.deepEqual(visible(), ['pwa']);
});

test('повтор по ключу обновляет текст, но не продлевает таймер', () => {
  const { add, store, advance } = setup();
  const id = add('one', { key: 'same' });
  advance(3_000);
  assert.equal(add('two', { key: 'same', title: 'updated' }), id);
  assert.equal(store.getSnapshot()[0].title, 'updated');
  advance(2_000);
  assert.equal(store.getSnapshot().length, 0);
});

test('две секунды подавления отсчитываются от последнего принятого повтора; новая попытка видна', () => {
  const { add, store, advance, visible } = setup();
  add('one', { key: 'server', suppressAfterClose: true });
  advance(1_000);
  add('repeat', { key: 'server', suppressAfterClose: true });
  store.close('one', REASON.DISMISS);
  advance(1_999);
  add('suppressed', { key: 'server', suppressAfterClose: true });
  assert.deepEqual(visible(), []);
  store.clearSuppression();
  add('manual', { key: 'server', suppressAfterClose: true });
  assert.deepEqual(visible(), ['manual']);
  store.close('manual');
  advance(2_001);
  add('independent', { key: 'server', suppressAfterClose: true });
  assert.deepEqual(visible(), ['independent']);
});

test('читатель видит безопасность сразу, после выхода каждое фоновое событие получает показ', () => {
  const { add, store, visible, advance } = setup();
  store.setReader(true);
  ['one', 'two', 'three', 'four', 'five'].forEach((id) => add(id, { readerAllowed: false }));
  add('security', { kind: KIND.SECURITY });
  add('action');
  assert.deepEqual(visible(), ['security', 'action']);
  advance(10_000);
  store.setReader(false);
  assert.deepEqual(visible(), ['one', 'two', 'three']);
  advance(5_000);
  assert.deepEqual(visible(), ['four', 'five']);
});

test('обновление и снятие события в ожидании не создаёт дублей и не воскрешает удалённое', () => {
  const { add, store, visible } = setup();
  store.setReader(true);
  add('event', { readerAllowed: false, title: 'old' });
  add('event', { readerAllowed: false, title: 'new' });
  add('removed', { readerAllowed: false });
  store.close('removed');
  store.setReader(false);
  assert.deepEqual(visible(), ['event']);
  assert.equal(store.getSnapshot()[0].title, 'new');
});

test('смена аккаунта удаляет видимые, ожидающие тосты и функции действий; PWA остаётся', () => {
  const { add, store, visible } = setup();
  store.setOwner('alice');
  ['one', 'two', 'three'].forEach((id) => add(id, { kind: KIND.UNDO }));
  let calls = 0;
  add('waiting');
  add('pwa', { kind: KIND.PWA, global: true });
  store.setOwner('bob');
  store.act('one', () => calls++);
  assert.equal(calls, 0);
  assert.deepEqual(visible(), ['pwa']);
  assert.equal(store.getSnapshot().length, 1);
});

test('действие удаляет тост до запроса и срабатывает ровно один раз', () => {
  const { add, store } = setup();
  add('undo', { kind: KIND.UNDO });
  let calls = 0;
  const action = () => {
    assert.equal(store.getSnapshot().length, 0);
    calls++;
  };
  store.act('undo', action);
  store.act('undo', action);
  assert.equal(calls, 1);
});

test('скрытое на время чтения событие сбрасывает прежнее наведение и сохраняет остаток', () => {
  const { add, store, advance, visible } = setup();
  add('event', { readerAllowed: false });
  advance(1_000);
  store.pause('event', PAUSE.HOVER, true);
  store.setReader(true);
  advance(60_000);
  store.setReader(false);
  assert.deepEqual(visible(), ['event']);
  advance(4_000);
  assert.deepEqual(visible(), []);
});
