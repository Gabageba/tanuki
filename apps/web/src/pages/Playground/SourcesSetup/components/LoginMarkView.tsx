import { ActionIcon, Badge, Text, Tooltip } from '@mantine/core';
import { getLoginMarkColor, getLoginMarkLabel } from '../lib';
import { LOGIN_MARK, MARK_PLACEMENT, type LoginMark, type MarkPlacement } from '../models';
import { getLoginMarkIcon } from './lib';

type Props = {
  mark: LoginMark;
  placement: MarkPlacement;
};

/** Пометка о входе в строке настроек. В настоящем экране клик ведёт на вкладку аккаунтов профиля. */
function LoginMarkView({ mark, placement }: Props) {
  const color = getLoginMarkColor(mark);
  const label = getLoginMarkLabel(mark);
  const isOptional = mark === LOGIN_MARK.OPTIONAL;

  switch (placement) {
    case MARK_PLACEMENT.TITLE:
      return (
        <Badge variant={isOptional ? 'outline' : 'light'} color={color} size="sm" flex="none">
          {label}
        </Badge>
      );
    case MARK_PLACEMENT.DESCRIPTION:
      return (
        <Text span fz={12} c={isOptional ? 'dimmed' : color} flex="none">
          {label}
        </Text>
      );
    case MARK_PLACEMENT.ACTION:
      return (
        <Tooltip label={label}>
          <ActionIcon variant={isOptional ? 'subtle' : 'light'} color={color} aria-label={label}>
            {getLoginMarkIcon(mark)}
          </ActionIcon>
        </Tooltip>
      );
  }
}

export default LoginMarkView;
