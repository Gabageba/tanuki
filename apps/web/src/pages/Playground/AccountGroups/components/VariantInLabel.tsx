import { Badge, Group, Text } from '@mantine/core';
import { getStateColor } from '../lib';
import { ACCOUNT_STATE, DEMO_LOGIN, DEMO_SOURCES, type VariantProps } from '../models';
import AccountAction from './AccountAction';
import DemoGroup from './DemoGroup';
import DemoSourceRow from './DemoSourceRow';

/**
 * H4 — отдельной строки-шапки нет: аккаунт встаёт в подпись группы справа, как её свойство. В
 * рамке остаются только источники, поэтому путать шапку со строкой нечего.
 */
function VariantInLabel({ state }: VariantProps) {
  return (
    <DemoGroup
      labelAside={
        <Group gap="xs" wrap="nowrap" miw={0}>
          {state === ACCOUNT_STATE.NONE ? (
            <Text fz={12} c="dimmed" truncate>
              Один вход на все ниже
            </Text>
          ) : (
            <Badge
              variant="dot"
              color={getStateColor(state)}
              tt="none"
              ff="monospace"
              size="lg"
              miw={0}
            >
              {DEMO_LOGIN}
            </Badge>
          )}
          <AccountAction state={state} size="xs" />
        </Group>
      }
    >
      {DEMO_SOURCES.map((source) => (
        <DemoSourceRow key={source.id} source={source} />
      ))}
    </DemoGroup>
  );
}

export default VariantInLabel;
