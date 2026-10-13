import { Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { VIEW_MODE, type BookmarkItem } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import NavigateToTitleCard from '@/entities/title/NavigateToTitleCard';
import TitleCover from '@/entities/title/TitleCover';
import { NEW_CHAPTER_COVER_WIDTH } from '../models';

type Props = {
  bookmark: BookmarkItem;
};

/** Строка «Новых глав»: мини-обложка, название, источник и «+3 гл.» акцентом. Ведёт на тайтл. */
function NewChapterRow({ bookmark }: Props) {
  const { t } = useTranslation();
  const sourceTitle = getCatalogSourceTitle(bookmark.sourceId);

  return (
    <NavigateToTitleCard titleId={bookmark.titleId} viewMode={VIEW_MODE.GRID}>
      <Group gap="sm" wrap="nowrap">
        <TitleCover
          cover={bookmark}
          hiddenIconSize={16}
          w={NEW_CHAPTER_COVER_WIDTH}
          flex="none"
          bdrs="sm"
        />
        <Stack gap={2} miw={0} flex={1}>
          <Text fz="sm" lh="tight" truncate>
            {bookmark.name}
          </Text>
          <Group gap={6} wrap="nowrap">
            <SourceIcon id={bookmark.sourceId} title={sourceTitle} size={14} />
            <Text fz="xs" c="dimmed" truncate>
              {sourceTitle}
            </Text>
          </Group>
        </Stack>
        <Text fz="sm" fw={600} ff="monospace" c="var(--mantine-primary-color-filled)" flex="none">
          {t('plusCountChaptersAbbrev', { count: bookmark.newChaptersCount })}
        </Text>
      </Group>
    </NavigateToTitleCard>
  );
}

export default NewChapterRow;
