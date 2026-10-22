import { Badge, Progress, Stack, Text } from '@mantine/core';
import { HardDrivesIcon, ShieldCheckIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import GroupedList from '@/shared/ui/GroupedList';
import { formatSize } from '../lib';
import { SETTINGS_LAYOUT, type SettingsLayout } from '../models';
import AutoDownloadList from './AutoDownloadList';
import DownloadedTotal from './DownloadedTotal';

type Props = {
  layout: SettingsLayout;
};

const OPEN_DOWNLOADS = {
  component: Link,
  to: '#',
  leftSection: <TrayArrowDownIcon />,
  children: 'Открыть загрузки',
};

/** Вкладка настроек «Загрузки» в раскладке оси S; S2a — S2 с полем и полосой на всю ширину. */
function SettingsDownloadsMock({ layout }: Props) {
  if (layout === SETTINGS_LAYOUT.SINGLE) {
    return (
      <AutoDownloadList label="Загрузки">
        <GroupedList.Row
          icon={<HardDrivesIcon />}
          title="Скачано на этом устройстве"
          description={<DownloadedTotal hasDownloads />}
          actionProps={OPEN_DOWNLOADS}
        />
      </AutoDownloadList>
    );
  }

  const isWide = layout === SETTINGS_LAYOUT.SPLIT_WIDE;

  return (
    <Stack gap="xl">
      <AutoDownloadList label="Автоматически" isWide={isWide} />
      <GroupedList label="Хранилище">
        <GroupedList.Row
          icon={<TrayArrowDownIcon />}
          title="Скачано"
          description={<DownloadedTotal hasDownloads />}
          actionProps={OPEN_DOWNLOADS}
        />
        <GroupedList.Row
          icon={<HardDrivesIcon />}
          title="Свободно на устройстве"
          description={
            <Text span fz={12} c="dimmed" ff="monospace">
              {formatSize(3300)} из {formatSize(64000)}
            </Text>
          }
        >
          <Progress value={95} size="sm" maw={isWide ? undefined : 320} />
        </GroupedList.Row>
        <GroupedList.Row
          icon={<ShieldCheckIcon />}
          title="Защита от очистки"
          description="Браузер не удалит скачанное сам, даже когда места мало"
          isActionCompact
          action={
            <Badge variant="muted" color="teal">
              Включена
            </Badge>
          }
        />
      </GroupedList>
    </Stack>
  );
}

export default SettingsDownloadsMock;
