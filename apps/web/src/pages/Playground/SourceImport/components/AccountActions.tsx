import { ActionIcon, Button, Group, Tooltip } from '@mantine/core';
import { CloudArrowDownIcon, LinkBreakIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import { HEADER_BUTTON, type HeaderButton } from '../models';

type Props = {
  button: HeaderButton;
  isPhone: boolean;
};

const FULL_LABEL = 'Импортировать закладки';

/** Действия в шапке вошедшей сети: импорт по оси H рядом с уже существующим «Отвязать». На
 *  телефоне кнопки, как в приложении, встают под шапку во всю ширину. */
function AccountActions({ button, isPhone }: Props) {
  const flex = isPhone ? 1 : 'none';

  const getImport = () => {
    switch (button) {
      case HEADER_BUTTON.NONE:
        return null;
      case HEADER_BUTTON.MUTED:
        return (
          <Button
            size="xs"
            flex={flex}
            variant="muted"
            color={PRIMARY_COLOR}
            leftSection={<CloudArrowDownIcon />}
          >
            {FULL_LABEL}
          </Button>
        );
      case HEADER_BUTTON.DEFAULT:
        return (
          <Button size="xs" flex={flex} variant="default" leftSection={<CloudArrowDownIcon />}>
            {FULL_LABEL}
          </Button>
        );
      case HEADER_BUTTON.SUBTLE:
        return (
          <Button size="xs" flex={flex} variant="subtle" leftSection={<CloudArrowDownIcon />}>
            {FULL_LABEL}
          </Button>
        );
      case HEADER_BUTTON.ICON:
        return (
          <Tooltip label={FULL_LABEL}>
            <ActionIcon size={30} variant="default" aria-label={FULL_LABEL}>
              <CloudArrowDownIcon />
            </ActionIcon>
          </Tooltip>
        );
      case HEADER_BUTTON.SHORT_ON_PHONE:
        return (
          <Button size="xs" flex={flex} variant="default" leftSection={<CloudArrowDownIcon />}>
            {isPhone ? 'Импорт' : FULL_LABEL}
          </Button>
        );
      case HEADER_BUTTON.ICON_ON_PHONE:
        return isPhone ? (
          <ActionIcon size={30} variant="default" aria-label={FULL_LABEL}>
            <CloudArrowDownIcon />
          </ActionIcon>
        ) : (
          <Button size="xs" variant="default" leftSection={<CloudArrowDownIcon />}>
            {FULL_LABEL}
          </Button>
        );
    }
  };

  return (
    <Group gap={8} wrap="nowrap" w={isPhone ? '100%' : 'auto'}>
      {getImport()}
      <Button size="xs" flex={flex} variant="muted" color="red" leftSection={<LinkBreakIcon />}>
        Отвязать
      </Button>
    </Group>
  );
}

export default AccountActions;
