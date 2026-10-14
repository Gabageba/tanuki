import { ActionIcon, Group, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getChapterNumberLabel, getReaderPath } from '@/entities/title/readingProgress';
import { formatSize } from '@/shared/lib/formatSize';
import Mdash from '@/shared/ui/Mdash';
import type { DownloadedChapter } from '../models';
import styles from '../Downloads.module.scss';

type Props = {
  item: DownloadedChapter;
  onDelete: () => void;
};

/** Скачанная глава: клик открывает читалку, корзина удаляет без модалки — перекачать легко. */
function DownloadedChapterRow({ item, onDelete }: Props) {
  const { t, i18n } = useTranslation();
  const { row, chapter, isMissingAtSource } = item;

  return (
    <Group gap="xs" wrap="nowrap" pr={4}>
      <UnstyledButton
        component={Link}
        to={getReaderPath(row.titleId, row.chapterId)}
        flex={1}
        miw={0}
        px="sm"
        py={6}
        className={styles.row}
      >
        <Group gap="xs" wrap="nowrap">
          <Text fz="sm" flex="none">
            {chapter && chapter.chapter.number !== null ? (
              getChapterNumberLabel(chapter.chapter, chapter.numbering, t)
            ) : (
              <Mdash />
            )}
          </Text>
          <Text fz="sm" c="dimmed" truncate="end" flex={1} miw={0}>
            {isMissingAtSource ? t('noLongerAtSource') : chapter?.chapter.title}
          </Text>
          <Text fz="xs" c="dimmed" ff="monospace" flex="none">
            {formatSize(row.bytes, t, i18n.language)}
          </Text>
        </Group>
      </UnstyledButton>
      <Tooltip label={t('deleteDownloadedChapter')}>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label={t('deleteDownloadedChapter')}
          onClick={onDelete}
        >
          <TrashIcon />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

export default DownloadedChapterRow;
