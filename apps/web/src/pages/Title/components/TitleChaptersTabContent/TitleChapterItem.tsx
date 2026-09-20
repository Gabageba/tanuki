import { ActionIcon, Box, Flex, Group, Stack, Text } from '@mantine/core';
import { CircleIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from '@/shared/lib/isEmpty';
import type { Chapter } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import styles from './TitleChaptersTabContent.module.scss';

type Props = {
  chapter: Chapter;
};

function TitleChapterItem({ chapter }: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();

  const isEmptyNumber = isEmpty(chapter.number);
  const isEmptyTitle = isEmpty(chapter.title);

  return (
    <Group align="stretch">
      <Stack gap={4} align="center" className={styles.chapterTimeline}>
        <Box flex={1} w={2} bg="var(--mantine-color-default-border)" />
        <CircleIcon size={18} weight="bold" color="var(--mantine-color-default-border)" />
        <Box flex={1} w={2} bg="var(--mantine-color-default-border)" />
      </Stack>
      <Flex
        justify="space-between"
        py="xs"
        flex={1}
        wrap="nowrap"
        miw={0}
        gap={{ base: 'xs', xs: 'md' }}
      >
        <Flex flex={1} miw={0} wrap="nowrap" gap={{ base: 'xs', xs: 'md' }} align="center">
          {!isEmptyNumber && (
            <Text flex="none">{t('chapterNumberAbbrev', { number: chapter.number })}</Text>
          )}
          {!isEmptyTitle && (
            <Text flex={1} miw={0} truncate="end">
              {chapter.title}
            </Text>
          )}
          {isEmptyNumber && isEmptyTitle && <Text truncate="end">{t('untitled')}</Text>}
        </Flex>
        <Flex flex="none" wrap="nowrap" gap={{ base: 'xs', xs: 'md' }} align="center">
          <Text c="dimmed" fz={12}>
            {formatDateNumeric(chapter.uploadedAt)}
          </Text>
          <ActionIcon variant="subtle">
            <DownloadSimpleIcon />
          </ActionIcon>
        </Flex>
      </Flex>
    </Group>
  );
}

export default TitleChapterItem;
