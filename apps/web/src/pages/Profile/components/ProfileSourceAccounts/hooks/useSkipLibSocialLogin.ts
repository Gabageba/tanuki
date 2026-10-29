import { useMutation } from '@tanstack/react-query';
import type { LibSocialLoginStep } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import useInvalidateSourceAccess from './useInvalidateSourceAccess';

function useSkipLibSocialLogin() {
  const invalidateSourceAccess = useInvalidateSourceAccess();

  return useMutation({
    // Шаг кода показывает ошибку под полем.
    meta: SILENT_ERROR_META,
    mutationFn: () =>
      apiFetch<LibSocialLoginStep>('/source-accounts/libsocial/login/skip', { method: 'POST' }),
    onSuccess: (step) => (step.pendingSourceId ? undefined : invalidateSourceAccess()),
  });
}

export default useSkipLibSocialLogin;
