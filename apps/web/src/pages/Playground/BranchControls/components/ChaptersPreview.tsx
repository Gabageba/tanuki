import type { ReactNode } from 'react';
import { Box, Card } from '@mantine/core';
import {
  CHAPTER_NUMBERING,
  SORT_DIRECTION,
  type Branch,
  type SortDirection,
} from '@tanuki/contracts';
import ChaptersList from '@/shared/ui/ChaptersList';
import { buildChapters } from '../lib';

type Props = {
  branch: Branch;
  direction: SortDirection;
  /** Шапка внутри карточки — над первой главой, отделена линией. */
  header?: ReactNode;
};

/** Начало списка глав выбранной ветки — та же карточка, что на странице тайтла. */
function ChaptersPreview({ branch, direction, header }: Props) {
  const chapters = buildChapters(branch);

  return (
    <Card withBorder p={0} bg="transparent">
      {header && (
        <Box
          px="sm"
          py="xs"
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          {header}
        </Box>
      )}
      <ChaptersList
        chapters={direction === SORT_DIRECTION.ASC ? [...chapters].reverse() : chapters}
        numbering={CHAPTER_NUMBERING.GLOBAL}
        titleId="demo"
        mah={260}
        showDate
        direction={direction}
      />
    </Card>
  );
}

export default ChaptersPreview;
