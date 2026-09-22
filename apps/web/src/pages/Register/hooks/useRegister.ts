import { useMutation } from '@tanstack/react-query';
import type { RegisterRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

function useRegister() {
  return useMutation({
    mutationFn: (body: RegisterRequest) =>
      apiFetch<void>('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
  });
}

export default useRegister;
