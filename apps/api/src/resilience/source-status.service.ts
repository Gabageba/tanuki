import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { SOURCE_STATUS, SOURCE_STATUS_REASON, type SourceStatusReason } from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import { sourceHealth } from '../database/schema';
import { SourceStatusNotifierService } from '../notifications/source-status-notifier.service';
import { defaultStatusEntry, type SourceStatusEntry } from './models';

/**
 * «Липкий» статус источника — тот, что видит пользователь в /sources.
 *
 * Сознательно отделён от SourceHealthService: тот гасит трафик к неотвечающему сайту на
 * несколько минут и сам собой закрывается, а статус держится, пока его не сменит явное событие —
 * открывшийся breaker или ночной пробник. Раньше статус вычислялся прямо из breaker'а, и
 * источник, лежащий неделю, показывался «онлайн» через десять минут после последней ошибки.
 *
 * Ручного сброса нет и намеренно: статус — сигнал о реальном состоянии источника, а не тумблер.
 * Кто-то нажавший «сбросить» не чинит источник — источник либо сам ответит на живом трафике
 * (recordSuccess), либо это подтвердит ночной пробник (applyProbeResult). Обход этого через ручной
 * сброс обесценивал бы весь смысл липкого статуса.
 *
 * Источник правды в рантайме — карта в памяти; Postgres нужен, чтобы статус пережил рестарт.
 * Поэтому в базу пишутся только переходы статуса и итоги ночного прогона, а не каждый успешный
 * запрос. Недоступная база не ломает сервис: он деградирует до чисто памятного поведения.
 */
@Injectable()
export class SourceStatusService implements OnModuleInit {
  private readonly logger = new Logger(SourceStatusService.name);
  private readonly entries = new Map<string, SourceStatusEntry>();

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly database: DatabaseService,
    private readonly notifier: SourceStatusNotifierService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rows = await this.database.withFallback(
      () => this.database.db.select().from(sourceHealth),
      [],
    );
    for (const row of rows) {
      this.entries.set(row.sourceId, {
        status: row.status,
        reason: row.reason,
        failedProbeStreak: row.failedProbeStreak,
        lastError: row.lastError,
        checkedAt: row.checkedAt,
        statusChangedAt: row.statusChangedAt,
        // Счётчик живых успехов не персистится — после рестарта источник копит его заново.
        successStreak: 0,
      });
    }
    if (rows.length > 0) {
      this.logger.log(`Восстановлены статусы источников: ${rows.length}`);
    }
  }

  /** Полная запись — из неё собираются и status, и детали для страницы здоровья. */
  get(sourceId: string): SourceStatusEntry {
    return this.entries.get(sourceId) ?? defaultStatusEntry();
  }

  /**
   * Успешный живой запрос. Статус поднимается не с первого успеха, а с серии: одиночный ответ
   * на фоне общей неработоспособности источника ещё ничего не значит.
   */
  recordSuccess(sourceId: string): void {
    const entry = this.get(sourceId);
    if (entry.status === SOURCE_STATUS.OK) {
      return;
    }

    entry.successStreak += 1;
    this.entries.set(sourceId, entry);
    if (entry.successStreak < this.env.SOURCE_RECOVERY_SUCCESS_THRESHOLD) {
      return;
    }

    this.transition(sourceId, {
      ...entry,
      status: SOURCE_STATUS.OK,
      reason: SOURCE_STATUS_REASON.RECOVERED,
      failedProbeStreak: 0,
      lastError: null,
    });
  }

  /**
   * Источник перестал отвечать на живом трафике (открылся breaker). Уже помеченный down тут не
   * трогается: down строже degraded, и снять его может только успех, а не новая ошибка.
   */
  markDegraded(sourceId: string, reason: SourceStatusReason, error: string | null): void {
    const entry = this.get(sourceId);
    entry.successStreak = 0;
    this.entries.set(sourceId, entry);

    if (entry.status === SOURCE_STATUS.DOWN) {
      return;
    }

    this.transition(sourceId, {
      ...entry,
      status: SOURCE_STATUS.DEGRADED,
      reason,
      lastError: error,
    });
  }

  /**
   * Итог ночного прогона. Успех возвращает источник в строй сразу — в отличие от живого трафика,
   * это полная проверка цепочки чтения, а не один удачный запрос. Провал сначала делает источник
   * нестабильным и лишь после нескольких ночей подряд — неработающим: разовый ночной сбой чаще
   * означает проблему сети, чем сломанный сайт.
   */
  applyProbeResult(sourceId: string, error: string | null): void {
    const entry = this.get(sourceId);
    const checkedAt = new Date();

    if (!error) {
      this.transition(sourceId, {
        ...entry,
        status: SOURCE_STATUS.OK,
        reason: SOURCE_STATUS_REASON.RECOVERED,
        failedProbeStreak: 0,
        lastError: null,
        checkedAt,
        successStreak: 0,
      });
      return;
    }

    const failedProbeStreak = entry.failedProbeStreak + 1;
    this.transition(sourceId, {
      ...entry,
      status:
        failedProbeStreak >= this.env.SOURCE_PROBE_FAILURE_THRESHOLD
          ? SOURCE_STATUS.DOWN
          : SOURCE_STATUS.DEGRADED,
      reason: SOURCE_STATUS_REASON.PROBE_FAILED,
      failedProbeStreak,
      lastError: error,
      checkedAt,
      successStreak: 0,
    });
  }

  /**
   * Применяет новое состояние к карте и в фоне сохраняет его. statusChangedAt обновляется
   * только при реальной смене статуса — иначе «нестабилен с 3 сентября» превращалось бы в
   * «нестабилен с минуты назад» после каждой очередной ошибки.
   *
   * `reason` в параметре — не `SourceStatusEntry['reason']` (тот допускает null для нетронутого
   * источника), а всегда конкретное значение: transition вызывается только тремя методами выше,
   * и каждый из них знает, чем вызвана смена статуса.
   */
  private transition(
    sourceId: string,
    next: Omit<SourceStatusEntry, 'reason'> & { reason: SourceStatusReason },
  ): void {
    const previous = this.get(sourceId);
    const statusChangedAt = next.status === previous.status ? previous.statusChangedAt : new Date();
    this.entries.set(sourceId, { ...next, statusChangedAt });

    if (next.status !== previous.status) {
      this.logger.log(`Источник ${sourceId}: ${previous.status} → ${next.status} (${next.reason})`);
      void this.notifier.onStatusChanged(sourceId, previous.status, next.status, next.reason);
    }

    void this.persist(sourceId, { ...next, statusChangedAt });
  }

  private async persist(
    sourceId: string,
    entry: Omit<SourceStatusEntry, 'reason'> & { reason: SourceStatusReason },
  ): Promise<void> {
    const row = {
      sourceId,
      status: entry.status,
      reason: entry.reason,
      failedProbeStreak: entry.failedProbeStreak,
      lastError: entry.lastError,
      checkedAt: entry.checkedAt,
      statusChangedAt: entry.statusChangedAt ?? new Date(),
      updatedAt: new Date(),
    };
    await this.database.withFallback(
      () =>
        this.database.db
          .insert(sourceHealth)
          .values(row)
          .onConflictDoUpdate({ target: sourceHealth.sourceId, set: row }),
      undefined,
    );
  }
}
