import { Group, Stack, Switch, Text, ThemeIcon } from '@mantine/core';
import { BellRingingIcon, BellSlashIcon } from '@phosphor-icons/react';
import { getDeviceDescription, getIsDeviceDisabled } from '../lib';
import { DEVICE_STATE, type DeviceState } from '../models';

type Props = {
  state: DeviceState;
};

/** Блок «Это устройство»: тумблер push и пояснение по состоянию. */
function SettingsDeviceBlock({ state }: Props) {
  const isOn = state === DEVICE_STATE.ON;

  return (
    <Group wrap="nowrap" align="center" gap="sm" justify="space-between">
      <Group wrap="nowrap" align="flex-start" gap="sm" flex={1} miw={0}>
        <ThemeIcon
          variant="muted"
          color={isOn ? undefined : 'gray'}
          size={36}
          radius="xl"
          flex="none"
        >
          {isOn ? <BellRingingIcon size={20} /> : <BellSlashIcon size={20} />}
        </ThemeIcon>
        <Stack gap={2} flex={1} miw={0}>
          <Text fz="sm" fw={500}>
            Push-уведомления на этом устройстве
          </Text>
          <Text fz={12} c="dimmed">
            {getDeviceDescription(state)}
          </Text>
        </Stack>
      </Group>
      <Switch
        key={state}
        defaultChecked={isOn}
        disabled={getIsDeviceDisabled(state)}
        aria-label="Push-уведомления на этом устройстве"
      />
    </Group>
  );
}

export default SettingsDeviceBlock;
