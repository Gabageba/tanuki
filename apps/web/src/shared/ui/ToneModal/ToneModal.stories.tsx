import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Icon } from '@phosphor-icons/react';
import { Button, Stack, Text } from '@mantine/core';
import {
  BroomIcon,
  CheckCircleIcon,
  CheckIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { fn } from 'storybook/test';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import ModalStage from '@/shared/storybook/ModalStage';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MODAL_TONE, type ModalTone } from './models';
import ToneModal from '.';

type ToneExample = {
  tone: ModalTone;
  icon: Icon;
  title: string;
  color?: string;
};

/** Тон — по обратимости действия, цвет кнопки повторяет тон (docs/11-ui-decisions.md). */
const stageTone = ({ tone, icon: ToneIcon, title, color }: ToneExample, onBack?: () => void) => (
  <ModalStage>
    {({ opened, close }) => (
      <ToneModal
        opened={opened}
        onClose={close}
        tone={tone}
        icon={ToneIcon}
        title={title}
        onBack={onBack}
      >
        <Stack gap="md">
          <Stack gap={6}>
            <Text fz="sm">Главная фраза — что произойдёт.</Text>
            <Text c="dimmed" fz={13}>
              Пояснение под ней: мелким и приглушённым.
            </Text>
          </Stack>
          <ModalButtonsLayout>
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button color={color} leftSection={<ToneIcon />} onClick={close}>
              Подтвердить
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </ToneModal>
    )}
  </ModalStage>
);

const META = {
  title: 'Модалки/ToneModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Danger: Story = {
  name: 'danger — необратимо',
  render: () =>
    stageTone({ tone: MODAL_TONE.DANGER, icon: TrashIcon, title: 'Удалить', color: 'red' }),
};

export const Warning: Story = {
  name: 'warning — что-то сбросится',
  render: () =>
    stageTone({
      tone: MODAL_TONE.WARNING,
      icon: BroomIcon,
      title: 'Сбросить',
      color: STATUS_DEGRADED_COLOR,
    }),
};

export const Neutral: Story = {
  name: 'neutral — обычная форма',
  render: () => stageTone({ tone: MODAL_TONE.NEUTRAL, icon: PencilSimpleIcon, title: 'Изменить' }),
};

export const Success: Story = {
  name: 'success — результат',
  render: () =>
    stageTone({ tone: MODAL_TONE.SUCCESS, icon: CheckCircleIcon, title: 'Готово', color: 'teal' }),
};

export const InnerStep: Story = {
  name: 'Внутренний шаг — «Назад» вместо иконки',
  render: () =>
    stageTone(
      { tone: MODAL_TONE.NEUTRAL, icon: CheckIcon, title: 'Второй шаг' },
      fn().mockName('onBack'),
    ),
};
