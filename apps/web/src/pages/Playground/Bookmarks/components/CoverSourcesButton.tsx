import { Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, StackSimpleIcon } from '@phosphor-icons/react';
import type { SourceId } from '@tanuki/contracts';
import { stopCardClick } from '../lib';
import SourcesMenuItems from './SourcesMenuItems';
import styles from '../Bookmarks.module.scss';

type Props = {
  sourceIds: SourceId[];
  /** В списке обложка маленькая: плашка мельче. */
  compact?: boolean;
};

/** Q3 — плашка «+N» в левом нижнем углу обложки: крупная цель, мета-строка не меняется. */
function CoverSourcesButton({ sourceIds, compact = false }: Props) {
  const othersCount = sourceIds.length - 1;

  if (othersCount < 1) return null;

  const offset = compact ? 4 : 6;

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <UnstyledButton
          pos="absolute"
          bottom={offset}
          left={offset}
          h={compact ? 22 : 28}
          px={compact ? 6 : 8}
          bdrs="xl"
          c="white"
          aria-label="Другие источники"
          onClick={stopCardClick}
          className={`${styles.overCover} ${styles.coverPlate}`}
        >
          <Group gap={4} wrap="nowrap">
            <StackSimpleIcon size={compact ? 12 : 14} />
            <Text span fz="xs" ff="monospace" c="white">
              +{othersCount}
            </Text>
            <CaretDownIcon size={10} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <SourcesMenuItems sourceIds={sourceIds} />
      </Menu.Dropdown>
    </Menu>
  );
}

export default CoverSourcesButton;
