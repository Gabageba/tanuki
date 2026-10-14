import { Button, Group, Text, UnstyledButton } from '@mantine/core';
import { DownloadSimpleIcon, SortDescendingIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { getPlatePhrase, getPlateSize } from '../lib';
import { PLATE_STATE, type PlateState } from '../models';
import PlateStateIcon from './PlateStateIcon';
import styles from '../OfflineDownloads.module.scss';

type Props = {
  /** B4 — плашка в ряду над списком глав. */
  state?: PlateState;
  onDownloadAll?: () => void;
};

/** Ряд над списком глав (`TitleChaptersSettings`): сортировка слева, «Скачать все» справа. */
function ChaptersToolbarMock({ state, onDownloadAll }: Props) {
  return (
    <Group justify="space-between" gap="sm" wrap="nowrap">
      <Button variant="default" size="xs" leftSection={<SortDescendingIcon />}>
        Сначала новые
      </Button>
      <Group gap="xs" wrap="nowrap" miw={0}>
        {state && (
          <UnstyledButton component={Link} to="#" px={6} py={4} miw={0} className={styles.row}>
            <Group gap={6} wrap="nowrap">
              <PlateStateIcon state={state} size={14} />
              <Text fz={12} c={state === PLATE_STATE.FAILED ? 'red' : 'dimmed'} truncate="end">
                {getPlatePhrase(state)}
                <Text span fz={12} c="dimmed" ff="monospace">
                  {' · '}
                  {getPlateSize(state)}
                </Text>
              </Text>
            </Group>
          </UnstyledButton>
        )}
        <Button size="xs" flex="none" leftSection={<DownloadSimpleIcon />} onClick={onDownloadAll}>
          Скачать все
        </Button>
      </Group>
    </Group>
  );
}

export default ChaptersToolbarMock;
