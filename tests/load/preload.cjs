// Test-only overrides. This file is mounted into an isolated container, never shipped.
require('/app/dist/observability/instrument');
const { Agent } = require('/app/node_modules/undici');
const {
  createRegistry,
  HttpClientImpl,
  SOURCE_ID,
  SOURCE_IDS,
} = require('/app/node_modules/@tanuki/parsers');
const { observeParser } = require('/app/dist/observability/parser-metrics');
const { parsersProvider } = require('/app/dist/parsers-client/parsers.provider');
const upstream = require('/app/dist/img-proxy/upstream-policy');
const ORIGIN = 'http://fixture:4080';

process.env.DISABLED_SOURCES = SOURCE_IDS.filter((id) => id !== SOURCE_ID.ACOMICS).join(',');
parsersProvider.useFactory = () => {
  const registry = createRegistry({
    credentials: {},
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    createHttpClient: (options) => {
      const client = new HttpClientImpl(options);
      client.use(async (request, next) => {
        const original = new URL(request.url);
        if (original.hostname !== 'acomics.ru') throw new Error('External requests disabled');
        const response = await next({
          ...request,
          url: `${ORIGIN}/acomics.ru${original.pathname}${original.search}`,
        });
        return { ...response, url: request.url };
      });
      return client;
    },
  });
  const observed = new Map();
  const get = (sourceId) => {
    if (!observed.has(sourceId)) observed.set(sourceId, observeParser(registry.get(sourceId)));
    return observed.get(sourceId);
  };
  return {
    ...registry,
    get,
    decodeImage: async (sourceId, bytes, url) =>
      (await get(sourceId).decodeImage?.(bytes, url)) ?? bytes,
  };
};
upstream.createUpstreamPolicy = () => ({
  agent: new Agent(),
  isAllowedUrl: (url) => new URL(url).origin === ORIGIN,
});
