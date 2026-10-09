import { Stack, Switch, Text } from '@mantine/core';
import { BellRingingIcon, BellSlashIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import {
  getCategoryDescription,
  getCategoryIcon,
  getCategoryLabel,
  getDeviceDescription,
  getIsDeviceDisabled,
  getVisibleCategories,
} from '../lib';
import { DEVICE_STATE, type DeviceState, type MockRole } from '../models';

type Props = {
  role: MockRole;
  deviceState: DeviceState;
};

/** Итоговая вкладка «Уведомления»: один стандартный блок настроек (`GroupedList`), как «Общие» —
 *  тумблер устройства первой строкой, тумблеры категорий ниже. */
function SettingsGroupedLayout({ role, deviceState }: Props) {
  const isOn = deviceState === DEVICE_STATE.ON;

  return (
    <Stack gap="xs" maw={640}>
      <GroupedList label="Push-уведомления">
        <GroupedList.Row
          icon={isOn ? <BellRingingIcon /> : <BellSlashIcon />}
          title="На этом устройстве"
          description={getDeviceDescription(deviceState)}
          isActionCompact
          action={
            <Switch
              key={deviceState}
              defaultChecked={isOn}
              disabled={getIsDeviceDisabled(deviceState)}
              aria-label="Push-уведомления на этом устройстве"
            />
          }
        />
        {getVisibleCategories(role).map((category) => (
          <GroupedList.Row
            key={category}
            icon={getCategoryIcon(category, 24)}
            title={getCategoryLabel(category)}
            description={getCategoryDescription(category, role)}
            isActionCompact
            action={<Switch defaultChecked aria-label={getCategoryLabel(category)} />}
          />
        ))}
      </GroupedList>
      <Text fz={12} c="dimmed">
        Тумблер устройства действует только здесь, категории — на все ваши устройства. В ленте
        уведомления остаются при любых настройках.
      </Text>
    </Stack>
  );
}

export default SettingsGroupedLayout;
