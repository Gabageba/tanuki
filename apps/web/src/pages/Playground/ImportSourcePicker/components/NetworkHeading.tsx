import { Group, Text } from '@mantine/core';
import { ACCOUNT_STATE } from '../../SourcesSetup/models';
import type { DemoNetwork } from '../models';
import AccountStateMark from './AccountStateMark';
import LoginActionButton from './LoginActionButton';

type Props = {
  network: DemoNetwork;
};

/** Подпись группы: название сети, состояние её аккаунта и, если входа нет, кнопка входа. */
function NetworkHeading({ network }: Props) {
  const isActive = network.state === ACCOUNT_STATE.ACTIVE;

  return (
    <Group justify="space-between" gap="xs" wrap="nowrap" mih={30}>
      <Group gap="xs" wrap="nowrap" miw={0}>
        <Text ff="monospace" tt="uppercase" fz={12} c="dimmed" lts={1} lh={1} flex="none">
          {network.title}
        </Text>
        {isActive ? (
          <Text fz={12} c="dimmed" ff="monospace" lh={1.2} truncate>
            {network.login}
          </Text>
        ) : (
          <AccountStateMark state={network.state} />
        )}
      </Group>
      <LoginActionButton state={network.state} />
    </Group>
  );
}

export default NetworkHeading;
