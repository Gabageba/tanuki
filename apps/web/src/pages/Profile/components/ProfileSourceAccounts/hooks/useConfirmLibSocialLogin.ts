import { useMutation } from '@tanstack/react-query';
import type { ConfirmLibSocialLoginRequest, LibSocialLoginStep } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import useInvalidateSourceAccess from './useInvalidateSourceAccess';

function useConfirmLibSocialLogin() {
  const invalidateSourceAccess = useInvalidateSourceAccess();

  return useMutation({
    // Шаг кода показывает ошибку под полем.
    meta: SILENT_ERROR_META,
    mutationFn: (body: ConfirmLibSocialLoginRequest) =>
      apiFetch<LibSocialLoginStep>('/source-accounts/libsocial/login/code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: (step) => (step.pendingSourceId ? undefined : invalidateSourceAccess()),
  });
}

export default useConfirmLibSocialLogin;
