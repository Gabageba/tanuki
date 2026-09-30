import { Button } from '@mantine/core';
import { getAccountStateColor } from '../../SourcesSetup/lib';
import type { AccountState } from '../../SourcesSetup/models';
import { getLoginActionLabel } from '../lib';
import { getLoginActionIcon } from './lib';

type Props = {
  state: AccountState;
};

/** «Войти» или «Войти заново» — в цвете состояния; там, где вход выполнен, кнопки нет. */
function LoginActionButton({ state }: Props) {
  const label = getLoginActionLabel(state);
  if (!label) return null;

  return (
    <Button
      variant="subtle"
      size="xs"
      flex="none"
      color={getAccountStateColor(state)}
      leftSection={getLoginActionIcon(state)}
    >
      {label}
    </Button>
  );
}

export default LoginActionButton;
