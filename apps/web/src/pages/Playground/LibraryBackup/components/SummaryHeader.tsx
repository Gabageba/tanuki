import { Group, Paper, Stack, Text } from '@mantine/core';
import { FileIcon } from '@phosphor-icons/react';
import { formatBackupOwner } from '../lib';
import { HEADER_VIEW, type BackupPreview, type HeaderView } from '../models';
import OtherFileButton from './OtherFileButton';

type Props = {
  view: HeaderView;
  preview: BackupPreview;
  /** T2: назад ведёт стрелка в заголовке, своя кнопка не нужна. */
  withBack: boolean;
};

const WRAP_ANYWHERE = { overflowWrap: 'anywhere' } as const;

/** H — чья копия и откуда. H3 выносит дату в заголовок модалки, здесь остаются логин и адрес. */
function SummaryHeader({ view, preview, withBack }: Props) {
  const { username, exportedAt, origin, fileName, fileSize } = preview;

  switch (view) {
    case HEADER_VIEW.PHRASE:
      return (
        <Stack gap={4}>
          <Text fz="sm" style={WRAP_ANYWHERE}>
            {formatBackupOwner(username, exportedAt)}
          </Text>
          <Text c="dimmed" fz={13} ff="monospace" style={WRAP_ANYWHERE}>
            {origin}
          </Text>
          {!withBack && <OtherFileButton />}
        </Stack>
      );
    case HEADER_VIEW.CARD:
      return (
        <Paper withBorder radius="md" p="sm">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <FileIcon size={24} color="var(--mantine-color-dimmed)" style={{ flex: 'none' }} />
            <Stack gap={2} flex={1} miw={0}>
              <Text fz="sm" ff="monospace" style={WRAP_ANYWHERE}>
                {fileName}
              </Text>
              <Text fz={12} c="dimmed" style={WRAP_ANYWHERE}>
                {username} · {exportedAt}
              </Text>
              <Text fz={12} c="dimmed" ff="monospace" style={WRAP_ANYWHERE}>
                {origin} · {fileSize}
              </Text>
              {!withBack && <OtherFileButton />}
            </Stack>
          </Group>
        </Paper>
      );
    case HEADER_VIEW.TITLE:
      return (
        <Stack gap={4}>
          <Text c="dimmed" fz={13} style={WRAP_ANYWHERE}>
            {username} ·{' '}
            <Text span ff="monospace" fz={13}>
              {origin}
            </Text>
          </Text>
          {!withBack && <OtherFileButton />}
        </Stack>
      );
  }
}

export default SummaryHeader;
