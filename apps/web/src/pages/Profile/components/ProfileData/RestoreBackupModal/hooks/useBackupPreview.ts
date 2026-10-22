import { useMutation } from '@tanstack/react-query';
import type { Backup, BackupPreview } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

/** Сводка по файлу: сервер считает, что куда ляжет, и ничего не пишет. */
function useBackupPreview() {
  return useMutation({
    mutationFn: (backup: Backup) =>
      apiFetch<BackupPreview>('/backup/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ backup }),
      }),
  });
}

export default useBackupPreview;
