import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@mantine/core';
import { BellIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { fn } from 'storybook/test';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_KIND, TOAST_PAUSE, type ToastInput } from '@/shared/lib/toasts/models';
import { I18N } from '@/shared/lib/i18n';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';

const ON_OPEN = fn();
const show = (input: ToastInput) => {
  const id = Toasts.show(input);
  Toasts.pause(id, TOAST_PAUSE.HOVER, true);
};
const SUCCESS = () => ({ title: I18N.t('linkCopied'), tone: FEEDBACK_TONE.SUCCESS });
const META = {
  title: 'Тосты/ToastCard',
  render: () => (
    <Button m="md" leftSection={<BellIcon />} onClick={() => show(SUCCESS())}>
      Показать сообщение
    </Button>
  ),
} satisfies Meta;
export default META;
type Story = StoryObj<typeof META>;

export const Success: Story = { name: 'Успех', play: () => show(SUCCESS()) };
export const Warning: Story = {
  name: 'Предупреждение',
  play: () => show({ title: I18N.t('sourceUnavailable'), tone: FEEDBACK_TONE.WARNING }),
};
export const Danger: Story = {
  name: 'Ошибка',
  play: () =>
    show({
      title: I18N.t('failedToSave'),
      description: I18N.t('noConnectionToServer'),
      tone: FEEDBACK_TONE.DANGER,
    }),
};
export const Neutral: Story = {
  name: 'Нейтральное сообщение',
  play: () => show({ title: I18N.t('checkFinished') }),
};
export const Accent: Story = {
  name: 'Акцент',
  play: () => show({ title: I18N.t('updateAvailable'), tone: FEEDBACK_TONE.ACCENT }),
};
export const Event: Story = {
  name: 'Событие безопасности',
  play: () =>
    show({
      title: I18N.t('emailChanged'),
      description: I18N.t('allDevicesSignedOut'),
      tone: FEEDBACK_TONE.DANGER,
      kind: TOAST_KIND.SECURITY,
      icon: <ShieldCheckIcon size={20} />,
      onOpen: ON_OPEN,
    }),
};
export const LongText: Story = {
  name: 'Длинный текст',
  play: () =>
    show({
      title:
        'Не удалось сохранить изменения для очень длинного названия тайтла, которое переносится на несколько строк',
      description:
        'The server is temporarily unavailable. Your changes have not been saved. Please try again later without closing this page.',
      tone: FEEDBACK_TONE.DANGER,
    }),
};
export const Mobile: Story = {
  ...LongText,
  name: 'Длинный текст на телефоне',
  globals: MOBILE_GLOBALS,
};
export const SimpleMultiline: Story = {
  name: 'Простой заголовок с переносом',
  play: () =>
    show({
      title: 'Результат операции с очень длинным названием переносится на несколько строк',
      tone: FEEDBACK_TONE.SUCCESS,
    }),
};
