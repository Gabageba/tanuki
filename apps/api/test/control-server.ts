import { createServer } from 'node:http';
import * as Sentry from '@sentry/nestjs';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Parser } from '@tanuki/parsers';
import { NOTIFICATION_STREAM_EVENT } from '@tanuki/contracts';
import { CacheService } from '../src/cache/cache.service';
import { ParsersClientService } from '../src/parsers-client/parsers-client.service';
import { PARSER_CALL_CONTEXT } from '../src/observability/models';
import { runWithParserContext } from '../src/observability/parser-context';
import { NotificationsHubService } from '../src/notifications/notifications-hub.service';

// Control of real services is confined to the test entrypoint and its loopback-published port.
export const startControlServer = (app: NestFastifyApplication, parser: Parser) => {
  createServer(async (request, response) => {
    if (request.headers.authorization !== `Bearer ${process.env['METRICS_TOKEN']}`) {
      response.writeHead(401).end();
      return;
    }
    const url = new URL(request.url!, 'http://localhost');
    try {
      if (url.pathname === '/telemetry') {
        const context = Object.values(PARSER_CALL_CONTEXT).find(
          (value) => value === url.searchParams.get('context'),
        );
        if (!context) {
          response.writeHead(400).end();
          return;
        }
        const result = await runWithParserContext(context, async () => {
          switch (context) {
            case PARSER_CALL_CONTEXT.PROBE:
              return { error: await app.get(ParsersClientService).probe(parser.id) };
            case PARSER_CALL_CONTEXT.REQUEST:
            case PARSER_CALL_CONTEXT.BACKGROUND:
              return app
                .get(CacheService)
                .getOrSet(
                  'e2e:pages',
                  { freshSeconds: 3600, staleSeconds: 7200 },
                  () => parser.getPages('/fixture/'),
                  { force: url.searchParams.get('force') === 'true' },
                );
          }
        });
        await Sentry.flush(2000);
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === '/restart') {
        response.end('ok');
        setTimeout(() => process.exit(0), 2000);
        process.kill(process.pid, 'SIGTERM');
        return;
      }
      if (url.pathname === '/publish') {
        app
          .get(NotificationsHubService)
          .publish(url.searchParams.get('user')!, { type: NOTIFICATION_STREAM_EVENT.REMOVED });
        response.end('ok');
        return;
      }
      response.writeHead(404).end();
    } catch {
      await Sentry.flush(2000);
      response.writeHead(500).end();
    }
  }).listen(9465, '0.0.0.0');
};
