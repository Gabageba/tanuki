import { Indicator, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getStateColor, getStateLabel } from '../lib';
import { ACCOUNT_STATE, DEMO_LOGIN, DEMO_SOURCES, type VariantProps } from '../models';
import AccountAction from './AccountAction';
import AccountAvatar from './AccountAvatar';
import DemoGroup from './DemoGroup';
import DemoSourceRow from './DemoSourceRow';
import HeaderLayout from './HeaderLayout';

/**
 * H6 — H2, плюс статус повторён на каждом источнике точкой на иконке: даже проскроллив шапку,
 * видно, что читаешь через свой аккаунт. Пока не вошли — точек нет вовсе.
 */
function VariantSourceMarks({ state }: VariantProps) {
  const isLinked = state !== ACCOUNT_STATE.NONE;

  return (
    <DemoGroup>
      <HeaderLayout
        bg="var(--mantine-color-default-hover)"
        icon={<AccountAvatar state={state} size={40} />}
        title={
          <Text fw={600} lh={1} ff={isLinked ? 'monospace' : undefined} truncate>
            {isLinked ? DEMO_LOGIN : 'Вы не вошли'}
          </Text>
        }
        description={
          <Text fz={12} lh={1.2} c={isLinked ? `${getStateColor(state)}.6` : 'dimmed'}>
            {isLinked ? getStateLabel(state) : 'Один аккаунт на все источники ниже'}
          </Text>
        }
        action={<AccountAction state={state} />}
      />
      {DEMO_SOURCES.map((source) => (
        <DemoSourceRow
          key={source.id}
          source={source}
          icon={
            <Indicator
              color={getStateColor(state)}
              size={10}
              offset={3}
              position="bottom-end"
              withBorder
              disabled={!isLinked}
            >
              <SourceIcon id={source.id} title={source.title} size={32} />
            </Indicator>
          }
        />
      ))}
    </DemoGroup>
  );
}

export default VariantSourceMarks;
