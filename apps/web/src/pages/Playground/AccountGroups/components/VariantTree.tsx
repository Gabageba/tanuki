import { Box, Group, Paper, Stack, Switch, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getStateColor, getStateLabel } from '../lib';
import {
  ACCOUNT_STATE,
  DEMO_LOGIN,
  DEMO_SOURCES,
  type AccountState,
  type VariantProps,
} from '../models';
import AccountAction from './AccountAction';
import AccountAvatar from './AccountAvatar';
import HeaderLayout from './HeaderLayout';

/** Центр аватара шапки по горизонтали: отступ `md` + половина аватара 32px, минус полширины линии. */
const LINE_X = 31;
const TICK_WIDTH = 20;

const getLineStyle = (state: AccountState) =>
  state === ACCOUNT_STATE.NONE
    ? '2px dashed var(--mantine-color-default-border)'
    : `2px solid var(--mantine-color-${getStateColor(state)}-filled)`;

/**
 * H5 — дерево: от аватара шапки вниз идёт линия и ответвляется к каждому источнику. Что аккаунт
 * один на все, видно из формы, а не из текста; линия пунктирная и серая, пока не вошли, и цветная
 * сплошная — после.
 */
function VariantTree({ state }: VariantProps) {
  const isLinked = state !== ACCOUNT_STATE.NONE;
  const line = getLineStyle(state);

  return (
    <Stack gap="xs">
      <Text ff="monospace" tt="uppercase" fz={12} c="dimmed" lts={1} lh={1}>
        Grouple
      </Text>
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <Box pos="relative">
          <HeaderLayout
            icon={<AccountAvatar state={state} />}
            title={
              <Text fw={600} lh={1} ff={isLinked ? 'monospace' : undefined} truncate>
                {isLinked ? DEMO_LOGIN : 'Аккаунт не привязан'}
              </Text>
            }
            description={
              <Text fz={12} lh={1.2} c={isLinked ? `${getStateColor(state)}.6` : 'dimmed'}>
                {isLinked ? getStateLabel(state) : 'Один вход для всех источников ниже'}
              </Text>
            }
            action={<AccountAction state={state} />}
          />
          <Box
            pos="absolute"
            left={LINE_X}
            top="calc(50% + 20px)"
            bottom={0}
            style={{ borderLeft: line }}
          />
        </Box>
        {DEMO_SOURCES.map((source, index) => (
          <Box key={source.id} pos="relative">
            <Box
              pos="absolute"
              left={LINE_X}
              top={0}
              bottom={index === DEMO_SOURCES.length - 1 ? '50%' : 0}
              style={{ borderLeft: line }}
            />
            <Box
              pos="absolute"
              left={LINE_X}
              top="50%"
              w={TICK_WIDTH}
              style={{ borderTop: line }}
            />
            <Group
              justify="space-between"
              gap="md"
              wrap="nowrap"
              py={6}
              pr="md"
              pl={LINE_X + TICK_WIDTH + 6}
            >
              <Group gap="md" wrap="nowrap" miw={0}>
                <SourceIcon id={source.id} title={source.title} size={28} />
                <Stack gap={4} miw={0}>
                  <Text lh={1} fz={14}>
                    {source.title}
                  </Text>
                  <Text fz={12} c="dimmed" ff="monospace" lh={1.2} truncate>
                    {source.domain}
                  </Text>
                </Stack>
              </Group>
              <Switch defaultChecked aria-label={source.title} />
            </Group>
          </Box>
        ))}
      </Paper>
    </Stack>
  );
}

export default VariantTree;
