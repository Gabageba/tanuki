import { useEffect } from 'react';
import { Stack } from '@mantine/core';
import { useSearchParams } from 'react-router';
import useSelectionsSources from '@/features/selections/hooks/useSelectionsSources';
import { resolveSelectionsSourceId, writeLastSelectionsSource } from '@/features/selections/lib';
import { SELECTIONS_SOURCE_SEARCH_PARAM } from '@/shared/lib/routes';
import SelectionsEmpty from './SelectionsEmpty';
import SelectionsSource from './SelectionsSource';
import SourceChips from './SourceChips';
import SourceChipsSkeleton from './SourceChipsSkeleton';

/**
 * Чипы источников и подборки выбранного. Источник — из адреса, иначе последний выбранный, иначе
 * первый; адрес с выключенным или неизвестным источником исправляется на открытый.
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

  const handleChange = (sourceId: string) => {
    writeLastSelectionsSource(sourceId);
    setSearchParams({ [SELECTIONS_SOURCE_SEARCH_PARAM]: sourceId }, { replace: true });
  };

  if (isPending) {
    return <SourceChipsSkeleton />;
  }

  if (!activeId || !activeSource) {
    return <SelectionsEmpty />;
  }

  return (
    <Stack gap="lg">
      <SourceChips sources={sources} activeId={activeId} onChange={handleChange} />
      <SelectionsSource key={activeSource.id} source={activeSource} settings={settings} />
    </Stack>
  );
}

export default SelectionsContent;
