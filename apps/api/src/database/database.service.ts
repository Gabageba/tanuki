import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Подключение к Postgres. Пул создаётся лениво самим драйвером, поэтому недоступная база не
 * мешает приложению стартовать: всё, что не связано с пользовательскими правками, продолжает
 * работать. Решение о том, как пережить отказ, принимают вызывающие — читающий код
 * довольствуется пустым результатом, пишущий обязан сообщить об ошибке (см. TitleLinksService).
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly client: postgres.Sql;
  private lastFailureLogged = false;

  readonly db: Database;

  constructor(@Inject(ENV) env: Env) {
    this.client = postgres(env.DATABASE_URL, {
      max: 5,
      // Без этого postgres.js уходит в бесконечные попытки переподключения и запрос висит
      // дольше, чем пользователь готов ждать.
      connect_timeout: 5,
      onnotice: () => undefined,
    });
    this.db = drizzle(this.client, { schema });
  }

  /**
   * Выполняет запрос, переживая недоступность базы: при отказе отдаёт `fallback` и пишет об
   * этом в лог один раз, а не на каждый запрос. Для операций, о провале которых обязан узнать
   * пользователь, есть `run`.
   */
  async withFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      const result = await operation();
      this.lastFailureLogged = false;
      return result;
    } catch (error) {
      if (!this.lastFailureLogged) {
        this.logger.warn(`База недоступна: ${(error as Error).message}`);
        this.lastFailureLogged = true;
      }
      return fallback;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
