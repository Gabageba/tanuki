import { Badge, Group, Text } from '@mantine/core';
import { UserCircleIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getStateColor, getStateLabel } from '../lib';
import { ACCOUNT_STATE, DEMO_LOGIN, DEMO_SOURCES, type VariantProps } from '../models';
import AccountAction from './AccountAction';
import DemoSourceRow from './DemoSourceRow';

/** H0 — как сейчас на экране настроек. */
function VariantCurrent({ state }: VariantProps) {
  return (
    <GroupedList label="Grouple">
      <GroupedList.Header
        icon={<UserCircleIcon />}
        title="Один аккаунт для всех источников ниже"
        description={
          state === ACCOUNT_STATE.NONE ? (
            <Text fz="sm" c="dimmed">
              Не привязан
            </Text>
          ) : (
            <Group gap="xs" wrap="nowrap">
              <Badge variant="light" color={getStateColor(state)} flex="none">
                {getStateLabel(state)}
              </Badge>
              <Text fz="sm" c="dimmed" ff="monospace" truncate>
                {DEMO_LOGIN}
              </Text>
            </Group>
          )
        }
        action={<AccountAction state={state} />}
      />
      {DEMO_SOURCES.map((source) => (
        <DemoSourceRow key={source.id} source={source} />
      ))}
    </GroupedList>
  );
}

export default VariantCurrent;
