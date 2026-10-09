import { Divider, Stack, Text } from '@mantine/core';
import { getVisibleCategories } from '../lib';
import type { DeviceState, MockRole } from '../models';
import SettingsCategoryRow from './SettingsCategoryRow';
import SettingsDeviceBlock from './SettingsDeviceBlock';

type Props = {
  role: MockRole;
  deviceState: DeviceState;
};

/** S1: два подзаголовка и плоские строки с разделителями. */
function SettingsRowsLayout({ role, deviceState }: Props) {
  return (
    <Stack gap="md">
      <Text fw={600}>Это устройство</Text>
      <SettingsDeviceBlock state={deviceState} />
      <Divider />
      <Text fw={600}>Push по категориям</Text>
      <Text fz={12} c="dimmed">
        Настройка действует на все ваши устройства. В ленте уведомления остаются при любых
        настройках.
      </Text>
      {getVisibleCategories(role).map((category) => (
        <Stack key={category} gap="md">
          <SettingsCategoryRow category={category} role={role} />
        </Stack>
      ))}
    </Stack>
  );
}

export default SettingsRowsLayout;
