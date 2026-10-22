import { useQuery } from '@tanstack/react-query';

/**
 * Занятое и доступное место в хранилище браузера и защищено ли оно от очистки (`persist()`).
 * null — браузер не умеет оценивать хранилище (старый Safari), тогда объём просто не показываем.
 */
function useStorageEstimate() {
  return useQuery({
    queryKey: ['storageEstimate'],
    queryFn: async () => {
      if (!navigator.storage?.estimate) return null;
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const isPersisted = (await navigator.storage.persisted?.()) ?? false;
      return { usage, quota, free: Math.max(0, quota - usage), isPersisted };
    },
  });
}

export default useStorageEstimate;
