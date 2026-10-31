import { afterEach, describe, expect, it, vi } from 'vitest';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import {
  CookieJar,
  type LibSocialLoginResult,
  type LibSocialPendingLogin,
  type ParsersRegistry,
} from '@tanuki/parsers';
import { SourceLoginCodeRejectedException, SourceLoginExpiredException } from '../common/errors';
import type { SourceAccessService } from './source-access.service';
import { PENDING_LOGIN_TTL_MS } from './models';
import { LibSocialLoginService } from './libsocial-login.service';

const INPUT = { login: 'reader', password: 'secret', rememberPassword: false };
const TOKENS = { accessToken: 'access', refreshToken: 'refresh', expiresAt: 1_000_000 };
const PENDING: LibSocialPendingLogin = {
  pkce: { codeVerifier: 'verifier', state: 'state' },
  cookies: new CookieJar().serializeSync()!,
  form: { action: 'https://mangalib.me/auth/login/otp/verify', fields: {} },
  codeField: 'code',
  url: 'https://mangalib.me/auth/login/otp',
};

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const createService = (sourceIds = ['mangalib']) => {
  const login = vi.fn<ParsersRegistry['loginLibSocial']>().mockResolvedValue({ pending: PENDING });
  const confirm = vi.fn<ParsersRegistry['confirmLibSocialLogin']>().mockResolvedValue(TOKENS);
  const save = vi.fn().mockResolvedValue(undefined);
  const service = new LibSocialLoginService(
    {
      libSocialLoginSourceIds: () => [...sourceIds],
      loginLibSocial: login,
      confirmLibSocialLogin: confirm,
    } as unknown as ParsersRegistry,
    {
      isLinkingAvailable: true,
      save,
    } as unknown as SourceAccessService,
  );
  return { service, login, confirm, save };
};

const SERVICES: LibSocialLoginService[] = [];
const setUp = (sourceIds?: string[]) => {
  const context = createService(sourceIds);
  SERVICES.push(context.service);
  return context;
};

afterEach(() => {
  for (const service of SERVICES) service.onModuleDestroy();
  SERVICES.length = 0;
  vi.useRealTimers();
});

