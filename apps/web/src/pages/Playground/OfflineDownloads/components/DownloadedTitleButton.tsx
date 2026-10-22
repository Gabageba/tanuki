import { Group, UnstyledButton } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { MockDownloadedTitle } from '../models';
import DownloadedTitleHeading from './DownloadedTitleHeading';
import styles from '../OfflineDownloads.module.scss';

type Props = {
  title: MockDownloadedTitle;
  isSelected?: boolean;
  onClick: () => void;
};

/** L3 — тайтл в левой колонке (на телефоне — строка списка со стрелкой на вложенный экран). */
function DownloadedTitleButton({ title, isSelected = false, onClick }: Props) {
  return (
    <UnstyledButton
      p="xs"
      className={styles.row}
      bg={isSelected ? 'var(--mantine-color-default-hover)' : undefined}
      onClick={onClick}
    >
      <Group gap="xs" wrap="nowrap">
        <DownloadedTitleHeading title={title} />
        <CaretRightIcon size={14} color="var(--mantine-color-dimmed)" />
      </Group>
    </UnstyledButton>
  );
}

export default DownloadedTitleButton;
