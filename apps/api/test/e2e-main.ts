// Only built into the e2e image target. Production has no fixture/seed switch.
import '../src/observability/instrument';
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Agent } from 'undici';
import { createRegistry, HttpClientImpl, SOURCE_ID, SOURCE_IDS } from '@tanuki/parsers';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/bootstrap';
import { PARSERS } from '../src/parsers-client/parsers.provider';
import { UPSTREAM_POLICY } from '../src/img-proxy/upstream-policy';
import { observeParser } from '../src/observability/parser-metrics';
import { startMetricsServer } from '../src/observability/metrics-server';
import { startControlServer } from './control-server';

const FIXTURE_ORIGIN = 'http://fixture:4080';
const main = async () => {
  const registry = createRegistry({
    credentials: {},
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    sourceIds: [SOURCE_ID.ACOMICS],
    createHttpClient: (options) => {
      const client = new HttpClientImpl(options);
      client.use(async (request, next) => {
        const original = new URL(request.url);
        if (original.hostname !== 'acomics.ru') throw new Error('External requests disabled');
        const response = await next({
          ...request,
          url: `${FIXTURE_ORIGIN}/${original.hostname}${original.pathname}${original.search}`,
        });
        return { ...response, url: request.url };
      });
      return client;
    },
  });
  const parser = observeParser({
    ...registry.get(SOURCE_ID.ACOMICS),
    info: { ...registry.get(SOURCE_ID.ACOMICS).info, isBroken: false },
  });
  // Other sources are disabled, and registry lookup cannot open a network connection.
  process.env['DISABLED_SOURCES'] = SOURCE_IDS.filter((id) => id !== SOURCE_ID.ACOMICS).join(',');
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PARSERS)
    .useValue({ ...registry, get: () => parser, listSources: () => [parser.info] })
    .overrideProvider(UPSTREAM_POLICY)
    .useValue({
      agent: new Agent(),
      isAllowedUrl: (url: string) => new URL(url).origin === FIXTURE_ORIGIN,
    })
    .compile();
  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ trustProxy: ['172.30.99.3/32'] }),
  );
  await configureApplication(app);
  await startMetricsServer(process.env['METRICS_TOKEN']);
  await app.listen(3000, '0.0.0.0');
  startControlServer(app, parser);
};
void main();
