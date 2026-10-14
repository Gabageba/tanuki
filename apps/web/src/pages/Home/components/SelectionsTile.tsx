import { SparkleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { CONTENT_RATING } from '@tanuki/contracts';
import useSelections from '@/features/selections/hooks/useSelections';
import useSelectionsSources from '@/features/selections/hooks/useSelectionsSources';
import { getSkippedSelectionsStatus, resolveSelectionsSourceId } from '@/features/selections/lib';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import CoverFan from './CoverFan';
import EntryTile from './EntryTile';

/**
 * Плитка «Подборки» (V2a) с веером обложек из подборок того источника, что откроется на их
 * странице. Заодно прогревает этот запрос: страница подборок откроется уже с ответом. Пока его
 * нет или источник не ответил — плитка без веера.
 */
function SelectionsTile() {
  const { t } = useTranslation();
  const { sources } = useSelectionsSources();
  const sourceId = resolveSelectionsSourceId(sources, null);
  const source = sources.find(({ id }) => id === sourceId);
  const { data } = useSelections(sourceId, !!source && !getSkippedSelectionsStatus(source));
  // В веер не берём 18+: обложка на плитке не размывается.
  const fan = (data?.sections ?? [])
    .flatMap(({ items }) => items)
    .filter(({ contentRating }) => contentRating !== CONTENT_RATING.ADULT);

  return (
    <EntryTile
      to={ROUTE_PATHS.SELECTIONS}
      icon={<SparkleIcon size={22} />}
      title={t('selections')}
      description={t('newPopularAndUpdatesFromSiteHomePages')}
      visual={<CoverFan titles={fan} />}
    />
  );
}

export default SelectionsTile;
