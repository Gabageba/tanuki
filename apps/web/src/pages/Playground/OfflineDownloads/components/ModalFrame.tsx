import type { ReactNode } from 'react';
import { ActionIcon, Group, Paper, Stack, Text } from '@mantine/core';
import { XIcon, type Icon } from '@phosphor-icons/react';
import { getModalToneColor, type ModalTone } from '@/shared/ui/ToneModal/models';

type Props = {
  title: string;
  tone: ModalTone;
  icon: Icon;
  children: ReactNode;
  w?: number;
};

/** Модалка, нарисованная прямо на странице, чтобы варианты стояли рядом: шапка как у `ToneModal`
 *  — иконка тона 20 px, заголовок, крестик. */
function ModalFrame({ title, tone, icon: ToneIcon, children, w = 440 }: Props) {
  return (
    <Paper withBorder shadow="md" radius="md" p="md" w={w} maw="100%">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <ToneIcon size={20} color={getModalToneColor(tone)} style={{ flex: 'none' }} />
            <Text fw={600}>{title}</Text>
          </Group>
          <ActionIcon variant="subtle" color="gray" aria-label="Закрыть">
            <XIcon />
          </ActionIcon>
        </Group>
        {children}
      </Stack>
    </Paper>
  );
}

export default ModalFrame;
