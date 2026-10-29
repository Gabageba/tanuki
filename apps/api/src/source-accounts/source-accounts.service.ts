import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  SOURCE_ACCOUNT_STATUS,
  SOURCE_AUTH_FAMILY,
  catalogEntryFor,
  type SourceAccount,
  type SourceAccountsResponse,
  type SourceAuthFamily,
} from '@tanuki/contracts';
import {
  SourceBlockedError,
  SourceUnavailableError,
  parseLibSocialAuthValue,
  type LibSocialTokenState,
  type ParsersRegistry,
  type PasswordAuthFamily,
  type SessionAuthFamily,
} from '@tanuki/parsers';
import {
  BadRequestApiException,
  SourceBlockedException,
  SourceLinkingUnavailableException,
  SourceLoginFailedException,
  SourceUnavailableException,
} from '../common/errors';
import { toServerDateTime } from '../common/dates';
import { PARSERS } from '../parsers-client/parsers.provider';
import { SourceAccessService, type SourceAccountRow } from './source-access.service';

const toSourceAccount = (row: SourceAccountRow, sourceIds: string[] | null): SourceAccount => ({
  family: row.family,
  sourceIds,
  login: row.login,
  status: row.status,
  hasSavedPassword: row.encryptedPassword !== null,
  linkedAt: toServerDateTime(row.linkedAt.getTime()),
});

const isPasswordFamily = (family: SourceAuthFamily): family is PasswordAuthFamily =>
  family === SOURCE_AUTH_FAMILY.GROUPLE ||
  family === SOURCE_AUTH_FAMILY.ALLHENTAI ||
  family === SOURCE_AUTH_FAMILY.NUDEMOON ||
  family === SOURCE_AUTH_FAMILY.DESU ||
  family === SOURCE_AUTH_FAMILY.MANGABUFF;

const isSessionFamily = (family: SourceAuthFamily): family is SessionAuthFamily =>
  family === SOURCE_AUTH_FAMILY.INUKO;

/** Привязка и отвязка личных аккаунтов источников — то, что человек делает в настройках. */
@Injectable()
export class SourceAccountsService {
  private readonly logger = new Logger(SourceAccountsService.name);

  constructor(
    @Inject(PARSERS) private readonly parsers: ParsersRegistry,
    private readonly sourceAccess: SourceAccessService,
  ) {}

  async list(userId: string): Promise<SourceAccountsResponse> {
    const rows = await this.sourceAccess.listRows(userId);
    const items = await Promise.all(
      rows.map(async (row) =>
        toSourceAccount(
          row,
          row.family === SOURCE_AUTH_FAMILY.LIBSOCIAL
            ? Object.keys((await this.sourceAccess.getLibSocialSecrets(userId, row)).tokens)
            : null,
        ),
      ),
    );
    return { items, isLinkingAvailable: this.sourceAccess.isLinkingAvailable };
  }

  /**
   * Grouple, AllHentai, Nude-Moon, Desu и MangaBuff: сервер сам входит на сайт (у Grouple и
   * AllHentai — через шлюз SSO) и сохраняет полученную сессию. Пароль хранится, только если
   * человек разрешил, — иначе он нужен лишь на время входа.
   */
  async linkWithPassword(
    userId: string,
    family: SourceAuthFamily,
    input: { login: string; password: string; rememberPassword: boolean },
  ): Promise<void> {
    if (!isPasswordFamily(family)) throw new BadRequestApiException();
    if (!this.sourceAccess.isLinkingAvailable) throw new SourceLinkingUnavailableException();

    // Сайт не ответил — это не «неверный логин», а недоступность источника.
    const jar = await this.parsers
      .loginAccount(family, { username: input.login, password: input.password })
      .catch((error: unknown) => {
        if (error instanceof SourceBlockedError) throw new SourceBlockedException();
        if (error instanceof SourceUnavailableError) throw new SourceUnavailableException();
        throw error;
      });
    const cookies = jar?.serializeSync();
    if (!cookies) throw new SourceLoginFailedException();

    await this.sourceAccess.save(userId, family, {
      login: input.login,
      password: input.rememberPassword ? input.password : null,
      state: { cookies },
    });
  }

  /**
   * Сеть inuko (Inkstory, PureManga): вход на SSO закрыт капчей для людей, поэтому человек входит
   * на любом сайте сети сам и переносит cookie сессии. Сервер только проверяет, что один из сайтов
   * её узнаёт, — пароля нет, и истёкшую сессию человек переносит заново.
   */
  async linkSession(userId: string, family: SourceAuthFamily, value: string): Promise<void> {
    if (!isSessionFamily(family)) throw new BadRequestApiException();
    if (!this.sourceAccess.isLinkingAvailable) throw new SourceLinkingUnavailableException();

    const linked = await this.parsers.linkSession(family, value).catch((error: unknown) => {
      if (error instanceof SourceBlockedError) throw new SourceBlockedException();
      if (error instanceof SourceUnavailableError) throw new SourceUnavailableException();
      throw error;
    });
    const cookies = linked?.jar.serializeSync();
    if (!linked || !cookies) throw new SourceLoginFailedException();

    await this.sourceAccess.save(userId, family, {
      login: linked.login || null,
      password: null,
      state: { cookies },
    });
  }

  /**
   * LibSocial, запасной путь: человек входит на сайте сам и вставляет токен из его localStorage
   * — для тех, у кого на сайте нет пароля (вход через VK или Яндекс). Токен подходит только
   * сайту, с которого взят, и добавляется к токенам уже привязанного аккаунта.
   */
  async linkLibSocialToken(userId: string, sourceId: string, value: string): Promise<void> {
    if (catalogEntryFor(sourceId).authFamily !== SOURCE_AUTH_FAMILY.LIBSOCIAL) {
      throw new BadRequestApiException();
    }
    if (!this.sourceAccess.isLinkingAvailable) throw new SourceLinkingUnavailableException();

    let token = parseLibSocialAuthValue(value);
    if (!token) throw new SourceLoginFailedException();

    let accountName: string | null;
    try {
      accountName = await this.parsers.fetchLibSocialAccountName(sourceId, {
        key: `link:${userId}:${sourceId}`,
        read: () => Promise.resolve(token),
        write: (next: LibSocialTokenState) => {
          token = next;
          return Promise.resolve();
        },
      });
    } catch {
      throw new SourceLoginFailedException();
    }
    if (accountName === null) throw new SourceLoginFailedException();

    // Токены действующего аккаунта сохраняем, а после отвергнутой сессии начинаем с чистого
    // листа — неизвестно, какой из старых токенов сайт перестал принимать.
    const rows = await this.sourceAccess.listRows(userId);
    const current = rows.find(
      (row) =>
        row.family === SOURCE_AUTH_FAMILY.LIBSOCIAL && row.status === SOURCE_ACCOUNT_STATUS.ACTIVE,
    );
    const { tokens, password } = current
      ? await this.sourceAccess.getLibSocialSecrets(userId, current)
      : { tokens: {}, password: null };

    await this.sourceAccess.save(userId, SOURCE_AUTH_FAMILY.LIBSOCIAL, {
      login: current?.login ?? (accountName || null),
      password,
      state: { tokens: { ...tokens, [sourceId]: token } },
    });
  }

  async unlink(userId: string, family: SourceAuthFamily) {
    await this.sourceAccess.remove(userId, family);
  }
}
