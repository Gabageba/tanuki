import type { ReactNode } from 'react';
import { ActionIcon, Group, Paper, Stack, Text } from '@mantine/core';
import { XIcon, type Icon } from '@phosphor-icons/react';
import GoBackButton from '@/shared/ui/GoBackButton';
import { getModalToneColor, type ModalTone } from '@/shared/ui/ToneModal/models';

type Props = {
  title: ReactNode;
  tone: ModalTone;
  icon: Icon;
  children: ReactNode;
  w?: number;
  /** Модалка на телефоне — в ширину экрана 375 px, по высоте содержимого. */
  isPhone?: boolean;
  /** Внутренний шаг: на месте иконки тона — «Назад», как в `ToneModal`. */
  onBack?: () => void;
};

const PHONE_WIDTH = 375;

/** Модалка, нарисованная прямо на странице, чтобы варианты стояли рядом: шапка как у `ToneModal`
 *  — иконка тона 20 px (или «Назад»), заголовок, крестик. */
function ModalFrame({
  title,
  tone,
  icon: ToneIcon,
  children,
  w = 440,
  isPhone = false,
  onBack,
}: Props) {
  return (
    <Paper withBorder shadow="md" radius="md" p="md" w={isPhone ? PHONE_WIDTH : w} maw="100%">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="xs" wrap="nowrap" miw={0}>
            {onBack ? (
              <GoBackButton onClick={onBack} />
            ) : (
              <ToneIcon size={20} color={getModalToneColor(tone)} style={{ flex: 'none' }} />
            )}
            <Text component="div" fw={600} miw={0}>
              {title}
            </Text>
          </Group>
          <ActionIcon variant="subtle" color="gray" aria-label="Закрыть" flex="none">
            <XIcon />
          </ActionIcon>
        </Group>
        {children}
      </Stack>
    </Paper>
  );
}

export default ModalFrame;
