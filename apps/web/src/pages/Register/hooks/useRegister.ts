import { useMutation } from '@tanstack/react-query';
import type { RegisterRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';

function useRegister() {
  return useMutation({
    // Форма раскладывает ошибку по своим полям — общее уведомление не нужно.
    meta: SILENT_ERROR_META,
    mutationFn: (body: RegisterRequest) =>
      apiFetch<void>('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
  });
}

export default useRegister;