describe('LibSocialLoginService', () => {
  it('вход и код каждого сайта сохраняют только его аккаунт', async () => {
    const { service, login, confirm, save } = setUp(['mangalib', 'hentailib']);
    expect(await service.start('user', 'mangalib', INPUT)).toEqual({ pendingSourceId: 'mangalib' });
    expect(login).toHaveBeenCalledTimes(1);
    const otherInput = {
      ...INPUT,
      login: 'other-reader',
      password: 'other-password',
      rememberPassword: true,
    };
    expect(await service.start('user', 'hentailib', otherInput)).toEqual({
      pendingSourceId: 'hentailib',
    });
    expect(await service.confirm('user', 'mangalib', '123456')).toEqual({ pendingSourceId: null });
    expect(save).toHaveBeenCalledWith('user', SOURCE_AUTH_FAMILY.MANGALIB, {
      login: INPUT.login,
      password: null,
      state: { tokens: { mangalib: TOKENS } },
    });
    expect(await service.confirm('user', 'hentailib', '654321')).toEqual({ pendingSourceId: null });
    expect(confirm).toHaveBeenNthCalledWith(2, 'hentailib', PENDING, '654321');
    expect(save).toHaveBeenCalledWith('user', SOURCE_AUTH_FAMILY.HENTAILIB, {
      login: otherInput.login,
      password: otherInput.password,
      state: { tokens: { hentailib: TOKENS } },
    });
  });

  it('отмена кода одного сайта не отменяет вход на другом', async () => {
    const { service, save } = setUp(['mangalib', 'hentailib']);
    await service.start('user', 'mangalib', INPUT);
    await service.start('user', 'hentailib', INPUT);
    await service.skip('user', 'mangalib');
    await expect(service.confirm('user', 'mangalib', '123456')).rejects.toBeInstanceOf(
      SourceLoginExpiredException,
    );
    await service.confirm('user', 'hentailib', '654321');
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]?.[1]).toBe(SOURCE_AUTH_FAMILY.HENTAILIB);
  });

  it('не начинает вход на неподдерживаемый сайт', async () => {
    const { service, login } = setUp();
    await expect(service.start('user', 'desume', INPUT)).rejects.toThrow();
    expect(login).not.toHaveBeenCalled();
  });

  it('запоздалый старт не заменяет новую попытку', async () => {
    const { service, login, confirm } = setUp();
    const oldResult = deferred<LibSocialLoginResult>();
    const started = deferred<void>();
    login.mockImplementationOnce(() => {
      started.resolve();
      return oldResult.promise;
    });
    const old = service.start('user', 'mangalib', INPUT);
    const oldRejected = expect(old).rejects.toBeInstanceOf(SourceLoginExpiredException);
    await started.promise;
    const fresh = service.start('user', 'mangalib', { ...INPUT, login: 'new-reader' });
    oldResult.resolve({ pending: { ...PENDING, codeField: 'old-code' } });
    await oldRejected;
    expect(await fresh).toEqual({ pendingSourceId: 'mangalib' });
    await service.confirm('user', 'mangalib', '123456');
    expect(confirm).toHaveBeenCalledWith('mangalib', PENDING, '123456');
  });

  it('confirm и skip не выполняют один шаг одновременно', async () => {
    const { service, confirm, save } = setUp();
    await service.start('user', 'mangalib', INPUT);
    const result = deferred<typeof TOKENS | null>();
    confirm.mockReturnValueOnce(result.promise);
    const confirmation = service.confirm('user', 'mangalib', '123456');
    await expect(service.skip('user', 'mangalib')).rejects.toBeInstanceOf(
      SourceLoginExpiredException,
    );
    await expect(service.confirm('user', 'mangalib', '654321')).rejects.toBeInstanceOf(
      SourceLoginExpiredException,
    );
    result.resolve(TOKENS);
    await confirmation;
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('неверный код позволяет повторить ввод в той же попытке', async () => {
    const { service, confirm } = setUp();
    await service.start('user', 'mangalib', INPUT);
    confirm.mockResolvedValueOnce(null);
    await expect(service.confirm('user', 'mangalib', '000000')).rejects.toBeInstanceOf(
      SourceLoginCodeRejectedException,
    );
    expect(await service.confirm('user', 'mangalib', '123456')).toEqual({ pendingSourceId: null });
  });

  it('старый таймер не удаляет новую попытку', async () => {
    vi.useFakeTimers();
    const { service } = setUp();
    await service.start('user', 'mangalib', INPUT);
    await vi.advanceTimersByTimeAsync(PENDING_LOGIN_TTL_MS - 1);
    await service.start('user', 'mangalib', INPUT);
    await vi.advanceTimersByTimeAsync(1);
    expect(await service.confirm('user', 'mangalib', '123456')).toEqual({ pendingSourceId: null });
  });

  it('подтверждение старой попытки не сохраняет её после нового старта', async () => {
    const { service, confirm, save } = setUp();
    await service.start('user', 'mangalib', INPUT);
    const result = deferred<typeof TOKENS | null>();
    const started = deferred<void>();
    confirm.mockImplementationOnce(() => {
      started.resolve();
      return result.promise;
    });
    const old = service.confirm('user', 'mangalib', '123456');
    const oldRejected = expect(old).rejects.toBeInstanceOf(SourceLoginExpiredException);
    await started.promise;
    const fresh = service.start('user', 'mangalib', INPUT);
    result.resolve(TOKENS);
    await oldRejected;
    await fresh;
    expect(save).not.toHaveBeenCalled();
    expect(await service.confirm('user', 'mangalib', '654321')).toEqual({ pendingSourceId: null });
  });

  it('новое сохранение ждёт уже начатой записи прежней попытки', async () => {
    const { service, login, save } = setUp();
    login.mockResolvedValue({ tokens: TOKENS });
    const saving = deferred<void>();
    const started = deferred<void>();
    save.mockImplementationOnce(() => {
      started.resolve();
      return saving.promise;
    });
    const old = service.start('user', 'mangalib', INPUT);
    const oldRejected = expect(old).rejects.toBeInstanceOf(SourceLoginExpiredException);
    await started.promise;
    const fresh = service.start('user', 'mangalib', { ...INPUT, login: 'new-reader' });
    expect(save).toHaveBeenCalledTimes(1);
    saving.resolve();
    await oldRejected;
    await fresh;
    expect(save.mock.calls.map(([, , input]) => input.login)).toEqual(['reader', 'new-reader']);
  });
});
