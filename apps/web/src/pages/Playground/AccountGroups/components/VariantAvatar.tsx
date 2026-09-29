import { Text } from '@mantine/core';
import { getStateColor, getStateLabel } from '../lib';
import { ACCOUNT_STATE, DEMO_LOGIN, DEMO_SOURCES, type VariantProps } from '../models';
import AccountAction from './AccountAction';
import AccountAvatar from './AccountAvatar';
import DemoGroup from './DemoGroup';
import DemoSourceRow from './DemoSourceRow';
import HeaderLayout from './HeaderLayout';

/**
 * H2 — аватар вместо безликой иконки. Пустой пунктирный кружок против цветного с инициалами —
 * разница «вошли / нет» видна боковым зрением, ещё до чтения текста.
 */
function VariantAvatar({ state }: VariantProps) {
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
            {isLinked
              ? `${getStateLabel(state)} — действует на все источники ниже`
              : 'Один аккаунт на все источники ниже'}
          </Text>
        }
        action={<AccountAction state={state} />}
      />
      {DEMO_SOURCES.map((source) => (
        <DemoSourceRow key={source.id} source={source} />
      ))}
    </DemoGroup>
  );
}

export default VariantAvatar;
