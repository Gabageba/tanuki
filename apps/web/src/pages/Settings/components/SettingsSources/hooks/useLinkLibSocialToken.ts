import { useMutation } from '@tanstack/react-query';
import type { LinkLibSocialTokenRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import useInvalidateSourceAccess from './useInvalidateSourceAccess';

function useLinkLibSocialToken() {
  const invalidateSourceAccess = useInvalidateSourceAccess();

  return useMutation({
    meta: SILENT_ERROR_META,
    mutationFn: (body: LinkLibSocialTokenRequest) =>
      apiFetch('/source-accounts/libsocial/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: invalidateSourceAccess,
  });
}

export default useLinkLibSocialToken;
