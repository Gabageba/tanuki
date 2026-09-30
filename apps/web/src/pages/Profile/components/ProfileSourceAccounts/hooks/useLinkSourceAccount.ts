import { useMutation } from '@tanstack/react-query';
import type { LinkSourceAccountRequest, SourceAuthFamily } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import useInvalidateSourceAccess from './useInvalidateSourceAccess';

type Variables = LinkSourceAccountRequest & { family: SourceAuthFamily };

function useLinkSourceAccount() {
  const invalidateSourceAccess = useInvalidateSourceAccess();

  return useMutation({
    // Форма показывает ошибку под полем пароля.
    meta: SILENT_ERROR_META,
    mutationFn: ({ family, ...body }: Variables) =>
      apiFetch(`/source-accounts/${family}/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: invalidateSourceAccess,
  });
}

export default useLinkSourceAccount;
