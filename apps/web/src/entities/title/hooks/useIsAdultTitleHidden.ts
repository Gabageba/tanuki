import {
  CONTENT_RATING,
  DEFAULT_HIDE_ADULT_TITLES,
  SOURCE_CATALOG,
  type CatalogEntry,
  type Title,
} from '@tanuki/contracts';
import useUserSettings from '@/shared/hooks/useUserSettings';

/**
 * Скрыт ли тайтл 18+ настройкой hideAdultTitles: обложка размывается, а его страницу сервер не
 * отдаёт. Настройка касается только обычных источников — в источнике с меткой 18+ взрослое всё,
 * и его показ решает showAdultSources.
 */
function useIsAdultTitleHidden(title: Pick<Title, 'contentRating' | 'sourceId'>) {
  const { data: settings } = useUserSettings();

  if (title.contentRating !== CONTENT_RATING.ADULT) return false;
  const source = (SOURCE_CATALOG as Record<string, CatalogEntry | undefined>)[title.sourceId];
  if (source?.isAdult) return false;
  return settings?.hideAdultTitles ?? DEFAULT_HIDE_ADULT_TITLES;
}

export default useIsAdultTitleHidden;
