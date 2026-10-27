import { useMutation } from '@tanstack/react-query';
import type { LinkSourceSessionRequest, SourceAuthFamily } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import useInvalidateSourceAccess from './useInvalidateSourceAccess';

type Variables = LinkSourceSessionRequest & { family: SourceAuthFamily };

function useLinkSourceSession() {
  const invalidateSourceAccess = useInvalidateSourceAccess();

  return useMutation({
    // Форма показывает ошибку под полем сессии.
    meta: SILENT_ERROR_META,
    mutationFn: ({ family, ...body }: Variables) =>
      apiFetch(`/source-accounts/${family}/session`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: invalidateSourceAccess,
  });
}

export default useLinkSourceSession;
