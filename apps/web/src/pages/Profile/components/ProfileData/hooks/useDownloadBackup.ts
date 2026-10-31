import { useMutation } from '@tanstack/react-query';
import type { Backup } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

/** `YYYY-MM-DD` по часам пользователя: ночью дата в UTC была бы ещё вчерашней. */
const toLocalDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Отдаёт браузеру готовый файл: загрузку видно в самом браузере, тост не нужен. */
const saveFile = (backup: Backup) => {
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tanuki-backup-${toLocalDate(backup.exportedAt)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/** Копию собирает сервер — пока он работает, кнопка показывает `Loader`. */
function useDownloadBackup() {
  return useMutation({
    mutationFn: () => apiFetch<Backup>('/backup'),
    onSuccess: saveFile,
  });
}

export default useDownloadBackup;
