import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@mantine/core';
import { BellIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';
import { fn } from 'storybook/test';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_KIND } from '@/shared/lib/toasts/models';
import { I18N } from '@/shared/lib/i18n';
import UndoToastMessage from './UndoToastMessage';

const ON_ACTION = fn().mockName('onAction');

/** Тост с отменой — так его показывают useRemoveTitleBookmark и useHideFromContinueReading. */
const showUndoToast = (message: string, actionLabel: string) => {
  const id = Toasts.show({
    kind: TOAST_KIND.UNDO,
    tone: FEEDBACK_TONE.ACCENT,
    icon: <BookmarkSimpleIcon size={20} />,
    title: message,
    actions: (
      <UndoToastMessage
        actionsOnly
        actionLabel={actionLabel}
        onAction={() => Toasts.act(id, ON_ACTION)}
      />
    ),
  });
  return id;
};

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
      onClick={() => showUndoToast(I18N.t('removedFromBookmarks'), I18N.t('restoreBookmark'))}
    >
      Показать
    </Button>
  ),
  play: () => {
    showUndoToast(I18N.t('removedFromBookmarks'), I18N.t('restoreBookmark'));
  },
};

export const RemovedFromContinueReading: Story = {
  name: 'Убрано из «Продолжить чтение»',
  render: () => (
    <Button
      m="md"
      variant="default"
      leftSection={<BellIcon />}
      onClick={() =>
        showUndoToast(I18N.t('titleRemovedFromContinueReading'), I18N.t('restoreTitle'))
      }
    >
      Показать
    </Button>
  ),
  play: () => {
    showUndoToast(I18N.t('titleRemovedFromContinueReading'), I18N.t('restoreTitle'));
  },
};
