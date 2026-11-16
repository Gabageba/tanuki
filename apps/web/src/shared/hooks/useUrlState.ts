import { useSearchParams } from 'react-router';
import { updateSearchParams, type SearchParamValues } from '@/shared/lib/searchParams';

/** URL — источник состояния списка. Префикс разделяет независимые списки на одной странице. */
function useUrlState<Params extends SearchParamValues>(
  read: (params: URLSearchParams) => Params,
  prefix = '',
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const scoped = new URLSearchParams();
  for (const [key, value] of searchParams) {
    if (key.startsWith(prefix)) scoped.append(key.slice(prefix.length), value);
  }

  // Выбор и URL обновляются до следующего ввода или клика по другой папке.
  const setParams = (patch: Partial<Params>) => {
    setSearchParams((current) => updateSearchParams(current, patch, prefix), {
      replace: true,
      flushSync: true,
    });
  };

  return { params: read(scoped), setParams };
}

export default useUrlState;
