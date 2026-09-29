import { Box, Group, Text } from '@mantine/core';
import { UserCircleIcon } from '@phosphor-icons/react';
import { getStateColor, getStateLabel } from '../lib';
import { ACCOUNT_STATE, DEMO_LOGIN, DEMO_SOURCES, type VariantProps } from '../models';
import AccountAction from './AccountAction';
import DemoGroup from './DemoGroup';
import DemoSourceRow from './DemoSourceRow';
import HeaderLayout from './HeaderLayout';

/** H1 — шапка на подложке, в заголовке сам аккаунт, пояснение про «все ниже» уходит вторым рядом. */
function VariantAccountTitle({ state }: VariantProps) {
  const isLinked = state !== ACCOUNT_STATE.NONE;

  return (
    <DemoGroup>
      <HeaderLayout
        bg="var(--mantine-color-default-hover)"
        icon={
          <Box c="dimmed" fz={24} lh={0}>
            <UserCircleIcon />
          </Box>
        }
        title={
          isLinked ? (
            <Text fw={600} lh={1} ff="monospace" truncate>
              {DEMO_LOGIN}
            </Text>
          ) : (
            <Text fw={600} lh={1}>
              Аккаунт не привязан
            </Text>
          )
        }
        description={
          <Group gap={6} wrap="nowrap">
            {isLinked && (
              <>
                <Box
                  w={8}
                  h={8}
                  flex="none"
                  bg={`var(--mantine-color-${getStateColor(state)}-filled)`}
                  style={{ borderRadius: '50%' }}
                />
                <Text fz={12} c={`${getStateColor(state)}.6`} lh={1}>
                  {getStateLabel(state)}
                </Text>
                <Text fz={12} c="dimmed" lh={1}>
                  ·
                </Text>
              </>
            )}
            <Text fz={12} c="dimmed" lh={1} truncate>
              Один вход для {DEMO_SOURCES.length} источников ниже
            </Text>
          </Group>
        }
        action={<AccountAction state={state} />}
      />
      {DEMO_SOURCES.map((source) => (
        <DemoSourceRow key={source.id} source={source} />
      ))}
    </DemoGroup>
  );
}

export default VariantAccountTitle;
