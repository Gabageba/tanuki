import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { renderParserMetrics } from './parser-metrics';
import { renderProcessMemoryMetrics } from './process-memory-metrics';

export const startMetricsServer = async (token: string | undefined) => {
  if (!token) return undefined;
  const expected = Buffer.from(`Bearer ${token}`);
  const server = createServer((request, response) => {
    const supplied = Buffer.from(request.headers.authorization ?? '');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      response.writeHead(401).end();
      return;
    }
    if (request.url !== '/metrics' || request.method !== 'GET') {
      response.writeHead(404).end();
      return;
    }
    response
      .writeHead(200, {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      .end(renderParserMetrics() + renderProcessMemoryMetrics());
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(9464, '0.0.0.0', resolve);
  });
  server.unref();
  return server;
};
