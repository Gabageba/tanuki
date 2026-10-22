import 'dotenv/config';
import 'reflect-metadata';
import fastifyCookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AVATAR_MAX_BYTES, BACKUP_MAX_BYTES } from '@tanuki/contracts';
import { AppModule } from './app.module';
import { ApiErrorDto } from './common/error.dto';
import { HttpExceptionFilter } from './common/http-exception.filter';

const BACKUP_BODY_MARGIN_BYTES = 1024 * 1024;

const bootstrap = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      maxParamLength: 2048,
      // За обратным прокси IP клиента приходит в X-Forwarded-For — без этого AuthGuard'у и
      // RateLimitService всегда виден бы был только адрес прокси. Читаем process.env напрямую:
      // на этом шаге ENV ещё не собран Nest DI, а dotenv/config уже загрузил .env выше.
      trustProxy: process.env['TRUST_PROXY'] === 'true',
    }),
  );

  await app.register(fastifyCookie);

  // Загрузка аватара шлёт картинку сырым телом (PUT /users/me/avatar) — без multipart-плагина.
  // Fastify по умолчанию не знает image/* и ответил бы 415, а лимит свой, больше общего 1 МБ.
  app
    .getHttpAdapter()
    .getInstance()
    .addContentTypeParser(
      /^image\//,
      { parseAs: 'buffer', bodyLimit: AVATAR_MAX_BYTES },
      (_request, body, done) => done(null, body),
    );

  // Резервная копия уходит телом JSON до BACKUP_MAX_BYTES — больше общего 1 МБ. Лимит ставится
  // только её маршрутам, до их регистрации (она происходит в app.listen); запас — на поля запроса
  // вокруг файла и на то, что JSON.stringify разобранного файла может выйти чуть длиннее.
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRoute', (route) => {
      if (route.url.startsWith('/api/v1/backup/')) {
        // onRoute для того и есть: Fastify читает опции маршрута после хука из этого же объекта.
        // eslint-disable-next-line no-param-reassign
        route.bodyLimit = BACKUP_MAX_BYTES + BACKUP_BODY_MARGIN_BYTES;
      }
    });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  // Lets ParsersLifecycleService close every source's undici Agent on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tanuki API')
    .setDescription('Все ошибки возвращаются в форме ApiErrorDto, независимо от эндпоинта.')
    .setVersion('1.0')
    .build();
  const swaggerDocument = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, swaggerConfig, { extraModels: [ApiErrorDto] }),
  );
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
};

void bootstrap();
