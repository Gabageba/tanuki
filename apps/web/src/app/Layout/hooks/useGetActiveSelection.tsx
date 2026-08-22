import { useLocation, useParams } from 'react-router';
import { SelectionIcon } from '@phosphor-icons/react';
import { flattenSources } from '@/entities/source/lib';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import { ACTIVE_SELECTION_KINDS, type ActiveSelection } from '../models';
import type { SourcesResponse } from '@tanuki/contracts';
import AllElementsIcon from '../components/AllElementsIcon';

function useGetActiveSelection(sources?: SourcesResponse): ActiveSelection {
  const { sourceId } = useParams<{ sourceId?: string }>();
  const { pathname } = useLocation();

  const source = sourceId
    ? flattenSources(sources).find((item) => item.id === sourceId)
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
      title: 'Все источники',
    };
  }

  return {
    kind: ACTIVE_SELECTION_KINDS.NONE,
    icon: <SelectionIcon size={20} />,
    title: 'Без источника',
  };
}

export default useGetActiveSelection;
