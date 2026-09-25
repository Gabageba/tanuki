import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CurrentUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

/** Картинка уходит сырым телом со своим Content-Type — сервер сам ужмёт её до webp. */
function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (image: Blob) =>
      apiFetch<CurrentUser>('/users/me/avatar', {
        method: 'PUT',
        headers: { 'content-type': image.type },
        body: image,
      }),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
  });
}

export default useUpdateAvatar;
