import type { TFunction } from 'i18next';
import {
  SOURCE_ACCOUNT_STATUS,
  SOURCE_AUTH_FAMILY,
  SOURCE_STATUS_REASON,
  type Source,
  type SourceAccount,
  type SourceAuthFamily,
  type SourcesResponse,
} from '@tanuki/contracts';
import { flattenSources } from '@/entities/source/lib';
import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';

/** Названия сетей — бренды, поэтому не переводятся. */
export const getSourceAuthFamilyTitle = (family: SourceAuthFamily) => {
  switch (family) {
    case SOURCE_AUTH_FAMILY.GROUPLE:
      return 'Grouple';
    case SOURCE_AUTH_FAMILY.ALLHENTAI:
      return 'AllHentai';
    case SOURCE_AUTH_FAMILY.LIBSOCIAL:
      return 'LibSocial';
    case SOURCE_AUTH_FAMILY.NUDEMOON:
      return 'Nude-Moon';
    case SOURCE_AUTH_FAMILY.DESU:
      return 'Desu';
    case SOURCE_AUTH_FAMILY.INKSTORY:
      return 'Inkstory';
  }
};

type AccountGroup = { key: string; title: string; family: SourceAuthFamily; sources: Source[] };

const byTitle = (a: Source, b: Source) => a.title.localeCompare(b.title);

/** Группы источников с аккаунтом в порядке SOURCE_AUTH_FAMILY — по одной на сеть, ведь и аккаунт у
 *  сети один. Источники без входа сюда не попадают. */
export const groupSourcesByAccount = (data?: SourcesResponse) => {
  const sources = flattenSources(data);
  return Object.values(SOURCE_AUTH_FAMILY).flatMap<AccountGroup>((family) => {
    const members = sources.filter((source) => source.authFamily === family).sort(byTitle);
    return members.length > 0
      ? [{ key: family, title: getSourceAuthFamilyTitle(family), family, sources: members }]
      : [];
  });
};

/** Цвет состояния аккаунта в шапке группы: без входа — фирменный, как призыв войти. */
export const getSourceAccountStatusColor = (account: SourceAccount | undefined) => {
  if (!account) return PRIMARY_COLOR;
  switch (account.status) {
    case SOURCE_ACCOUNT_STATUS.ACTIVE:
      return STATUS_OK_COLOR;
    case SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED:
      return STATUS_DEGRADED_COLOR;
  }
};

export const getSourceAccountStatusLabel = (account: SourceAccount | undefined, t: TFunction) => {
  if (!account) return t('accountNotLinked');
  switch (account.status) {
    case SOURCE_ACCOUNT_STATUS.ACTIVE:
      return t('loggedIn');
    case SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED:
      return t('reloginRequired');
  }
};

/**
 * Сайты LibSocial, для которых у действующего аккаунта нет токена: вход по паролю мог пройти не
 * везде, а вставленный токен подходит только своему сайту. Сломанные источники не в счёт — в них
 * всё равно не войти.
 */
export const getSourcesWithoutLogin = (account: SourceAccount | undefined, sources: Source[]) => {
  const { sourceIds } = account ?? {};
  if (!sourceIds || account?.status !== SOURCE_ACCOUNT_STATUS.ACTIVE) return [];
  return sources.filter(
    (source) =>
      !sourceIds.includes(source.id) && source.statusReason !== SOURCE_STATUS_REASON.BROKEN,
  );
};
