import { Paper, SimpleGrid, Stack, Text, type SimpleGridProps } from '@mantine/core';
import { VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import type { BookmarkExample, UpdateVariant } from '../models';
import BookmarkUpdatesCard from './BookmarkUpdatesCard';

type Props = {
  examples: BookmarkExample[];
  variant: UpdateVariant;
  viewMode: ViewMode;
  width: number;
  columns: number;
  caption: string;
};

function BookmarkUpdatesFrame({ examples, variant, viewMode, width, columns, caption }: Props) {
  const cards = examples.map((example) => (
    <BookmarkUpdatesCard
      key={example.bookmark.titleId}
      example={example}
      variant={variant}
      viewMode={viewMode}
    />
  ));
  const getColumns = (): SimpleGridProps['cols'] => {
    switch (viewMode) {
      case VIEW_MODE.GRID:
        return { base: 2, '440px': columns };
      case VIEW_MODE.LIST:
        return 1;
    }
  };

  return (
    <Stack gap="xs" w={width} maw="100%">
      <Text fz="xs" c="dimmed">
        {caption}
      </Text>
      <Paper withBorder p="xs" radius="md">
        <SimpleGrid type="container" cols={getColumns()} spacing="sm">
          {cards}
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}

export default BookmarkUpdatesFrame;
