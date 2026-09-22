import { useMutation } from '@tanstack/react-query';
import type { ForgotPasswordRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ForgotPasswordRequest) =>
      apiFetch<void>('/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
  });
}

export default useForgotPassword;
