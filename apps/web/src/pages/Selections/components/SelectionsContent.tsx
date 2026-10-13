import { useEffect } from 'react';
import { Box, Group, Stack } from '@mantine/core';
import { useSearchParams } from 'react-router';
import type { HomeSectionPeriod } from '@tanuki/contracts';
import useSelectionsSources from '@/features/selections/hooks/useSelectionsSources';
import { resolveSelectionsSourceId, writeLastSelectionsSource } from '@/features/selections/lib';
import {
  SELECTIONS_PERIOD_SEARCH_PARAM,
  SELECTIONS_SECTION_SEARCH_PARAM,
  SELECTIONS_SOURCE_SEARCH_PARAM,
} from '@/shared/lib/routes';
import { parseHomeSectionPeriod } from '../lib';
import CatalogButton from './CatalogButton';
import SelectionsEmpty from './SelectionsEmpty';
import SelectionsSkeleton from './SelectionsSkeleton';
import SelectionsSource from './SelectionsSource';
import SourcePicker from './SourcePicker';

/**
 * Строка источника (S2 + M1 + H3) и блоки выбранного. Источник — из адреса, иначе последний
 * выбранный, иначе первый; адрес с выключенным или неизвестным источником исправляется на
 * открытый. Блок и период тоже в адресе: возврат со страницы тайтла открывает ту же вкладку.
 */
function SelectionsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sources, settings, isPending } = useSelectionsSources();
  const requestedId = searchParams.get(SELECTIONS_SOURCE_SEARCH_PARAM);
  const activeId = resolveSelectionsSourceId(sources, requestedId);
  const activeSource = sources.find(({ id }) => id === activeId);

  useEffect(() => {
    if (isPending || !activeId || activeId === requestedId) return;
    setSearchParams({ [SELECTIONS_SOURCE_SEARCH_PARAM]: activeId }, { replace: true });
  }, [activeId, isPending, requestedId, setSearchParams]);

  const handleSourceChange = (sourceId: string) => {
    writeLastSelectionsSource(sourceId);
    setSearchParams({ [SELECTIONS_SOURCE_SEARCH_PARAM]: sourceId }, { replace: true });
  };

  const handleSectionChange = (sectionId: string) => {
    if (!activeId) return;
    // Период общий для блоков с его выбором — при переходе между ними не сбрасываем.
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(SELECTIONS_SOURCE_SEARCH_PARAM, activeId);
        next.set(SELECTIONS_SECTION_SEARCH_PARAM, sectionId);
        return next;
      },
      { replace: true },
    );
  };

  const handlePeriodChange = (period: HomeSectionPeriod) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(SELECTIONS_PERIOD_SEARCH_PARAM, period);
        return next;
      },
      { replace: true },
    );
  };

  if (isPending) {
    return <SelectionsSkeleton />;
  }

  if (!activeId || !activeSource) {
    return <SelectionsEmpty />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Box flex={1} miw={0}>
          <SourcePicker sources={sources} active={activeSource} onChange={handleSourceChange} />
        </Box>
        <CatalogButton source={activeSource} />
      </Group>
      <SelectionsSource
        key={activeSource.id}
        source={activeSource}
        settings={settings}
        requestedSectionId={searchParams.get(SELECTIONS_SECTION_SEARCH_PARAM)}
        requestedPeriod={parseHomeSectionPeriod(searchParams.get(SELECTIONS_PERIOD_SEARCH_PARAM))}
        onSectionChange={handleSectionChange}
        onPeriodChange={handlePeriodChange}
      />
    </Stack>
  );
}

export default SelectionsContent;
