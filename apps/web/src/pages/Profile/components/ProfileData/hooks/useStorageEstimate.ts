import { useQuery } from '@tanstack/react-query';

/** null — браузер не умеет оценивать хранилище (старый Safari), тогда объём просто не показываем. */
function useStorageEstimate() {
  return useQuery({
    queryKey: ['storageEstimate'],
    queryFn: async () => {
      if (!navigator.storage?.estimate) return null;
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      return { usage, quota };
    },
  });
}

export default useStorageEstimate;
