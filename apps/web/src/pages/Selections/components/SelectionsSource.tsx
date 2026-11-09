import { useState } from 'react';
import { Stack } from '@mantine/core';
import {
  SEARCH_GROUP_STATUS,
  type Source,
  type SortOrder,
  type UserSettings,
} from '@tanuki/contracts';
import { getEnabledSections, getSkippedSelectionsStatus } from '@/features/selections/lib';
import {
  getStoredViewMode,
  setStoredViewMode,
  VIEW_MODE,
  type ViewMode,
} from '@/shared/lib/viewMode';
import useSelectionsSection from '../hooks/useSelectionsSection';
import { resolveSectionOrder, resolveSectionVariant, resolveSelectionsSection } from '../lib';
import SectionFeed from './SectionFeed';
import SectionPanel from './SectionPanel';
import SectionTabs from './SectionTabs';
import SourceMissedState from './SourceMissedState';

type Props = {
  source: Source;
  settings: UserSettings | undefined;
  requestedSectionId: string | null;
  requestedVariant: string | null;
  requestedOrder: string | null;
  onOrderChange: (order: SortOrder) => void;
  onSectionChange: (sectionId: string) => void;
  onVariantChange: (variant: string) => void;
};

/**
 * Блоки выбранного источника (R1): вкладки, панель над сеткой и открытый блок. Вкладки строятся
 * из описания блоков и видны сразу; выключенные в настройках блоков среди них нет. Источник не
 * опрашивается — вместо вкладок причина; не ответил на открытый блок — причина на месте ленты,
 * а в другой блок можно уйти.
 */
function SelectionsSource({
  source,
  settings,
  requestedSectionId,
  requestedVariant,
  requestedOrder,
  onOrderChange,
  onSectionChange,
  onVariantChange,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode() ?? VIEW_MODE.GRID);
  const sections = getEnabledSections(source, settings);
  const section = resolveSelectionsSection(sections, requestedSectionId);
  const variant = section && resolveSectionVariant(section, requestedVariant);
  const order = section && resolveSectionOrder(section, requestedOrder);
  const skipped = getSkippedSelectionsStatus(source);
  const query = useSelectionsSection({
    sourceId: source.id,
    sectionId: section?.id ?? '',
    variant: variant?.id,
    order,
    enabled: !skipped && Boolean(section),
  });
  const status = query.data?.pages[0]?.status;

  const handleViewModeChange = (next: ViewMode) => {
    setViewMode(next);
    setStoredViewMode(next);
  };

  if (!section) return null;

  if (skipped) {
    return (
      <SourceMissedState
        source={source}
        status={skipped}
        isRetrying={query.isRefetching}
        onRetry={query.refetch}
      />
    );
  }

  const sectionViewMode = section.viewMode ?? viewMode;

  return (
    <Stack gap="lg">
      <SectionTabs sections={sections} activeId={section.id} onChange={onSectionChange} />
      <SectionPanel
        section={section}
        order={order}
        onOrderChange={onOrderChange}
        variant={variant?.id ?? ''}
        onVariantChange={onVariantChange}
        viewMode={sectionViewMode}
        onViewModeChange={handleViewModeChange}
      />
      {status && status !== SEARCH_GROUP_STATUS.OK ? (
        <SourceMissedState
          source={source}
          status={status}
          isRetrying={query.isRefetching}
          onRetry={query.refetch}
        />
      ) : (
        <SectionFeed key={section.id} query={query} viewMode={sectionViewMode} />
      )}
    </Stack>
  );
}

export default SelectionsSource;
