import { useMutation } from '@tanstack/react-query';
import type { ChangeEmailRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';

/** Только отправляет код на новую почту — сама почта меняется в useConfirmEmailChange. */
function useChangeEmail() {
  return useMutation({
    // Форма раскладывает ошибку по своим полям — общее уведомление не нужно.
    meta: SILENT_ERROR_META,
    mutationFn: (body: ChangeEmailRequest) =>
      apiFetch('/account/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
  });
}

export default useChangeEmail;
