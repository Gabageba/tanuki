import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  SOURCE_AUTH_FAMILY,
  isLibSocialAuthFamily,
  catalogEntryFor,
  type SourceAccount,
  type SourceAccountsResponse,
  type SourceAuthFamily,
} from '@tanuki/contracts';
import {
  SourceBlockedError,
  SourceLoginRequiresSessionError,
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
  family === SOURCE_AUTH_FAMILY.MANGABUFF ||
  family === SOURCE_AUTH_FAMILY.REMANGA ||
  family === SOURCE_AUTH_FAMILY.TOMILOLIB ||
  family === SOURCE_AUTH_FAMILY.WAMANGA;

const isSessionFamily = (family: SourceAuthFamily): family is SessionAuthFamily =>
  family === SOURCE_AUTH_FAMILY.INUKO ||
  family === SOURCE_AUTH_FAMILY.REMANGA ||
  family === SOURCE_AUTH_FAMILY.SENKURO ||
  family === SOURCE_AUTH_FAMILY.HENTAICHAN_CC;

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
          isLibSocialAuthFamily(row.family)
            ? Object.keys((await this.sourceAccess.getLibSocialSecrets(userId, row)).tokens)
            : null,
        ),
      ),
    );
    return { items, isLinkingAvailable: this.sourceAccess.isLinkingAvailable };
  }

  /**
   * Grouple, AllHentai, Nude-Moon, Desu, MangaBuff, ReManga, TomiloLib и WaManga: сервер сам входит на сайт (у Grouple и
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
        if (error instanceof SourceLoginRequiresSessionError)
          throw new SourceLoginFailedException('sourceRequiresCodeTransferSession');
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
   * Inuko, ReManga, Senkuro и Senkognito: человек входит на сайте сам и переносит cookie сессии. Сервер проверяет
   * аккаунт через сайт или API; пароль при переносе не сохраняется, истёкшую сессию переносят заново.
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
   * сайту, с которого взят, и заменяет только его аккаунт.
   */
  async linkLibSocialToken(userId: string, sourceId: string, value: string): Promise<void> {
    const family = catalogEntryFor(sourceId).authFamily;
    if (!family || !isLibSocialAuthFamily(family)) {
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

    await this.sourceAccess.save(userId, family, {
      login: accountName || null,
      password: null,
      state: { tokens: { [sourceId]: token } },
    });
  }

  async unlink(userId: string, family: SourceAuthFamily) {
    await this.sourceAccess.remove(userId, family);
  }
}
