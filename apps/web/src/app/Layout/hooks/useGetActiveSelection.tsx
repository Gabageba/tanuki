import { useLocation, useParams } from 'react-router';
import { SelectionIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { flattenSources } from '@/entities/source/lib';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { ACTIVE_SELECTION_KINDS, type ActiveSelection } from '../models';
import type { SourcesResponse } from '@tanuki/contracts';
import AllElementsIcon from '../components/AllElementsIcon';

function useGetActiveSelection(sources?: SourcesResponse): ActiveSelection {
  // На /catalog/:sourceId источник приходит напрямую, а на /title/:titleId — только внутри
  // составного id тайтла («sourceId:opaqueId»), так что при его отсутствии достаём префикс сами.
  const { t } = useTranslation();
  const { sourceId, titleId } = useParams<{ sourceId?: string; titleId?: string }>();
  const { pathname } = useLocation();

  const activeSourceId = sourceId ?? titleId?.slice(0, titleId.indexOf(':'));
  const source = activeSourceId
    ? flattenSources(sources).find((item) => item.id === activeSourceId)
    : undefined;

  if (source) {
    return {
      kind: ACTIVE_SELECTION_KINDS.SOURCE,
      icon: <SourceIcon id={source.id} title={source.title} size={20} bdrs="sm" />,
      title: source.title,
      sourceId: source.id,
    };
  }

  if (pathname === ROUTE_PATHS.SOURCES) {
    return {
      kind: ACTIVE_SELECTION_KINDS.ALL,
      icon: <AllElementsIcon />,
      title: t('allSources'),
    };
  }

  return {
    kind: ACTIVE_SELECTION_KINDS.NONE,
    icon: <SelectionIcon size={20} />,
    title: t('withoutSource'),
  };
}

export default useGetActiveSelection;
