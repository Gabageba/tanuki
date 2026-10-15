import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BellIcon } from '@phosphor-icons/react';
import { fn } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import UndoToastMessage from './UndoToastMessage';

const ON_ACTION = fn().mockName('onAction');

/** Тост с отменой — так его показывают useRemoveTitleBookmark и useHideFromContinueReading. */
const showUndoToast = (message: string, actionLabel: string) =>
  notifications.show({
    autoClose: false,
    message: <UndoToastMessage message={message} actionLabel={actionLabel} onAction={ON_ACTION} />,
  });

const META = {
  title: 'Тосты/UndoToastMessage',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const RemovedFromBookmarks: Story = {
  name: 'Убрано из закладок',
  render: () => (
    <Button
      m="md"
      variant="default"
      leftSection={<BellIcon />}
      onClick={() => showUndoToast(I18N.t('removedFromBookmarks'), I18N.t('restore'))}
    >
      Показать
    </Button>
  ),
  play: () => {
    showUndoToast(I18N.t('removedFromBookmarks'), I18N.t('restore'));
  },
};

export const RemovedFromContinueReading: Story = {
  name: 'Убрано из «Продолжить чтение»',
  render: () => (
    <Button
      m="md"
      variant="default"
      leftSection={<BellIcon />}
      onClick={() => showUndoToast(I18N.t('titleRemovedFromContinueReading'), I18N.t('cancel'))}
    >
      Показать
    </Button>
  ),
  play: () => {
    showUndoToast(I18N.t('titleRemovedFromContinueReading'), I18N.t('cancel'));
  },
};
