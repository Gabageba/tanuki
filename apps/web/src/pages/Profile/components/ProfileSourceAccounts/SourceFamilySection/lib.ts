import {
  SOURCE_ACCOUNT_STATUS,
  SOURCE_STATUS_REASON,
  type Source,
  type SourceAccount,
} from '@tanuki/contracts';

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
