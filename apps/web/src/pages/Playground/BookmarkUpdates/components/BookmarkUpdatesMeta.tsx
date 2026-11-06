import { Box, Group, Indicator, Text } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import ProgressMeta from '../../../Bookmarks/components/ProgressMeta';
import { UPDATE_VARIANT, type UpdateVariant } from '../models';
import BookmarkUpdatesMetaMarker from './BookmarkUpdatesMetaMarker';
import { getUpdatesProgressColor } from '../lib';

type Props = {
  bookmark: BookmarkItem;
  variant: UpdateVariant;
  hasNew: boolean;
};

/** Мета-строка BookmarkCard с локальными вариантами спокойной отметки обновления. */
function BookmarkUpdatesMeta({ bookmark, variant, hasNew }: Props) {
  const othersCount = bookmark.otherSources.length;
  const progress = (
    <TitleMetaItems
      gap={4}
      items={[
        <Box
          key="progress"
          data-card-progress
          component="span"
          c={getUpdatesProgressColor(variant, hasNew)}
        >
          <ProgressMeta bookmark={bookmark} />
        </Box>,
        variant === UPDATE_VARIANT.QUIET_WORD && hasNew && (
          <Text key="new" span inherit c="dimmed" role="img" aria-label="Есть новые главы">
            новое
          </Text>
        ),
      ]}
    />
  );

  return (
    <Group gap={6} miw={0} flex="1 1 auto">
      <Indicator
        label={`+${othersCount}`}
        disabled={othersCount === 0}
        size={16}
        offset={-2}
        color="gray"
        withBorder
        // Как в настоящей карточке: число вписано в фиксированную точку 16 px.
        styles={{ indicator: { fontSize: 9, fontFamily: 'var(--mantine-font-family-monospace)' } }}
      >
        <SourceIcon
          id={bookmark.sourceId}
          title={getCatalogSourceTitle(bookmark.sourceId)}
          size={20}
          radius="sm"
        />
      </Indicator>
      <Box miw={0}>
        {variant === UPDATE_VARIANT.PROGRESS_DOT ||
        variant === UPDATE_VARIANT.QUIET_ICON ||
        variant === UPDATE_VARIANT.ACCENT_ICON ||
        variant === UPDATE_VARIANT.ACCENT_STROKE ? (
          <Group gap={6} wrap="nowrap">
            <BookmarkUpdatesMetaMarker variant={variant} hasNew={hasNew} />
            {progress}
          </Group>
        ) : (
          progress
        )}
      </Box>
    </Group>
  );
}

export default BookmarkUpdatesMeta;
