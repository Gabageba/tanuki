import { useMutation } from '@tanstack/react-query';
import type { SourceAuthFamily } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import useInvalidateSourceAccess from './useInvalidateSourceAccess';

function useUnlinkSourceAccount() {
  const invalidateSourceAccess = useInvalidateSourceAccess();

  return useMutation({
    mutationFn: (family: SourceAuthFamily) =>
      apiFetch(`/source-accounts/${family}`, { method: 'DELETE' }),
    onSuccess: invalidateSourceAccess,
  });
}

export default useUnlinkSourceAccount;
