import { ActionIcon, Group, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { formatChapterNumber, formatSize } from '../lib';
import type { MockChapter } from '../models';
import styles from '../OfflineDownloads.module.scss';

type Props = {
  chapter: MockChapter;
  onDelete: () => void;
};

/** Скачанная глава: клик открывает читалку, корзина удаляет без модалки — перекачать легко. */
function DownloadedChapterRow({ chapter, onDelete }: Props) {
  return (
    <Group gap="xs" wrap="nowrap" pr={4}>
      <UnstyledButton
        component={Link}
        to="#"
        flex={1}
        miw={0}
        px="sm"
        py={6}
        className={styles.row}
      >
        <Group gap="xs" wrap="nowrap">
          <Text fz="sm" flex="none">
            {formatChapterNumber(chapter)}
          </Text>
          <Text fz="sm" c="dimmed" truncate="end" flex={1} miw={0}>
            {chapter.isMissingAtSource ? 'Больше нет у источника' : chapter.title}
          </Text>
          <Text fz={12} c="dimmed" ff="monospace" flex="none">
            {formatSize(chapter.sizeMb)}
          </Text>
        </Group>
      </UnstyledButton>
      <Tooltip label="Удалить скачанную главу">
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={onDelete}>
          <TrashIcon />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

export default DownloadedChapterRow;
