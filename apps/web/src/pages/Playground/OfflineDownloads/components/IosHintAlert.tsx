import { Alert, Button, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { ClockIcon, DeviceMobileIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { IOS_HINT_LOOK, type IosHintLook } from '../models';

type Props = {
  look: IosHintLook;
  onDismiss?: () => void;
};

const TITLE = 'Установите Tanuki на экран Домой';
const DETAIL =
  'Без установки Safari удаляет скачанное, если не открывать сайт 7 дней. «Поделиться» → «На экран Домой».';

const getColor = (look: IosHintLook) => {
  switch (look) {
    case IOS_HINT_LOOK.ACCENT:
      return PRIMARY_COLOR;
    case IOS_HINT_LOOK.GOLD:
      return STATUS_DEGRADED_COLOR;
    case IOS_HINT_LOOK.GRAY:
    case IOS_HINT_LOOK.ICON:
    case IOS_HINT_LOOK.STRIPE:
      return 'gray';
  }
};

/** Блок «Установите Tanuki на экран Домой» вверху «Загрузок» в виде M3 с компактным «Не сейчас»:
 *  H5 — серый, H9 — акцентный, H10 — серый с акцентным значком 32 px, H11 — серый с акцентной
 *  полосой слева, H12 — золотой. */
function IosHintAlert({ look, onDismiss }: Props) {
  const isBigIcon = look === IOS_HINT_LOOK.ICON;

  const body = (
    <Stack gap="sm">
      <Text fz={13} c="dimmed">
        {DETAIL}
      </Text>
      <Button
        size="xs"
        variant="default"
        w="fit-content"
        leftSection={<ClockIcon />}
        onClick={onDismiss}
      >
        Не сейчас
      </Button>
    </Stack>
  );

  return (
    <Alert
      variant="muted"
      color={getColor(look)}
      icon={isBigIcon ? undefined : <DeviceMobileIcon />}
      title={isBigIcon ? undefined : TITLE}
      style={
        look === IOS_HINT_LOOK.STRIPE
          ? { borderLeft: '3px solid var(--mantine-primary-color-filled)' }
          : undefined
      }
    >
      {isBigIcon ? (
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <ThemeIcon size={32} radius="md" color={PRIMARY_COLOR}>
            <DeviceMobileIcon size={18} />
          </ThemeIcon>
          <Stack gap={4} miw={0}>
            <Text fz="sm" fw={600}>
              {TITLE}
            </Text>
            {body}
          </Stack>
        </Group>
      ) : (
        body
      )}
    </Alert>
  );
}

export default IosHintAlert;
