import { useMutation } from '@tanstack/react-query';
import type { LinkSourceAccountRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import useInvalidateSourceAccess from './useInvalidateSourceAccess';

function useLinkLibSocialAccount() {
  const invalidateSourceAccess = useInvalidateSourceAccess();

  return useMutation({
    // Форма показывает ошибку под полем пароля.
    meta: SILENT_ERROR_META,
    mutationFn: (body: LinkSourceAccountRequest) =>
      apiFetch('/source-accounts/libsocial/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: invalidateSourceAccess,
  });
}

export default useLinkLibSocialAccount;
