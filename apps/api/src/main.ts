import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { ApiErrorDto } from './common/error.dto';
import { HttpExceptionFilter } from './common/http-exception.filter';

const bootstrap = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true, maxParamLength: 2048 }),
  );

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
