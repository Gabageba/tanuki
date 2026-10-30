import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { catalogEntryFor, type LibSocialLoginStep } from '@tanuki/contracts';
import {
  SourceUnavailableError,
  type LibSocialTokenState,
  type ParsersRegistry,
} from '@tanuki/parsers';
import {
  BadRequestApiException,
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
 * Каждый сайт LibSocial входит отдельно и может прислать код. Попытка живёт в памяти API.
 * Новая попытка отменяет прежнюю только на том же сайте; его операции идут
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

  async start(userId: string, sourceId: string, input: LoginInput): Promise<LibSocialLoginStep> {
    if (!this.sourceAccess.isLinkingAvailable) throw new SourceLinkingUnavailableException();
    if (!this.parsers.libSocialLoginSourceIds().includes(sourceId)) {
      throw new BadRequestApiException();
    }
    const key = `${userId}:${sourceId}`;
    this.drop(key);
    const attempt: LoginAttempt = {
      ...input,
      userId,
      sourceId,
      pending: null,
      expiry: null,
      busy: true,
    };
    this.attempts.set(key, attempt);
    return this.run(key, attempt, () => this.login(key, attempt));
  }

  async confirm(userId: string, sourceId: string, code: string): Promise<LibSocialLoginStep> {
    const key = `${userId}:${sourceId}`;
    const attempt = this.take(key);
    const pending = attempt.pending!;
    return this.run(key, attempt, async () => {
      let tokens;
      try {
        tokens = await this.parsers.confirmLibSocialLogin(attempt.sourceId, pending, code);
      } catch (error) {
        this.assertCurrent(key, attempt);
        if (error instanceof SourceUnavailableError) throw new SourceUnavailableException();
        this.logger.warn(
          `Вход в ${attempt.sourceId} по коду не удался: ${(error as Error).message}`,
        );
        this.drop(key, attempt);
        throw new SourceLoginExpiredException();
      }
      this.assertCurrent(key, attempt);
      if (!tokens) throw new SourceLoginCodeRejectedException();
      this.clearPending(attempt);
      return this.save(key, attempt, tokens);
    });
  }

  /** Отмена ожидающего код входа только на выбранном сайте. */
  async skip(userId: string, sourceId: string): Promise<LibSocialLoginStep> {
    const key = `${userId}:${sourceId}`;
    const attempt = this.take(key);
    return this.run(key, attempt, () => {
      this.clearPending(attempt);
      return Promise.resolve({ pendingSourceId: null });
    });
  }

  onModuleDestroy() {
    for (const key of this.attempts.keys()) this.drop(key);
  }

  private async login(key: string, state: LoginAttempt): Promise<LibSocialLoginStep> {
    const sourceId = state.sourceId;
    const result = await this.parsers
      .loginLibSocial(sourceId, { username: state.login, password: state.password })
      .catch((error) => {
        this.logger.warn(`Вход в ${sourceId} не удался: ${(error as Error).message}`);
        if (error instanceof SourceUnavailableError) throw new SourceUnavailableException();
        return null;
      });
    this.assertCurrent(key, state);
    if (!result) throw new SourceLoginFailedException();
    if ('pending' in result) {
      state.pending = result.pending;
      state.expiry = setTimeout(() => this.drop(key, state), PENDING_LOGIN_TTL_MS);
      state.expiry.unref();
      return { pendingSourceId: sourceId };
    }
    return this.save(key, state, result.tokens);
  }

  private async save(
    key: string,
    state: LoginAttempt,
    tokens: LibSocialTokenState,
  ): Promise<LibSocialLoginStep> {
    await this.sourceAccess.save(state.userId, catalogEntryFor(state.sourceId).authFamily!, {
      login: state.login,
      password: state.rememberPassword ? state.password : null,
      state: { tokens: { [state.sourceId]: tokens } },
    });
    this.assertCurrent(key, state);
    return { pendingSourceId: null };
  }

  /** Захватывает шаг до первого await: второй confirm/skip не может отправить его снова. */
  private take(key: string): LoginAttempt {
    const attempt = this.attempts.get(key);
    if (!attempt?.pending || attempt.busy) throw new SourceLoginExpiredException();
    attempt.busy = true;
    return attempt;
  }

  private async run(
    key: string,
    state: LoginAttempt,
    action: () => Promise<LibSocialLoginStep>,
  ): Promise<LibSocialLoginStep> {
    const previous = this.operations.get(key);
    const operation = (previous ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => {
        this.assertCurrent(key, state);
        return action();
      });
    this.operations.set(key, operation);
    try {
      return await operation;
    } finally {
      state.busy = false;
      if (!state.pending) this.drop(key, state);
      if (this.operations.get(key) === operation) this.operations.delete(key);
    }
  }

  private assertCurrent(key: string, attempt: LoginAttempt) {
    if (this.attempts.get(key) !== attempt) throw new SourceLoginExpiredException();
  }

  private clearPending(state: LoginAttempt) {
    if (state.expiry) clearTimeout(state.expiry);
    state.expiry = null;
    state.pending = null;
  }

  private drop(key: string, expected?: LoginAttempt) {
    const attempt = this.attempts.get(key);
    if (!attempt || (expected && attempt !== expected)) return;
    this.clearPending(attempt);
    this.attempts.delete(key);
  }
}
