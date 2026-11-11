import 'dotenv/config';
import 'reflect-metadata';
import fastifyCookie from '@fastify/cookie';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AVATAR_MAX_BYTES, BACKUP_MAX_BYTES } from '@tanuki/contracts';
import { ApiErrorDto } from './common/error.dto';
import { HttpExceptionFilter } from './common/http-exception.filter';

const BACKUP_BODY_MARGIN_BYTES = 1024 * 1024;

export const configureApplication = async (app: NestFastifyApplication) => {
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
};
