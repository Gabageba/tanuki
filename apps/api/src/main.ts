import './observability/instrument';
import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { startMetricsServer } from './observability/metrics-server';
import { configureApplication } from './bootstrap';
import { AppModule } from './app.module';

const bootstrap = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      maxParamLength: 2048,
      // За обратным прокси IP клиента приходит в X-Forwarded-For — без этого AuthGuard'у и
      // RateLimitService всегда виден бы был только адрес прокси. Читаем process.env напрямую:
      // на этом шаге ENV ещё не собран Nest DI, а dotenv/config уже загрузил .env выше.
      trustProxy:
        process.env['TRUST_PROXY'] && process.env['TRUST_PROXY'] !== 'false'
          ? process.env['TRUST_PROXY'].split(',').map((value) => value.trim())
          : false,
    }),
  );

  await configureApplication(app);

  const port = Number(process.env.PORT ?? 3000);
  const metrics = await startMetricsServer(process.env['METRICS_TOKEN']);
  const closeMetrics = () => metrics?.close();
  process.once('SIGTERM', closeMetrics);
  process.once('SIGINT', closeMetrics);
  await app.listen(port, '0.0.0.0');
};

void bootstrap();
