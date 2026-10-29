import { useMutation } from '@tanstack/react-query';
import type { LibSocialLoginStep, LinkSourceAccountRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import useInvalidateSourceAccess from './useInvalidateSourceAccess';

function useLinkLibSocialAccount() {
  const invalidateSourceAccess = useInvalidateSourceAccess();

  return useMutation({
    // Форма показывает ошибку под полем пароля.
    meta: SILENT_ERROR_META,
    mutationFn: (body: LinkSourceAccountRequest) =>
      apiFetch<LibSocialLoginStep>('/source-accounts/libsocial/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    // Сайт, ждущий код из письма, — вход ещё не сохранён.
    onSuccess: (step) => (step.pendingSourceId ? undefined : invalidateSourceAccess()),
  });
}

export default useLinkLibSocialAccount;
