import useSources from '@/entities/source/hooks/useSources';
import useUserSettings from '@/shared/hooks/useUserSettings';

/** Запросы страницы для PageLayout: источники подборок зависят и от источников, и от настроек —
 *  скелетон страницы ждёт оба, а без любого из них показать нечего (`requireAll`). */
function useSelectionsQueries() {
  return {
    sources: useSources(),
    settings: useUserSettings(),
  };
}

export default useSelectionsQueries;
