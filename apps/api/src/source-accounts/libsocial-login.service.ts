import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { SOURCE_AUTH_FAMILY, type LibSocialLoginStep } from '@tanuki/contracts';
import { SourceUnavailableError, type ParsersRegistry } from '@tanuki/parsers';
import {
  SourceLinkingUnavailableException,
  SourceLoginCodeRejectedException,
  SourceLoginExpiredException,
  SourceLoginFailedException,
  SourceUnavailableException,
} from '../common/errors';
import { PARSERS } from '../parsers-client/parsers.provider';
import { SourceAccessService } from './source-access.service';
import { PENDING_LOGIN_TTL_MS, type LoginAttempt, type LoginInput } from './models';

/**
 * Сайты LibSocial входят по очереди: каждый может прислать код, а в письме не указан сайт.
 * Попытка живёт в памяти API. Новая попытка отменяет прежнюю; операции пользователя идут
 * последовательно, включая сохранение аккаунта, чтобы старый вход не затёр новый.
 */
@Injectable()
export class LibSocialLoginService implements OnModuleDestroy {
  private readonly logger = new Logger(LibSocialLoginService.name);
  private readonly attempts = new Map<string, LoginAttempt>();
  private readonly operations = new Map<string, Promise<LibSocialLoginStep>>();

  constructor(
    @Inject(PARSERS) private readonly parsers: ParsersRegistry,
    private readonly sourceAccess: SourceAccessService,
  ) {}

  async start(userId: string, input: LoginInput): Promise<LibSocialLoginStep> {
    if (!this.sourceAccess.isLinkingAvailable) throw new SourceLinkingUnavailableException();
    this.drop(userId);
    const attempt: LoginAttempt = {
      ...input,
      tokens: {},
      queue: this.parsers.libSocialLoginSourceIds(),
      pending: null,
      expiry: null,
      busy: true,
    };
    this.attempts.set(userId, attempt);
    return this.run(userId, attempt, () => this.advance(userId, attempt));
  }

  async confirm(userId: string, code: string): Promise<LibSocialLoginStep> {
    const attempt = this.take(userId);
    const pending = attempt.pending!;
    return this.run(userId, attempt, async () => {
      let tokens;
      try {
        tokens = await this.parsers.confirmLibSocialLogin(pending.sourceId, pending.state, code);
      } catch (error) {
        this.assertCurrent(userId, attempt);
        if (error instanceof SourceUnavailableError) throw new SourceUnavailableException();
        this.logger.warn(
          `Вход в ${pending.sourceId} по коду не удался: ${(error as Error).message}`,
        );
        this.drop(userId, attempt);
        throw new SourceLoginExpiredException();
      }
      this.assertCurrent(userId, attempt);
      if (!tokens) throw new SourceLoginCodeRejectedException();
      this.clearPending(attempt);
      attempt.tokens[pending.sourceId] = tokens;
      return this.advance(userId, attempt);
    });
  }

  /** Пропуск последнего сайта без единого токена — отмена входа. */
  async skip(userId: string): Promise<LibSocialLoginStep> {
    const attempt = this.take(userId);
    return this.run(userId, attempt, () => {
      this.clearPending(attempt);
      return this.advance(userId, attempt, true);
    });
  }

  onModuleDestroy() {
    for (const userId of this.attempts.keys()) this.drop(userId);
  }

  private async advance(
    userId: string,
    state: LoginAttempt,
    allowEmpty = false,
  ): Promise<LibSocialLoginStep> {
    this.assertCurrent(userId, state);
    const sourceId = state.queue.shift();
    if (!sourceId) {
      if (Object.keys(state.tokens).length === 0) {
        if (allowEmpty) return { pendingSourceId: null };
        throw new SourceLoginFailedException();
      }
      await this.sourceAccess.save(userId, SOURCE_AUTH_FAMILY.LIBSOCIAL, {
        login: state.login,
        password: state.rememberPassword ? state.password : null,
        state: { tokens: state.tokens },
      });
      this.assertCurrent(userId, state);
      return { pendingSourceId: null };
    }

    const result = await this.parsers
      .loginLibSocial(sourceId, { username: state.login, password: state.password })
      .catch((error) => {
        this.logger.warn(`Вход в ${sourceId} не удался: ${(error as Error).message}`);
        return null;
      });
    this.assertCurrent(userId, state);
    if (result && 'pending' in result) {
      state.pending = { sourceId, state: result.pending };
      state.expiry = setTimeout(() => this.drop(userId, state), PENDING_LOGIN_TTL_MS);
      state.expiry.unref();
      return { pendingSourceId: sourceId };
    }
    if (result) state.tokens[sourceId] = result.tokens;
    return this.advance(userId, state, allowEmpty);
  }

  /** Захватывает шаг до первого await: второй confirm/skip не может отправить его снова. */
  private take(userId: string): LoginAttempt {
    const attempt = this.attempts.get(userId);
    if (!attempt?.pending || attempt.busy) throw new SourceLoginExpiredException();
    attempt.busy = true;
    return attempt;
  }

  private async run(
    userId: string,
    state: LoginAttempt,
    action: () => Promise<LibSocialLoginStep>,
  ): Promise<LibSocialLoginStep> {
    const previous = this.operations.get(userId);
    const operation = (previous ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => {
        this.assertCurrent(userId, state);
        return action();
      });
    this.operations.set(userId, operation);
    try {
      return await operation;
    } finally {
      state.busy = false;
      if (!state.pending) this.drop(userId, state);
      if (this.operations.get(userId) === operation) this.operations.delete(userId);
    }
  }

  private assertCurrent(userId: string, attempt: LoginAttempt) {
    if (this.attempts.get(userId) !== attempt) throw new SourceLoginExpiredException();
  }

  private clearPending(state: LoginAttempt) {
    if (state.expiry) clearTimeout(state.expiry);
    state.expiry = null;
    state.pending = null;
  }

  private drop(userId: string, expected?: LoginAttempt) {
    const attempt = this.attempts.get(userId);
    if (!attempt || (expected && attempt !== expected)) return;
    this.clearPending(attempt);
    this.attempts.delete(userId);
  }
}
