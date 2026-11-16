import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { getListPath, rememberListLocation } from '@/shared/lib/listNavigation';

function useListNavigation() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    rememberListLocation(pathname, search);
  }, [pathname, search]);

  // Текущий адрес читается сразу, до эффекта, чтобы клик по активному пункту сохранял выбор.
  return (path: string) => (path === pathname ? `${path}${search}` : getListPath(path));
}

export default useListNavigation;
