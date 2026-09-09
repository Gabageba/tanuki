import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SOURCE_STATUS_REASON, type Source } from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import { SourceHealthService } from '../resilience/source-health.service';
import { SourceStatusService } from '../resilience/source-status.service';
import { SourcesService } from '../sources/sources.service';
import { PROBE_JOB_NAME } from './models';

/**
 * Ночная проверка источников: раз в сутки прогоняет по каждому полный путь чтения и по итогу
 * двигает его статус (SourceStatusService).
 *
 * Живёт в API, а не в .github/workflows/parsers-nightly.yml, хотя проверка там та же: у API есть
 * база, куда писать статус, те же учётки и обычный домашний IP. У раннеров GitHub адреса
 * зашейрены и регулярно ловят антибот-403 — по ним половина источников выглядела бы лежащей,
 * будучи живой. Прогон в CI остаётся регресс-тестом парсеров, это другая задача.
 */
@Injectable()
export class SourceProbeService implements OnModuleInit {
  private readonly logger = new Logger(SourceProbeService.name);
  private isRunning = false;

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly sourcesService: SourcesService,
    private readonly parsersClient: ParsersClientService,
    private readonly sourceHealth: SourceHealthService,
    private readonly sourceStatus: SourceStatusService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    if (!this.env.SOURCE_PROBE_ENABLED) {
      this.logger.log('Ночной пробник выключен (SOURCE_PROBE_ENABLED=false)');
      return;
    }

    // Расписание задаётся переменной окружения, поэтому задача регистрируется вручную, а не
    // декоратором @Cron: тот принимает только литерал, известный на этапе компиляции.
    const job = new CronJob(this.env.SOURCE_PROBE_CRON, () => {
      void this.probeAll();
    });
    this.scheduler.addCronJob(PROBE_JOB_NAME, job);
    job.start();
    this.logger.log(`Ночной пробник запланирован: ${this.env.SOURCE_PROBE_CRON}`);
  }

  /**
   * Прогоняет все источники, включая degraded и down: именно пробник и есть путь восстановления
   * для down, которых веер поиска уже не опрашивает. Мимо идут только isBroken — там решение
   * принял человек.
   */
  async probeAll(): Promise<Source[]> {
    if (this.isRunning) {
      this.logger.warn('Пробник уже идёт — пропускаем запуск');
      return this.sourcesService.listSources();
    }

    this.isRunning = true;
    const startedAt = Date.now();
    try {
      const sources = await this.sourcesService.listSources();
      const queue = sources.filter((source) => !this.isHardBroken(source));

      // Источники независимы, но выпускать все два десятка разом незачем — это заметный
      // одновременный исходящий трафик ради задачи, которую никто не ждёт.
      const workers = Array.from({ length: this.env.SOURCE_PROBE_CONCURRENCY }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          await this.probeOne(next.id);
        }
      });
      await Promise.all(workers);

      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      this.logger.log(`Пробник закончил обход источников за ${elapsed}с`);
      return this.sourcesService.listSources();
    } finally {
      this.isRunning = false;
    }
  }

  /** Проверяет один источник и сразу применяет результат к его статусу. */
  async probeOne(sourceId: string): Promise<Source> {
    const source = await this.sourcesService.getSource(sourceId);
    if (this.isHardBroken(source)) {
      return source;
    }

    const error = await this.parsersClient.probe(sourceId);
    this.sourceStatus.applyProbeResult(sourceId, error);
    if (error) {
      this.logger.warn(`Пробник: ${sourceId} — ${error}`);
    } else {
      // Источник ответил по всей цепочке: открытый с вечера breaker незачем держать до утра,
      // иначе первые живые запросы упрутся в него и статус снова поедет вниз.
      this.sourceHealth.reset(sourceId);
    }

    return this.sourcesService.getSource(sourceId);
  }

  /**
   * isBroken из каталога — не статус, а признак «этот источник не парсится в принципе». Гонять
   * по нему проверку бессмысленно, а результат всё равно был бы отброшен: down у таких
   * источников проставляется поверх любого состояния (см. SourcesService.toSource).
   */
  private isHardBroken(source: Source): boolean {
    return source.statusReason === SOURCE_STATUS_REASON.BROKEN;
  }
}
