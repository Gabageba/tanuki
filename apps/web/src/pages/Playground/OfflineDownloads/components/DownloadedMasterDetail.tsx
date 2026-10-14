import { use, useState } from 'react';
import { Divider, Group, Paper, Stack, Text } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { PHONE_FRAME_CONTEXT } from '../../Notifications/models';
import { DOWNLOADED_TITLES } from '../mocks';
import DownloadedChapters from './DownloadedChapters';
import DownloadedTitleButton from './DownloadedTitleButton';
import DownloadedTitleMenu from './DownloadedTitleMenu';

/** L3 — на десктопе тайтлы слева, главы выбранного справа; на телефоне — вложенный экран. */
function DownloadedMasterDetail() {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const [selectedId, setSelectedId] = useState<string | null>(
    isPhone ? null : (DOWNLOADED_TITLES[0]?.id ?? null),
  );
  const selected = DOWNLOADED_TITLES.find((title) => title.id === selectedId);

  const list = (
    <Stack gap={2}>
      {DOWNLOADED_TITLES.map((title) => (
        <DownloadedTitleButton
          key={title.id}
          title={title}
          isSelected={!isPhone && title.id === selectedId}
          onClick={() => setSelectedId(title.id)}
        />
      ))}
    </Stack>
  );

  const detail = selected && (
    <Stack gap="xs" miw={0}>
      <Group gap="xs" wrap="nowrap">
        {isPhone && <GoBackButton onClick={() => setSelectedId(null)} />}
        <Text fw={600} truncate="end" flex={1}>
          {selected.name}
        </Text>
        <DownloadedTitleMenu title={selected} />
      </Group>
      <DownloadedChapters key={selected.id} chapters={selected.chapters} />
    </Stack>
  );

  if (isPhone) {
    return detail || list;
  }

  return (
    <Paper withBorder radius="md" p="xs">
      <Group align="stretch" wrap="nowrap" gap="xs">
        <Stack w={300} flex="none">
          {list}
        </Stack>
        <Divider orientation="vertical" />
        <Stack flex={1} miw={0} p="xs">
          {detail}
        </Stack>
      </Group>
    </Paper>
  );
}

export default DownloadedMasterDetail;
