import { useEffect } from 'react';
import { Box, Group, Stack } from '@mantine/core';
import { useSearchParams } from 'react-router';
import useSelectionsSources from '@/features/selections/hooks/useSelectionsSources';
import { resolveSelectionsSourceId, writeLastSelectionsSource } from '@/features/selections/lib';
import {
  SELECTIONS_SECTION_SEARCH_PARAM,
  SELECTIONS_SOURCE_SEARCH_PARAM,
  SELECTIONS_VARIANT_SEARCH_PARAM,
} from '@/shared/lib/routes';
import CatalogButton from './CatalogButton';
import SelectionsEmpty from './SelectionsEmpty';
import SelectionsSkeleton from './SelectionsSkeleton';
import SelectionsSource from './SelectionsSource';
import SourcePicker from './SourcePicker';

/**
 * Строка источника (S2 + M1 + H3) и блоки выбранного. Источник — из адреса, иначе последний
 * выбранный, иначе первый; адрес с выключенным или неизвестным источником исправляется на
 * открытый. Блок и его вариант тоже в адресе: возврат со страницы тайтла открывает ту же вкладку.
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
    // Вариант при переходе между блоками не сбрасываем: период общий у вкладок «Сейчас читают»,
    // а блоку, у которого такого варианта нет, достанется его первый.
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

  const handleVariantChange = (variant: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(SELECTIONS_VARIANT_SEARCH_PARAM, variant);
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
        requestedVariant={searchParams.get(SELECTIONS_VARIANT_SEARCH_PARAM)}
        onSectionChange={handleSectionChange}
        onVariantChange={handleVariantChange}
      />
    </Stack>
  );
}

export default SelectionsContent;
