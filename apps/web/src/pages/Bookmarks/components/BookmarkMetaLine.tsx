import { Box, Group, Indicator, VisuallyHidden } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BOOKMARK_AVAILABILITY, type BookmarkItem } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import ProgressMeta from './ProgressMeta';

type Props = {
  bookmark: BookmarkItem;
};

/** Источник со счётчиком копий и прогресс. Меню рисует TitleCard по массиву actions.
 *  Не влезает прогресс — «Гл. 197 из 203» целиком уходит строкой ниже. */
function BookmarkMetaLine({ bookmark }: Props) {
  const { t } = useTranslation();
  const othersCount = bookmark.otherSources.length;
  const hasNew =
    bookmark.newChaptersCount > 0 &&
    (bookmark.progress?.total ?? bookmark.chaptersCount ?? 0) > 0 &&
    bookmark.availability === BOOKMARK_AVAILABILITY.AVAILABLE;

  return (
    <Group gap={6} miw={0} flex="1 1 auto">
      <Indicator
        label={`+${othersCount}`}
        disabled={othersCount === 0}
        size={16}
        offset={-2}
        color="gray"
        withBorder
        // Счётчик в фиксированной точке — размер шрифта привязан к геометрии, а не к шкале.
        styles={{
          indicator: { fontSize: 9, fontFamily: 'var(--mantine-font-family-monospace)' },
        }}
      >
        <SourceIcon
          id={bookmark.sourceId}
          title={getCatalogSourceTitle(bookmark.sourceId)}
          size={20}
          radius="sm"
        />
      </Indicator>
      <Box miw={0}>
        <TitleMetaItems
          gap={4}
          items={[
            <Box
              key="progress"
              component="span"
              data-card-progress
              c={hasNew ? 'var(--mantine-color-anchor)' : undefined}
            >
              {hasNew && <VisuallyHidden role="img" aria-label={t('hasNewChapters')} />}
              <ProgressMeta bookmark={bookmark} />
            </Box>,
          ]}
        />
      </Box>
    </Group>
  );
}

export default BookmarkMetaLine;
