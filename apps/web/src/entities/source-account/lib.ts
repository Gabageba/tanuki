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
    case SOURCE_AUTH_FAMILY.MANGALIB:
      return 'MangaLib';
    case SOURCE_AUTH_FAMILY.HENTAILIB:
      return 'HentaiLib';
    case SOURCE_AUTH_FAMILY.LIBSOCIAL:
      return 'SlashLib';
    case SOURCE_AUTH_FAMILY.NUDEMOON:
      return 'Nude-Moon';
    case SOURCE_AUTH_FAMILY.DESU:
      return 'Desu';
    case SOURCE_AUTH_FAMILY.INUKO:
      return 'Inuko';
    case SOURCE_AUTH_FAMILY.REMANGA:
      return 'ReManga';
    case SOURCE_AUTH_FAMILY.WAMANGA:
      return 'WaManga';
    case SOURCE_AUTH_FAMILY.MULTPORN:
      return 'MultPorn';
    case SOURCE_AUTH_FAMILY.HENTAICHAN_CC:
      return 'HentaiChan';
    case SOURCE_AUTH_FAMILY.TOMILOLIB:
      return 'TomiloLib';
    case SOURCE_AUTH_FAMILY.SENKURO:
      return 'Senkuro';
    case SOURCE_AUTH_FAMILY.MANGABUFF:
      return 'MangaBuff';
  }
};

type AccountGroup = { key: string; title: string; family: SourceAuthFamily; sources: Source[] };

/** По одной группе на аккаунт: место группы задаёт первый источник в порядке пользователя,
 *  остальные источники сохраняют свой относительный порядок внутри неё. */
export const groupSourcesByAccount = (data?: SourcesResponse) => {
  const groups = new Map<SourceAuthFamily, AccountGroup>();
  for (const source of flattenSources(data)) {
    const family = source.authFamily;
    if (!family) continue;
    const group = groups.get(family);
    if (group) {
      group.sources.push(source);
    } else {
      groups.set(family, {
        key: family,
        title: getSourceAuthFamilyTitle(family),
        family,
        sources: [source],
      });
    }
  }
  return [...groups.values()];
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
 * Сайты, для которых у действующего аккаунта нет токена. У MangaLib и HentaiLib
 * по одному сайту на аккаунт. Сломанные источники не в счёт — в них
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
