import { ActionIcon, Badge, Box, Flex, Group, Stack, Text } from '@mantine/core';
import { CircleIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { NEW_CHAPTER_VARIANT, type MockChapter, type NewChapterVariant } from '../models';
import chapterStyles from '@/shared/ui/ChaptersList/ChapterList.module.scss';
import styles from '../Bookmarks.module.scss';

type Props = {
  chapter: MockChapter;
  /** null — пометки нет, как сейчас. */
  variant: NewChapterVariant | null;
  isFirst: boolean;
  isLast: boolean;
};

/** Строка главы как `ChapterItem` (A2e: линия, узел, своя отметка в кольце) с пометкой новой. */
function NewChapterRow({ chapter, variant, isFirst, isLast }: Props) {
  const isActive = chapter.isRead || chapter.isMarked;
  const newBadge = chapter.isNew && (
    <Badge variant="muted" size="xs" ff="monospace" flex="none">
      NEW
    </Badge>
  );

  const circle = (
    <CircleIcon
      size={18}
      weight={chapter.isMarked ? 'fill' : 'bold'}
      className={chapterStyles.timelineNode}
      data-active={isActive || undefined}
    />
  );

  return (
    <Group align="stretch">
      <Box className={chapterStyles.chapterTimeline}>
        <Stack gap={4} align="center" flex={1}>
          <Box
            className={chapterStyles.timelineLine}
            data-active={(chapter.isRead && !chapter.isMarked) || undefined}
            data-hidden={isFirst || undefined}
          />
          <Box pos="relative" lh={0}>
            {chapter.isMarked ? <Box className={chapterStyles.ownNode}>{circle}</Box> : circle}
            {chapter.isNew && variant === NEW_CHAPTER_VARIANT.NODE_DOT && (
              <Box className={styles.nodeDot} />
            )}
          </Box>
          <Box
            className={chapterStyles.timelineLine}
            data-active={isActive || undefined}
            data-hidden={isLast || undefined}
          />
        </Stack>
      </Box>
      <Flex justify="space-between" py="xs" flex={1} wrap="nowrap" miw={0} gap="xs" pr="xs">
        <Flex flex={1} miw={0} wrap="nowrap" gap="xs" align="center">
          <Text flex="none" ff="monospace">
            Гл.&nbsp;{chapter.number}
          </Text>
          {variant === NEW_CHAPTER_VARIANT.BADGE_NUMBER && newBadge}
          {chapter.title && (
            <Text flex={1} miw={0} truncate="end">
              {chapter.title}
            </Text>
          )}
        </Flex>
        <Flex flex="none" wrap="nowrap" gap="xs" align="center">
          {variant === NEW_CHAPTER_VARIANT.BADGE_RIGHT && newBadge}
          <Text c="dimmed" fz={12} ff="monospace">
            {chapter.date}
          </Text>
          <ActionIcon variant="subtle" aria-label="Скачать">
            <DownloadSimpleIcon />
          </ActionIcon>
        </Flex>
      </Flex>
    </Group>
  );
}

export default NewChapterRow;
