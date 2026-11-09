import { useEffect } from 'react';
import { Box, Group, Stack } from '@mantine/core';
import { useSearchParams } from 'react-router';
import type { SortOrder } from '@tanuki/contracts';
import useSelectionsSources from '@/features/selections/hooks/useSelectionsSources';
import {
  getEnabledSections,
  resolveSelectionsSourceId,
  writeLastSelectionsSource,
} from '@/features/selections/lib';
import {
  SELECTIONS_SECTION_SEARCH_PARAM,
  SELECTIONS_SOURCE_SEARCH_PARAM,
  SELECTIONS_VARIANT_SEARCH_PARAM,
  SELECTIONS_ORDER_SEARCH_PARAM,
} from '@/shared/lib/routes';
import { resolveSectionOrder, resolveSectionVariant, resolveSelectionsSection } from '../lib';
import CatalogButton from './CatalogButton';
import SelectionsEmpty from './SelectionsEmpty';
import SelectionsSource from './SelectionsSource';
import SourcePicker from './SourcePicker';

/**
 * Строка источника (S2 + M1 + H3) и блоки выбранного. Источник — из адреса, иначе последний
 * выбранный, иначе первый; адрес с выключенным или неизвестным источником исправляется на
 * открытый. Блок и его вариант тоже в адресе: возврат со страницы тайтла открывает ту же вкладку.
 */
function SelectionsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sources, settings } = useSelectionsSources();
  const requestedId = searchParams.get(SELECTIONS_SOURCE_SEARCH_PARAM);
  const activeId = resolveSelectionsSourceId(sources, requestedId);
  const activeSource = sources.find(({ id }) => id === activeId);

  useEffect(() => {
    if (!activeId || !activeSource) return;
    const next =
      activeId === requestedId
        ? new URLSearchParams(searchParams)
        : new URLSearchParams({ [SELECTIONS_SOURCE_SEARCH_PARAM]: activeId });
    const section = resolveSelectionsSection(
      getEnabledSections(activeSource, settings),
      next.get(SELECTIONS_SECTION_SEARCH_PARAM),
    );
    if (section) {
      next.set(SELECTIONS_SECTION_SEARCH_PARAM, section.id);
      const variant = resolveSectionVariant(section, next.get(SELECTIONS_VARIANT_SEARCH_PARAM));
      const order = resolveSectionOrder(section, next.get(SELECTIONS_ORDER_SEARCH_PARAM));
      if (variant) next.set(SELECTIONS_VARIANT_SEARCH_PARAM, variant.id);
      if (order) next.set(SELECTIONS_ORDER_SEARCH_PARAM, order);
    }
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [activeId, activeSource, requestedId, searchParams, settings, setSearchParams]);

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

  const handleOrderChange = (order: SortOrder) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(SELECTIONS_ORDER_SEARCH_PARAM, order);
        return next;
      },
      { replace: true },
    );
  };

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
        requestedOrder={searchParams.get(SELECTIONS_ORDER_SEARCH_PARAM)}
        onOrderChange={handleOrderChange}
        requestedVariant={searchParams.get(SELECTIONS_VARIANT_SEARCH_PARAM)}
        onSectionChange={handleSectionChange}
        onVariantChange={handleVariantChange}
      />
    </Stack>
  );
}

export default SelectionsContent;
