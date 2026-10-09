import { Paper, Stack, Text } from '@mantine/core';
import { getVisibleCategories } from '../lib';
import type { DeviceState, MockRole } from '../models';
import SettingsCategoryRow from './SettingsCategoryRow';
import SettingsDeviceBlock from './SettingsDeviceBlock';

type Props = {
  role: MockRole;
  deviceState: DeviceState;
};

/** S2: карточка устройства и карточка категорий. */
function SettingsCardsLayout({ role, deviceState }: Props) {
  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Это устройство</Text>
          <SettingsDeviceBlock state={deviceState} />
        </Stack>
      </Paper>
      <Paper withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Push по категориям</Text>
          <Text fz={12} c="dimmed">
            Настройка действует на все ваши устройства. В ленте уведомления остаются при любых
            настройках.
          </Text>
          {getVisibleCategories(role).map((category) => (
            <SettingsCategoryRow key={category} category={category} role={role} />
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default SettingsCardsLayout;
