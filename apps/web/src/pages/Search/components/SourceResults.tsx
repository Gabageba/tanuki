import { Box, Collapse, Group, Stack, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';
import { VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import SourceTitle from '@/entities/source/components/SourceTitle';
import { getSourceSectionId } from '../lib';
import type { FoundGroup } from '../models';
import AllResultsLink from './AllResultsLink';
import ResultsListPreview from './ResultsListPreview';
import TitleCardsScroller from '@/entities/title/card/TitleCardsScroller';
import UnappliedFiltersNote from './UnappliedFiltersNote';
import styles from '../Search.module.scss';

type Props = {
  group: FoundGroup;
  query: string;
  viewMode: ViewMode;
  isCollapsed: boolean;
  onToggle: () => void;
  getBookmarkFolder: (titleId: string) => ResolvedBookmarkFolder | null;
};

/**
 * Секция источника: название и «Все результаты» в одной строке, под ними — его карточки. Нажатие
 * на название сворачивает карточки; «Все результаты» остаются на виду.
 */
function SourceResults({
  group: { source, items, unappliedFilters, filters },
  query,
  viewMode,
  isCollapsed,
  onToggle,
  getBookmarkFolder,
}: Props) {
  return (
    <Stack id={getSourceSectionId(source.id)} className={styles.section} gap="sm">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <UnstyledButton onClick={onToggle} aria-expanded={!isCollapsed} miw={0}>
          <Group gap="xs" wrap="nowrap">
            {isCollapsed ? <CaretRightIcon /> : <CaretDownIcon />}
            <Box miw={0}>
              <SourceTitle source={source} />
            </Box>
          </Group>
        </UnstyledButton>
        <AllResultsLink sourceId={source.id} query={query} filters={filters} />
      </Group>
      <Collapse expanded={!isCollapsed}>
        <Stack gap="xs">
          <UnappliedFiltersNote filters={unappliedFilters} />
          {viewMode === VIEW_MODE.LIST ? (
            <ResultsListPreview items={items} getBookmarkFolder={getBookmarkFolder} />
          ) : (
            <TitleCardsScroller items={items} getBookmarkFolder={getBookmarkFolder} />
          )}
        </Stack>
      </Collapse>
    </Stack>
  );
}

export default SourceResults;
